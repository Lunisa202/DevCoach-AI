"""Pydantic models for the ranking/leaderboard feature."""

from pydantic import BaseModel
from uuid import UUID


class RankingEntry(BaseModel):
    """
    Una entrada del leaderboard: representa la posición pública de un usuario.

    Solo expone datos seguros para ser mostrados a otros usuarios:
    display_name (alias o full_name), puntaje y métricas de apoyo.
    Nunca incluye email ni cualquier otro dato personal.
    """
    user_id: UUID
    position: int
    display_name: str
    score: int
    approved_reviews_count: int
    completed_tickets_count: int
    is_current_user: bool = False


class RankingResponse(BaseModel):
    """
    Respuesta del endpoint GET /api/ranking.

    Contiene el Top_N ordenado del leaderboard y, cuando el current_user
    no cae dentro del Top_N, su posición y puntaje absolutos aparecen en
    `current_user`. Si el current_user sí está en `top`, su entrada allí
    lleva `is_current_user=True` y `current_user` va como None
    (Requirement 3.3).
    """
    top: list[RankingEntry]
    current_user: RankingEntry | None = None
