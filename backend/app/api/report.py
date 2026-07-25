"""
API Router — Developer Report.

ENDPOINTS:
    GET /api/report         → Generate report for authenticated user
    GET /api/report/:userId → Generate public report for any user
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.config import get_settings
from app.services.auth_service import get_current_user
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["Report"])

# Thresholds for classifying dimensions
STRENGTH_THRESHOLD = 15    # avg >= 15/20 = strength
WEAKNESS_THRESHOLD = 12    # avg < 12/20 = area to improve


@router.get(
    "",
    summary="Generate Developer Report for authenticated user",
)
async def get_my_report(current_user: dict = Depends(get_current_user)):
    """Generates a comprehensive developer report for the current user."""
    return await _build_report(current_user["id"])


@router.get(
    "/{user_id}",
    summary="Generate public Developer Report for any user",
)
async def get_user_report(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generates a public developer report for any user."""
    return await _build_report(user_id)


async def _build_report(user_id: str) -> dict:
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        # User info
        user_res = (
            db._client.table("users")
            .select("id, full_name, alias, avatar_url, xp, level, current_streak, created_at")
            .eq("id", user_id)
            .execute()
        )
        if not user_res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user = user_res.data[0]
        display_name = db._display_name(user)

        # Projects
        projects_res = (
            db._client.table("projects")
            .select("id, repo_url, fecha_analisis")
            .eq("user_id", user_id)
            .order("fecha_analisis", desc=True)
            .execute()
        )
        projects = projects_res.data or []
        project_ids = [p["id"] for p in projects]

        # Tickets
        total_tickets = 0
        completed_tickets = 0
        ticket_ids: list[str] = []
        if project_ids:
            tickets_res = (
                db._client.table("tickets")
                .select("id, estado")
                .in_("project_id", project_ids)
                .execute()
            )
            total_tickets = len(tickets_res.data or [])
            completed_tickets = sum(1 for t in (tickets_res.data or []) if t.get("estado") == "done")
            ticket_ids = [t["id"] for t in (tickets_res.data or [])]

        # Reviews
        total_reviews = 0
        approved_reviews = 0
        scores: list[int] = []
        if ticket_ids:
            reviews_res = (
                db._client.table("reviews")
                .select("aprobado, calificacion, aspectos_evaluados, created_at")
                .in_("ticket_id", ticket_ids)
                .order("created_at", desc=True)
                .execute()
            )
            reviews = reviews_res.data or []
            total_reviews = len(reviews)
            for r in reviews:
                if r.get("aprobado"):
                    approved_reviews += 1
                if r.get("calificacion") is not None:
                    scores.append(r["calificacion"])

        avg_score = round(sum(scores) / len(scores), 1) if scores else None

        # Skill dimensions (same logic as skill radar)
        skills = await db.get_user_skill_radar(user_id)

        # Classify strengths and weaknesses
        strengths = [s for s in skills if s["score"] >= STRENGTH_THRESHOLD]
        weaknesses = [s for s in skills if s["score"] < WEAKNESS_THRESHOLD]
        # Best skill
        best_skill = max(skills, key=lambda s: s["score"]) if skills else None

        # Achievements
        user_achievements = await db.get_user_achievements(user_id)
        all_achievements = await db.get_all_achievements()
        unlocked_details = []
        unlocked_ids = {a["achievement_id"] for a in user_achievements}
        for ach in all_achievements:
            if ach["id"] in unlocked_ids:
                unlocked_details.append({"id": ach["id"], "title": ach["title"], "icon": ach["icon"]})

        return {
            "display_name": display_name,
            "avatar_url": user.get("avatar_url"),
            "level": user.get("level", 1),
            "xp": user.get("xp", 0),
            "current_streak": user.get("current_streak", 0),
            "member_since": user.get("created_at"),
            "generated_at": None,  # Will be set by frontend to current date
            "stats": {
                "projects_analyzed": len(projects),
                "total_interviews": total_reviews,
                "approved_interviews": approved_reviews,
                "approval_rate": round((approved_reviews / total_reviews) * 100) if total_reviews > 0 else 0,
                "avg_score": avg_score,
                "tickets_completed": completed_tickets,
                "tickets_total": total_tickets,
            },
            "skills": skills,
            "strengths": [{"dimension": s["dimension"], "score": s["score"]} for s in strengths],
            "weaknesses": [{"dimension": s["dimension"], "score": s["score"]} for s in weaknesses],
            "best_skill": {"dimension": best_skill["dimension"], "score": best_skill["score"]} if best_skill else None,
            "achievements": unlocked_details,
            "projects": [{"repo_url": p["repo_url"], "date": p["fecha_analisis"]} for p in projects[:5]],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error building report for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="No se pudo generar el reporte")
