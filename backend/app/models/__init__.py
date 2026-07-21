"""
DevCoach AI — Pydantic Models

Todos los modelos del proyecto se importan desde aquí:
    from app.models import ProjectCreate, TicketData, CodeReviewResult, etc.
"""

from app.models.project import (
    ProjectCreate,
    ProjectResponse,
    ValidateRepoRequest,
    ValidateRepoResponse,
)
from app.models.ticket import (
    Prioridad,
    Dificultad,
    EstadoTicket,
    TicketData,
    TicketResponse,
    VerifyTicketResponse,
)
from app.models.review import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswersRequest,
    EvaluationResponse,
    ReviewResponse,
    CodeReviewResult,
    EvaluationResult,
)

__all__ = [
    # Project
    "ProjectCreate",
    "ProjectResponse",
    "ValidateRepoRequest",
    "ValidateRepoResponse",
    # Ticket
    "Prioridad",
    "Dificultad",
    "EstadoTicket",
    "TicketData",
    "TicketResponse",
    "VerifyTicketResponse",
    # Review & AI
    "InterviewStartRequest",
    "InterviewStartResponse",
    "InterviewAnswersRequest",
    "EvaluationResponse",
    "ReviewResponse",
    "CodeReviewResult",
    "EvaluationResult",
]
