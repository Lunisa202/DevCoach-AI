"""Pydantic models for Review entity, interview requests, and AI outputs."""

from pydantic import BaseModel, Field
from uuid import UUID


# ============================================
# Modelos de la entrevista (requests/responses)
# ============================================

class InterviewStartRequest(BaseModel):
    """Request para iniciar la entrevista con el Tech_Lead."""
    ticket_id: UUID
    mode: str = Field(pattern="^(chat|llamada)$", description="Modo: 'chat' o 'llamada'")


class InterviewStartResponse(BaseModel):
    """Response con las preguntas generadas por el Tech_Lead."""
    ticket_id: UUID
    questions: list[str] = Field(min_length=2, max_length=3)


class InterviewAnswersRequest(BaseModel):
    """Request con las respuestas del usuario a las preguntas."""
    ticket_id: UUID
    questions: list[str] = Field(min_length=2, max_length=3)
    answers: list[str] = Field(min_length=2, max_length=3)


class EvaluationResponse(BaseModel):
    """Response del Evaluator con feedback y aprobación."""
    feedback: str = Field(max_length=3000)
    aprobado: bool


# ============================================
# Modelo de Review (persistencia)
# ============================================

class ReviewResponse(BaseModel):
    """Respuesta de la API al devolver una review."""
    id: UUID
    ticket_id: UUID
    preguntas_generadas: list[str]
    respuesta_usuario: str
    feedback_evaluator: str
    aprobado: bool

    class Config:
        from_attributes = True


# ============================================
# Modelos de salida de agentes de IA
# (Compartidos con Génesis — él los importa desde aquí)
# ============================================

class CodeReviewResult(BaseModel):
    """
    Salida del Code_Reviewer.
    Génesis retorna esto desde ai/code_reviewer.py.
    """
    fortalezas: list[str]
    debilidades: list[str]


class EvaluationResult(BaseModel):
    """
    Salida del Evaluator.
    Génesis retorna esto desde ai/evaluator.py.
    """
    feedback: str = Field(max_length=3000)
    aprobado: bool
