"""
API Router — Projects endpoints.

LÓGICA DE NEGOCIO:
    Este archivo maneja los endpoints relacionados con "proyectos":
    - validate-repo: confirma que una URL de GitHub es un repo público válido
    - create project: (TODO) orquesta todo el pipeline de análisis

LÓGICA DE PROGRAMACIÓN:
    - Usa FastAPI Router para agrupar estos endpoints bajo el prefijo /api/projects
    - Importa GitHubService para la comunicación con GitHub
    - Importa modelos Pydantic para validar request/response automáticamente
    - Maneja excepciones del GitHubService y las traduce a respuestas HTTP apropiadas
"""

import re
import logging
import asyncio

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.project import (
    ProjectCreate,
    ProjectResponse,
    ValidateRepoRequest,
    ValidateRepoResponse,
)
from app.models.ticket import TicketResponse
from app.services.github_service import (
    GitHubService,
    RepoNotFoundError,
    GitHubTimeoutError,
    RateLimitExceededError,
    GitHubServiceError,
)
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

# Router agrupa estos endpoints — se registra en main.py con prefijo /api/projects
router = APIRouter(prefix="/api/projects", tags=["Projects"])

# ============================================================
# REGEX para validar formato de URL de GitHub
# ============================================================
# Acepta: https://github.com/owner/repo
# Acepta: https://github.com/owner/repo/ (con slash final)
# Rechaza: http://... (solo HTTPS)
# Rechaza: github.com/... (falta https://)
# Rechaza: https://github.com/owner (falta repo)
# ============================================================

GITHUB_REPO_PATTERN = re.compile(
    r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$"
)


def parse_github_url(url: str) -> tuple[str, str] | None:
    """
    Extrae owner y repo de una URL de GitHub.

    Ejemplos:
        "https://github.com/Lunisa202/DevCoach-AI" → ("Lunisa202", "DevCoach-AI")
        "https://github.com/owner/repo/"           → ("owner", "repo")
        "http://github.com/owner/repo"             → None (no es HTTPS)
        "https://github.com/solo-owner"            → None (falta repo)

    RETORNA:
        Tupla (owner, repo) si es válida, None si no.
    """
    match = GITHUB_REPO_PATTERN.match(url.strip())
    if not match:
        return None
    return match.group(1), match.group(2)


# ============================================================
# ENDPOINT: POST /api/projects/validate-repo
# ============================================================


@router.post(
    "/validate-repo",
    response_model=ValidateRepoResponse,
    summary="Validar URL de repositorio GitHub",
    responses={
        400: {"description": "Formato de URL inválido"},
        404: {"description": "Repositorio no encontrado o no es público"},
        503: {"description": "No se pudo conectar con GitHub"},
    },
)
async def validate_repo(request: ValidateRepoRequest):
    """
    Valida que una URL de GitHub apunta a un repositorio público existente.

    FLUJO:
    1. Recibe la URL del frontend (componente RepoInput de Carolina).
    2. Valida el FORMATO con regex — si no cumple, responde 400 inmediatamente
       (sin gastar una petición a GitHub).
    3. Si el formato es válido, llama a GitHub API para confirmar que el repo
       existe y es público.
    4. Devuelve owner y repo separados (el frontend los necesita para el siguiente paso).

    CÓDIGOS DE RESPUESTA:
        200: Repo válido → { valid: true, owner: "...", repo: "..." }
        400: Formato de URL no es https://github.com/owner/repo
        404: El repo no existe o es privado
        503: GitHub no respondió en 10 segundos o error de red

    CAROLINA LO LLAMA ASÍ (desde el frontend):
        fetch("/api/projects/validate-repo", {
            method: "POST",
            body: JSON.stringify({ repo_url: "https://github.com/user/repo" })
        })
    """

    # --- Paso 1: Validar formato con regex ---
    parsed = parse_github_url(request.repo_url)

    if parsed is None:
        raise HTTPException(
            status_code=400,
            detail="Formato de URL inválido. Debe ser: https://github.com/owner/repo"
        )

    owner, repo = parsed

    # --- Paso 2: Verificar contra GitHub API ---
    settings = get_settings()
    github = GitHubService(token=settings.GITHUB_TOKEN)

    try:
        await github.validate_repo(owner, repo)
    except RepoNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Repositorio no encontrado o no es público"
        )
    except GitHubTimeoutError:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con GitHub. Intenta de nuevo en unos segundos."
        )
    except RateLimitExceededError:
        raise HTTPException(
            status_code=503,
            detail="Se excedió el límite de peticiones a GitHub. Intenta en unos minutos."
        )
    except GitHubServiceError as e:
        # Error genérico de GitHub — loguear pero no exponer detalles
        logger.error(f"GitHub service error in validate-repo: {e}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con GitHub"
        )

    # --- Paso 3: Éxito — devolver owner y repo ---
    return ValidateRepoResponse(valid=True, owner=owner, repo=repo)


# ============================================================
# ENDPOINT: POST /api/projects
# ============================================================


@router.post(
    "",
    summary="Crear proyecto y ejecutar pipeline de análisis",
    responses={
        400: {"description": "Datos inválidos"},
        503: {"description": "Error de servicio externo (GitHub o IA)"},
        500: {"description": "Error interno de persistencia"},
    },
)
async def create_project(request: ProjectCreate):
    """
    Crea un proyecto, descarga archivos de GitHub, ejecuta el pipeline de IA
    (Code_Reviewer → Ticket_Generator) y devuelve el proyecto con sus 3 tickets.

    FLUJO COMPLETO:
    1. Validar formato de URL y extraer owner/repo
    2. Crear proyecto en Supabase
    3. Descargar contenido de los archivos seleccionados desde GitHub
    4. Pasar archivos al Code_Reviewer → obtener fortalezas/debilidades
    5. Pasar review al Ticket_Generator → obtener 3 tickets
    6. Guardar tickets en Supabase
    7. Devolver proyecto + tickets al frontend

    TIMEOUT: 60 segundos para el pipeline completo de IA.
    """
    # --- Paso 1: Validar URL ---
    parsed = parse_github_url(request.repo_url)
    if parsed is None:
        raise HTTPException(
            status_code=400,
            detail="Formato de URL inválido. Debe ser: https://github.com/owner/repo"
        )
    owner, repo = parsed

    settings = get_settings()
    github = GitHubService(token=settings.GITHUB_TOKEN)
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # --- Paso 2: Crear proyecto en DB ---
    try:
        project = await db.create_project(
            repo_url=request.repo_url,
            archivos_seleccionados=request.archivos_seleccionados,
        )
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo crear el proyecto")

    project_id = project["id"]

    # --- Paso 3: Descargar contenido de archivos desde GitHub ---
    try:
        files_content: dict[str, str] = {}
        for file_path in request.archivos_seleccionados:
            content = await github.get_file_content(owner, repo, file_path)
            files_content[file_path] = content
    except RepoNotFoundError:
        raise HTTPException(status_code=404, detail="No se pudo acceder al contenido del repositorio")
    except GitHubTimeoutError:
        raise HTTPException(status_code=503, detail="No se pudo conectar con GitHub")
    except RateLimitExceededError:
        raise HTTPException(status_code=503, detail="Se excedió el límite de peticiones a GitHub")
    except GitHubServiceError as e:
        logger.error(f"GitHub error fetching files: {e}")
        raise HTTPException(status_code=503, detail="No se pudo acceder al contenido del repositorio")

    # --- Paso 4 y 5: Pipeline de IA (Code_Reviewer → Ticket_Generator) ---
    try:
        from app.ai.providers import get_provider
        from app.ai.agents.code_reviewer import analyze_code
        from app.ai.agents.ticket_generator import generate_tickets

        provider = get_provider()

        # Ejecutar con timeout de 60 segundos
        review = await asyncio.wait_for(
            analyze_code(provider, files_content),
            timeout=60.0,
        )
        tickets_data = await asyncio.wait_for(
            generate_tickets(provider, review),
            timeout=60.0,
        )

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=503,
            detail="El análisis excedió el tiempo límite (60s). Intenta de nuevo."
        )
    except ImportError:
        # Los agentes de Génesis aún no están listos — usar mocks
        logger.warning("AI agents not available, using mock data")
        from app.models.review import CodeReviewResult
        from app.models.ticket import TicketData, Prioridad, Dificultad

        review = CodeReviewResult(
            fortalezas=["Código legible", "Buena estructura de archivos"],
            debilidades=["Falta manejo de errores", "No hay tests unitarios"],
        )
        tickets_data = [
            TicketData(titulo="Agregar manejo de errores", descripcion="Implementar try/except en las funciones principales para capturar errores inesperados", prioridad=Prioridad.ALTA, dificultad=Dificultad.MEDIA, tiempo_estimado_minutos=120),
            TicketData(titulo="Escribir tests unitarios", descripcion="Agregar tests con pytest para las funciones core del proyecto", prioridad=Prioridad.MEDIA, dificultad=Dificultad.FACIL, tiempo_estimado_minutos=90),
            TicketData(titulo="Documentar funciones públicas", descripcion="Agregar docstrings a todas las funciones públicas del módulo principal", prioridad=Prioridad.BAJA, dificultad=Dificultad.FACIL, tiempo_estimado_minutos=60),
        ]
    except Exception as e:
        logger.error(f"AI pipeline error: {e}")
        raise HTTPException(
            status_code=503,
            detail="El análisis no pudo completarse. Intenta de nuevo."
        )

    # --- Paso 6: Guardar tickets en DB ---
    try:
        tickets = await db.create_tickets(project_id, tickets_data)
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudieron guardar los tickets")

    # --- Paso 7: Respuesta ---
    return {
        "project": project,
        "tickets": tickets,
    }


# ============================================================
# ENDPOINT: GET /api/projects/{project_id}/tickets
# ============================================================


@router.get(
    "/{project_id}/tickets",
    summary="Obtener tickets de un proyecto",
    responses={
        404: {"description": "Proyecto no encontrado"},
        500: {"description": "Error de persistencia"},
    },
)
async def get_project_tickets(project_id: str):
    """
    Devuelve los tickets asociados a un proyecto.
    El frontend (Dashboard) llama a esto para mostrar los tickets en el kanban.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        tickets = await db.get_tickets_by_project(project_id)
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudieron obtener los tickets")

    return tickets
