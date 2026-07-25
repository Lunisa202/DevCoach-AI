"""
API Router — Achievements / Badges.

ENDPOINTS:
    GET /api/achievements       → Full catalog + user's unlocked status
    GET /api/achievements/me    → Only user's unlocked achievements
"""

import logging
from fastapi import APIRouter, Depends

from app.config import get_settings
from app.services.auth_service import get_current_user
from app.services.db_service import DBService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/achievements", tags=["Achievements"])


@router.get(
    "",
    summary="Get achievements catalog with user's unlock status",
)
async def get_achievements(current_user: dict = Depends(get_current_user)):
    """
    Returns the full achievement catalog with each badge's unlock status
    for the authenticated user.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
    user_id = current_user["id"]

    catalog = await db.get_all_achievements()
    user_unlocked = await db.get_user_achievements(user_id)

    # Build a map of unlocked achievements
    unlocked_map = {a["achievement_id"]: a["unlocked_at"] for a in user_unlocked}

    # Merge catalog with user status
    result = []
    for achievement in catalog:
        unlocked_at = unlocked_map.get(achievement["id"])
        result.append({
            "id": achievement["id"],
            "title": achievement["title"],
            "description": achievement["description"],
            "icon": achievement["icon"],
            "category": achievement["category"],
            "unlocked": unlocked_at is not None,
            "unlocked_at": unlocked_at,
        })

    total = len(catalog)
    unlocked_count = len(unlocked_map)

    return {
        "achievements": result,
        "total": total,
        "unlocked": unlocked_count,
        "progress": round((unlocked_count / total) * 100) if total > 0 else 0,
    }


@router.get(
    "/me",
    summary="Get only the user's unlocked achievements",
)
async def get_my_achievements(current_user: dict = Depends(get_current_user)):
    """Returns only the achievements the user has unlocked."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    unlocked = await db.get_user_achievements(current_user["id"])
    return {"achievements": unlocked, "count": len(unlocked)}
