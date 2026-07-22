"""
API Router — Interviews endpoints.

Maneja:
- POST /api/interviews/start: genera preguntas del Tech_Lead
- POST /api/interviews/evaluate: evalúa respuestas del usuario
"""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.config import get_settings
from app.models.review import InterviewStartRequest, InterviewAnswersRequest
from app.models.ticket import EstadoTicket
from app.services.db_service import DBService, DBServiceError, RecordNotFoundError
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


# ============================================================
# ENDPOINT: POST /api/interviews/start
# ============================================================


@router.post(
    "/start",
    summary="Iniciar entrevista — genera preguntas del Tech Lead",
    responses={
        200: {"description": "Preguntas generadas"},
        400: {"description": "Ticket no está en estado in_review"},
        503: {"description": "El Tech Lead no pudo generar preguntas"},
    },
)
async def start_interview(
    request: InterviewStartRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Inicia la entrevista simulada para un ticket.

    FLUJO:
    1. Verificar que el ticket está en estado in_review
    2. Obtener el diff del último commit (guardado o re-obtenido)
    3. Llamar al Tech_Lead agent con ticket + diff
    4. Devolver 2-3 preguntas al frontend

    TIMEOUT: 30 segundos para la generación de preguntas.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # --- Verificar que el ticket existe y está en in_review ---
    try:
        ticket = await db.get_ticket(str(request.ticket_id))
    except RecordNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo obtener el ticket")

    if ticket["estado"] != EstadoTicket.IN_REVIEW.value:
        raise HTTPException(
            status_code=400,
            detail=f"El ticket debe estar en estado 'in_review' para iniciar la entrevista. Estado actual: '{ticket['estado']}'"
        )

    # --- Obtener diff (re-obtener del commit) ---
    try:
        project = await db.get_project(ticket["project_id"])
    except (RecordNotFoundError, DBServiceError):
        raise HTTPException(status_code=500, detail="No se pudo obtener el proyecto")

    import re
    match = re.match(
        r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$",
        project["repo_url"].strip(),
    )
    if not match:
        raise HTTPException(status_code=500, detail="URL del proyecto es inválida")

    owner, repo = match.group(1), match.group(2)

    from app.services.github_service import GitHubService, GitHubServiceError
    github = GitHubService(token=settings.GITHUB_TOKEN)

    try:
        commit = await github.get_last_commit(owner, repo)
    except GitHubServiceError as e:
        logger.error(f"GitHub error getting commit for interview: {e}")
        raise HTTPException(status_code=503, detail="No se pudo obtener el diff del commit")

    # Construir diff relevante
    project_files = set(project["archivos_seleccionados"])
    relevant_diffs = [
        f["patch"]
        for f in commit["files"]
        if f["filename"] in project_files and f.get("patch")
    ]
    diff = "\n\n".join(relevant_diffs) if relevant_diffs else "No diff available"

    # --- Llamar al Tech_Lead ---
    try:
        from app.ai.providers import get_provider
        from app.ai.agents.tech_lead import generate_questions

        provider = get_provider()

        # Construir TicketData desde los datos de DB
        from app.models.ticket import TicketData, Prioridad, Dificultad
        ticket_data = TicketData(
            titulo=ticket["titulo"],
            descripcion=ticket["descripcion"],
            prioridad=Prioridad(ticket["prioridad"]),
            dificultad=Dificultad(ticket["dificultad"]),
            tiempo_estimado_minutos=60,  # Aproximación desde el texto
        )

        questions = await asyncio.wait_for(
            generate_questions(provider, ticket_data, diff),
            timeout=30.0,
        )
        # generate_questions returns TechLeadResult wrapper — extract the list
        if hasattr(questions, 'preguntas'):
            questions = questions.preguntas

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=503,
            detail="La generación de preguntas excedió el tiempo límite (30s). Intenta de nuevo."
        )
    except ImportError:
        # Mock si los agentes no están listos
        logger.warning("Tech_Lead agent not available, using mock questions")
        questions = [
            "¿Por qué elegiste este enfoque para resolver el problema?",
            "¿Qué alternativa consideraste y por qué la descartaste?",
            "¿Cómo verificarías que tu solución funciona correctamente?",
        ]
    except Exception as e:
        logger.error(f"Tech_Lead error: {e}")
        raise HTTPException(
            status_code=503,
            detail="La entrevista no pudo iniciarse. Intenta de nuevo."
        )

    return {
        "ticket_id": str(request.ticket_id),
        "questions": questions,
    }


# ============================================================
# ENDPOINT: POST /api/interviews/evaluate
# ============================================================


@router.post(
    "/evaluate",
    summary="Evaluar respuestas del usuario",
    responses={
        200: {"description": "Evaluación completada"},
        400: {"description": "Datos inválidos"},
        503: {"description": "El Evaluator no pudo completar la evaluación"},
    },
)
async def evaluate_answers(
    request: InterviewAnswersRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Evalúa las respuestas del usuario y decide si aprueba el ticket.

    FLUJO:
    1. Validar que questions y answers tienen el mismo largo
    2. Obtener ticket y diff
    3. Llamar al Evaluator agent
    4. Guardar review en DB
    5. Actualizar estado del ticket (done si aprobado, mantener in_review si no)
    6. Devolver feedback al frontend
    """
    # Validar que hay misma cantidad de preguntas y respuestas
    if len(request.questions) != len(request.answers):
        raise HTTPException(
            status_code=400,
            detail="La cantidad de respuestas debe coincidir con la cantidad de preguntas"
        )

    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # --- Obtener ticket ---
    try:
        ticket = await db.get_ticket(str(request.ticket_id))
    except RecordNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    except DBServiceError:
        raise HTTPException(status_code=500, detail="No se pudo obtener el ticket")

    # --- Obtener diff ---
    try:
        project = await db.get_project(ticket["project_id"])
    except (RecordNotFoundError, DBServiceError):
        raise HTTPException(status_code=500, detail="No se pudo obtener el proyecto")

    import re
    match = re.match(
        r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$",
        project["repo_url"].strip(),
    )

    diff = ""
    if match:
        owner, repo = match.group(1), match.group(2)
        from app.services.github_service import GitHubService, GitHubServiceError
        github = GitHubService(token=settings.GITHUB_TOKEN)
        try:
            commit = await github.get_last_commit(owner, repo)
            project_files = set(project["archivos_seleccionados"])
            relevant_diffs = [
                f["patch"]
                for f in commit["files"]
                if f["filename"] in project_files and f.get("patch")
            ]
            diff = "\n\n".join(relevant_diffs)
        except GitHubServiceError:
            diff = "Diff no disponible"

    # --- Llamar al Evaluator ---
    try:
        from app.ai.providers import get_provider
        from app.ai.agents.evaluator import evaluate_answers as ai_evaluate
        from app.models.ticket import TicketData, Prioridad, Dificultad

        provider = get_provider()

        ticket_data = TicketData(
            titulo=ticket["titulo"],
            descripcion=ticket["descripcion"],
            prioridad=Prioridad(ticket["prioridad"]),
            dificultad=Dificultad(ticket["dificultad"]),
            tiempo_estimado_minutos=60,
        )

        result = await asyncio.wait_for(
            ai_evaluate(provider, ticket_data, diff, request.questions, request.answers),
            timeout=30.0,
        )
        feedback = result.feedback
        aprobado = result.aprobado

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=503,
            detail="La evaluación excedió el tiempo límite (30s). Intenta de nuevo."
        )
    except ImportError:
        # Mock si el Evaluator no está listo
        logger.warning("Evaluator agent not available, using mock evaluation")
        feedback = "Buenas respuestas. Demuestran comprensión del problema y la solución implementada."
        aprobado = True
    except Exception as e:
        logger.error(f"Evaluator error: {e}")
        raise HTTPException(
            status_code=503,
            detail="La evaluación no pudo completarse. Intenta de nuevo."
        )

    # --- Guardar review en DB ---
    try:
        respuestas_texto = " | ".join(request.answers)
        await db.create_review(
            ticket_id=request.ticket_id,
            preguntas=request.questions,
            respuestas=respuestas_texto,
            feedback=feedback,
            aprobado=aprobado,
        )
    except DBServiceError as e:
        logger.error(f"Error saving review: {e}")
        # No lanzar error — la evaluación ya se hizo, solo falla persistencia

    # --- Actualizar estado del ticket ---
    try:
        if aprobado:
            await db.update_ticket_state(str(request.ticket_id), EstadoTicket.DONE)
        # Si no aprobado, se mantiene en in_review (no cambia)
    except DBServiceError as e:
        logger.error(f"Error updating ticket state: {e}")

    return {
        "feedback": feedback,
        "aprobado": aprobado,
    }
