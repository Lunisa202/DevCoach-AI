"""
API Router — Community feed.

ENDPOINTS:
    GET /api/community/feed  → Recent milestone events from all users
"""

import logging
from fastapi import APIRouter, Depends, Query

from app.config import get_settings
from app.services.auth_service import get_current_user
from app.services.db_service import DBService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/community", tags=["Community"])


@router.get(
    "/feed",
    summary="Get community activity feed (milestones only)",
)
async def get_feed(
    limit: int = Query(default=15, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns recent milestone events from the community:
    - level_up: Someone leveled up
    - achievement: Someone unlocked a badge
    - rank_first: Someone reached #1 in ranking
    - joined: New user registered
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    events = await db.get_community_feed(limit)
    return {"events": events, "count": len(events)}
