"""Debug endpoints to test AI agents directly from Swagger UI.

These endpoints are for development/testing only — they let you send
custom inputs to each agent and see the raw output without needing the
full application flow. They should NOT be exposed in production.

All endpoints live under /api/ai-test/
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.providers.base import get_provider
from app.ai.agents.code_reviewer import analyze_code
from app.ai.agents.ticket_generator import generate_tickets
from app.ai.agents.tech_lead import generate_questions
from app.ai.agents.evaluator import evaluate_answers
from app.ai.schemas import (
    CodeReviewResult,
    TicketData,
    TicketGenerationResult,
    TechLeadResult,
    EvaluationResult,
)


router = APIRouter(prefix="/api/ai-test", tags=["AI Debug"])


# -----------------------------------------------------------------------------
# Request models
# -----------------------------------------------------------------------------


class CodeReviewRequest(BaseModel):
    """Dictionary mapping file paths to their content."""

    files: dict[str, str] = Field(
        ...,
        description="Mapping of file path to file content",
        examples=[
            {
                "utils.py": (
                    "def calc(x, y, op):\n"
                    "    if op == '/':\n"
                    "        return x / y\n"
                ),
                "user_service.py": (
                    "users = []\n"
                    "def add_user(name, email):\n"
                    "    users.append({'name': name, 'email': email})\n"
                ),
            }
        ],
    )


class TicketGeneratorRequest(BaseModel):
    review: CodeReviewResult = Field(
        ...,
        description="Code review result with fortalezas and debilidades",
        examples=[
            {
                "fortalezas": [
                    "Código simple y legible",
                    "Nombres descriptivos",
                ],
                "debilidades": [
                    "calc no maneja división por cero",
                    "Estado global mutable en user_service",
                    "Falta validación de inputs",
                ],
            }
        ],
    )


class TechLeadRequest(BaseModel):
    ticket: TicketData = Field(
        ...,
        description="The ticket that was resolved",
        examples=[
            {
                "titulo": "Agregar manejo de división por cero en calc",
                "descripcion": (
                    "La función calc no valida cuando el operador es '/' y y=0. "
                    "Agregar validación explícita."
                ),
                "prioridad": "alta",
                "dificultad": "fácil",
                "tiempo_estimado_minutos": 30,
            }
        ],
    )
    diff: str = Field(
        ...,
        description="Git diff of the commit that resolves the ticket",
        examples=[
            (
                "diff --git a/utils.py b/utils.py\n"
                "@@ -5,4 +5,8 @@ def calc(x, y, op):\n"
                "     if op == '/':\n"
                "+        if y == 0:\n"
                "+            raise ValueError('Division by zero')\n"
                "         return x / y\n"
            )
        ],
    )


class EvaluatorRequest(BaseModel):
    ticket: TicketData = Field(..., description="The resolved ticket")
    diff: str = Field(..., description="Git diff of the commit")
    questions: list[str] = Field(..., min_length=2, max_length=3)
    answers: list[str] = Field(..., min_length=2, max_length=3)


class ProviderInfo(BaseModel):
    provider: str
    ok: bool


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@router.get(
    "/provider",
    response_model=ProviderInfo,
    summary="Get current AI provider",
    description="Returns which AI provider is currently configured (gemini or groq).",
)
async def current_provider():
    try:
        provider = get_provider()
        return ProviderInfo(provider=type(provider).__name__, ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provider error: {e}")


@router.post(
    "/code-reviewer",
    response_model=CodeReviewResult,
    summary="Test the Code_Reviewer agent",
    description=(
        "Send a dict of {file_path: file_content} and get back "
        "fortalezas + debilidades identified by the AI."
    ),
)
async def test_code_reviewer(req: CodeReviewRequest):
    try:
        provider = get_provider()
        return await analyze_code(provider, req.files)
    except (ValueError, TimeoutError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post(
    "/ticket-generator",
    response_model=TicketGenerationResult,
    summary="Test the Ticket_Generator agent",
    description=(
        "Send a code review (fortalezas + debilidades) and get back "
        "exactly 3 improvement tickets."
    ),
)
async def test_ticket_generator(req: TicketGeneratorRequest):
    try:
        provider = get_provider()
        return await generate_tickets(provider, req.review)
    except (ValueError, TimeoutError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post(
    "/tech-lead",
    response_model=TechLeadResult,
    summary="Test the Tech_Lead agent",
    description=(
        "Send a ticket and a commit diff, get back 2-3 interview questions."
    ),
)
async def test_tech_lead(req: TechLeadRequest):
    try:
        provider = get_provider()
        return await generate_questions(provider, req.ticket, req.diff)
    except (ValueError, TimeoutError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post(
    "/evaluator",
    response_model=EvaluationResult,
    summary="Test the Evaluator agent",
    description=(
        "Send a ticket + diff + questions + answers, "
        "get back feedback and approval decision."
    ),
)
async def test_evaluator(req: EvaluatorRequest):
    if len(req.answers) != len(req.questions):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Answers count ({len(req.answers)}) must match "
                f"questions count ({len(req.questions)})"
            ),
        )
    try:
        provider = get_provider()
        return await evaluate_answers(
            provider, req.ticket, req.diff, req.questions, req.answers
        )
    except (ValueError, TimeoutError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=str(e))
