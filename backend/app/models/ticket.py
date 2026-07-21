"""Pydantic models for Ticket entity and AI-generated ticket data."""

from pydantic import BaseModel, Field
from uuid import UUID
from enum import Enum


class Prioridad(str, Enum):
    """Valores permitidos para prioridad de ticket."""
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class Dificultad(str, Enum):
    """Valores permitidos para dificultad de ticket."""
    FACIL = "fácil"
    MEDIA = "media"
    DIFICIL = "difícil"


class EstadoTicket(str, Enum):
    """Estados posibles del ticket en el kanban."""
    TO_DO = "to_do"
    IN_REVIEW = "in_review"
    DONE = "done"


class TicketData(BaseModel):
    """
    Modelo que produce el Ticket_Generator (agente de IA).
    Génesis devuelve esto desde ai/ticket_generator.py.
    Camilo lo consume en api/projects.py para guardar en DB.
    """
    titulo: str = Field(max_length=120)
    descripcion: str
    prioridad: Prioridad
    dificultad: Dificultad
    tiempo_estimado_minutos: int = Field(ge=15, le=480)


class TicketResponse(BaseModel):
    """Respuesta de la API al devolver un ticket al frontend."""
    id: UUID
    project_id: UUID
    titulo: str = Field(max_length=200)
    descripcion: str = Field(max_length=2000)
    prioridad: Prioridad
    dificultad: Dificultad
    tiempo_estimado: str = Field(max_length=50)
    estado: EstadoTicket

    class Config:
        from_attributes = True


class VerifyTicketResponse(BaseModel):
    """Respuesta al verificar un commit para un ticket."""
    ticket: TicketResponse
    diff: str | None = None
    message: str | None = None
