"""
API Router — Tickets endpoints.

Maneja:
- POST /api/tickets/{id}/verify: verifica el último commit y decide si avanzar a entrevista.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.config import get_settings
from app.models.ticket import EstadoTicket
from app.services.github_service import (
    GitHubService,
    GitHubTimeoutError,
    RateLimitExceededError,
    GitHubServiceError,
)
from app.services.db_service import DBService, DBServiceError, RecordNotFoundError
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


# ============================================================
# ENDPOINT: POST /api/tickets/{ticket_id}/verify
# ============================================================


@router.post(
    "/{ticket_id}/verify",
    summary="Verificar commit del usuario para un ticket",
    responses={
        200: {"description": "Verificación exitosa, ticket pasa a in_review"},
        404: {"description": "Ticket no encontrado"},
        503: {"description": "Error al comunicarse con GitHub"},
    },
)
async def verify_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Verifica que el último commit del repo contiene cambios en archivos del proyecto.

    FLUJO:
    1. Obtener el ticket y su proyecto asociado
    2. Cambiar estado a in_review
    3. Obtener el último commit de la rama principal
    4. Comparar archivos modificados vs archivos del proyecto
    5. Si hay intersección → devolver diff + ticket en in_review
    6. Si NO hay intersección → revertir a to_do + mensaje

    ERRORES:
    - Si GitHub falla → revertir a to_do + error 503
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
    github = GitHubService(token=settings.GITHUB_TOKEN)

    # --- Paso 1: Obtener ticket ---
    try:
        ticket = await db.get_ticket(ticket_id)
    except RecordNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo obtener el ticket")

    # --- Obtener proyecto asociado ---
    try:
        project = await db.get_project(ticket["project_id"])
    except RecordNotFoundError:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo obtener el proyecto")

    # Extraer owner/repo de la URL
    import re
    match = re.match(
        r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$",
        project["repo_url"].strip(),
    )
    if not match:
        raise HTTPException(status_code=500, detail="URL del proyecto es inválida")

    owner, repo = match.group(1), match.group(2)

    # --- Paso 2: Cambiar estado a in_review ---
    try:
        await db.update_ticket_state(ticket_id, EstadoTicket.IN_REVIEW)
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el ticket")

    # --- Paso 3: Obtener último commit ---
    try:
        commit = await github.get_last_commit(owner, repo)
    except (GitHubTimeoutError, RateLimitExceededError, GitHubServiceError) as e:
        # Revertir estado
        try:
            await db.update_ticket_state(ticket_id, EstadoTicket.TO_DO)
        except DBServiceError:
            pass
        logger.error(f"GitHub error in verify: {e}")
        raise HTTPException(
            status_code=503,
            detail="La verificación falló. No se pudo conectar con GitHub."
        )

    # --- Paso 4: Comparar archivos ---
    project_files = set(project["archivos_seleccionados"])
    commit_files = set(f["filename"] for f in commit["files"])
    intersection = project_files & commit_files

    # --- Paso 4.5: Verificar que el commit es posterior al análisis ---
    from datetime import datetime, timezone
    commit_date_str = commit.get("date", "")
    if commit_date_str and project.get("fecha_analisis"):
        try:
            commit_date = datetime.fromisoformat(commit_date_str.replace("Z", "+00:00"))
            project_date = datetime.fromisoformat(str(project["fecha_analisis"]))
            if commit_date < project_date:
                # Commit es anterior al análisis — revertir
                try:
                    updated_ticket = await db.update_ticket_state(ticket_id, EstadoTicket.TO_DO)
                except DBServiceError:
                    updated_ticket = ticket
                    updated_ticket["estado"] = "to_do"
                return {
                    "ticket": updated_ticket,
                    "diff": None,
                    "message": "El último commit es anterior al análisis. Haz un commit nuevo con tu solución y vuelve a verificar.",
                }
        except (ValueError, TypeError):
            pass  # Si no se puede parsear la fecha, continuamos sin validar

    # --- Paso 5/6: Decidir ---
    if not intersection:
        # No hay cambios relevantes → revertir a to_do
        try:
            updated_ticket = await db.update_ticket_state(ticket_id, EstadoTicket.TO_DO)
        except DBServiceError:
            raise HTTPException(status_code=500, detail="Error actualizando el ticket")

        return {
            "ticket": updated_ticket,
            "diff": None,
            "message": "No se detectaron cambios en los archivos del proyecto en el último commit.",
        }

    # Hay cambios → construir diff de los archivos relevantes
    relevant_diffs = [
        f["patch"]
        for f in commit["files"]
        if f["filename"] in intersection and f.get("patch")
    ]
    full_diff = "\n\n".join(relevant_diffs)

    # Obtener ticket actualizado
    try:
        updated_ticket = await db.get_ticket(ticket_id)
    except DBServiceError:
        updated_ticket = ticket
        updated_ticket["estado"] = "in_review"

    return {
        "ticket": updated_ticket,
        "diff": full_diff,
        "message": f"Cambios detectados en {len(intersection)} archivo(s). Ticket en revisión.",
    }
