"""
API Router — Ranking / Leaderboard.

ENDPOINTS:
    GET /api/ranking?limit=10  → Top_N del leaderboard + posición del current_user

REGLAS:
    - Autenticación JWT obligatoria (Requirement 3.2).
    - limit ∈ [1, 100], default 10. Fuera de rango o no-entero → 422 (Req 3.6).
    - Solo entra al Top_N quien tenga proyectos registrados (Req 4.5).
    - Si el current_user está en el Top_N: marca su entrada con
      is_current_user=True y NO lo duplica en `current_user` (Req 3.3).
    - Si no está: `current_user` lleva su posición absoluta y su score (Req 3.4).
    - Si no hay leaderboard: `top=[]` y `current_user=None` (Req 3.7).
    - Error interno → 500 con mensaje genérico (Req 3.8).
"""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import get_settings
from app.models.ranking import RankingEntry, RankingResponse
from app.services.auth_service import get_current_user
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ranking", tags=["Ranking"])

# ─── Simple in-memory cache (TTL 30 seconds) ───
_cache: dict = {"data": None, "timestamp": 0}
_CACHE_TTL = 30  # seconds


@router.get(
    "",
    response_model=RankingResponse,
    summary="Get leaderboard Top_N and the current user's position",
    responses={
        401: {"description": "No autenticado"},
        422: {"description": "Parámetro limit inválido"},
        500: {"description": "Error interno al agregar el ranking"},
    },
)
async def get_ranking(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Tamaño del Top_N. Rango: 1..100. Default: 10.",
    ),
    current_user: dict = Depends(get_current_user),
) -> RankingResponse:
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
    current_user_id = str(current_user["id"])

    # Use cached leaderboard if fresh (< 30s old)
    now = time.time()
    if _cache["data"] is not None and (now - _cache["timestamp"]) < _CACHE_TTL:
        full = _cache["data"]
        logger.info(f"Ranking served from cache (age: {now - _cache['timestamp']:.1f}s)")
    else:
        try:
            t0 = time.time()
            full = await db.get_leaderboard()
            elapsed = time.time() - t0
            logger.info(f"Ranking computed in {elapsed:.2f}s ({len(full)} entries)")
            # Update cache
            _cache["data"] = full
            _cache["timestamp"] = time.time()
        except DBServiceError as e:
            logger.error(f"Error building ranking: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener el ranking",
            )

    # Leaderboard vacío → respuesta vacía (Req 3.7)
    if not full:
        return RankingResponse(top=[], current_user=None)

    # ¿Dónde cae el current_user en el leaderboard completo?
    current_in_full = next(
        (e for e in full if str(e["user_id"]) == current_user_id),
        None,
    )

    # Top_N: primeras `limit` entradas, marcando la del current_user si aparece.
    top_entries: list[RankingEntry] = []
    current_in_top = False
    for e in full[:limit]:
        is_me = str(e["user_id"]) == current_user_id
        if is_me:
            current_in_top = True
        top_entries.append(
            RankingEntry(
                user_id=e["user_id"],
                position=e["position"],
                display_name=e["display_name"],
                score=e["score"],
                approved_reviews_count=e["approved_reviews_count"],
                completed_tickets_count=e["completed_tickets_count"],
                is_current_user=is_me,
            )
        )

    # Si el current_user está en el Top_N, no lo duplicamos (Req 3.3).
    # Si no está y existe en el leaderboard, se devuelve por separado (Req 3.4).
    # Si no aparece en absoluto (no tiene proyectos), current_user=None (Req 3.7).
    current_entry: RankingEntry | None = None
    if not current_in_top and current_in_full is not None:
        current_entry = RankingEntry(
            user_id=current_in_full["user_id"],
            position=current_in_full["position"],
            display_name=current_in_full["display_name"],
            score=current_in_full["score"],
            approved_reviews_count=current_in_full["approved_reviews_count"],
            completed_tickets_count=current_in_full["completed_tickets_count"],
            is_current_user=True,
        )

    return RankingResponse(top=top_entries, current_user=current_entry)
