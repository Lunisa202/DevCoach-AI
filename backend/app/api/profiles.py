"""
API Router — Public profiles.

ENDPOINTS:
    GET  /api/profiles/:user_id  → Public profile of any user (no email exposed)
    PUT  /api/auth/profile-info  → Update own bio, linkedin, github
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.services.auth_service import get_current_user
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


@router.get(
    "/{user_id}",
    summary="Get public profile of a user",
)
async def get_public_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns public profile data for any user.
    Includes: name/alias, avatar, bio, social links, level, XP, streak,
    achievements, stats (projects, tickets completed, avg score).
    Does NOT include: email, password, API keys.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        profile = await db.get_public_profile(user_id)
    except DBServiceError:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Mark if viewing own profile
    profile["is_own_profile"] = str(current_user["id"]) == user_id

    return profile
