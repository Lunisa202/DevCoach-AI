"""
API Router — User statistics/dashboard endpoint.

Provides aggregated stats for the authenticated user's projects,
tickets, and reviews to power a frontend dashboard.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.config import get_settings
from app.services.auth_service import get_current_user
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get(
    "",
    summary="Get user dashboard statistics",
)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns aggregated statistics for the current user:
    - Total projects
    - Ticket counts by state (to_do, in_review, done)
    - Ticket counts by priority
    - Ticket counts by difficulty
    - Review stats (total, approved, avg score)
    - Recent reviews with scores
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
    user_id = current_user["id"]

    try:
        # Get all projects for this user
        projects = await db.get_projects_by_user(user_id)
        project_ids = [p["id"] for p in projects]

        if not project_ids:
            return _empty_stats()

        # Get all tickets across all user projects
        all_tickets = []
        for pid in project_ids:
            from uuid import UUID
            tickets = await db.get_tickets_by_project(UUID(pid))
            all_tickets.extend(tickets)

        # Get all reviews across all tickets
        all_reviews = []
        for ticket in all_tickets:
            reviews = await db.get_reviews_by_ticket(ticket["id"])
            all_reviews.extend(reviews)

        # Build stats
        total_projects = len(projects)
        total_tickets = len(all_tickets)

        # Tickets by state
        by_state = {"to_do": 0, "in_review": 0, "done": 0}
        for t in all_tickets:
            state = t.get("estado", "to_do")
            if state in by_state:
                by_state[state] += 1

        # Tickets by priority
        by_priority = {"alta": 0, "media": 0, "baja": 0}
        for t in all_tickets:
            prio = t.get("prioridad", "media")
            if prio in by_priority:
                by_priority[prio] += 1

        # Tickets by difficulty
        by_difficulty = {"fácil": 0, "media": 0, "difícil": 0}
        for t in all_tickets:
            diff = t.get("dificultad", "media")
            if diff in by_difficulty:
                by_difficulty[diff] += 1

        # Review stats
        total_reviews = len(all_reviews)
        approved_reviews = sum(1 for r in all_reviews if r.get("aprobado"))
        scores = [r.get("calificacion") for r in all_reviews if r.get("calificacion") is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else None

        # Recent reviews (last 5, sorted by date)
        sorted_reviews = sorted(
            [r for r in all_reviews if r.get("created_at")],
            key=lambda r: r["created_at"],
            reverse=True,
        )[:5]

        recent_reviews = [
            {
                "id": str(r.get("id", "")),
                "ticket_id": str(r.get("ticket_id", "")),
                "calificacion": r.get("calificacion"),
                "aprobado": r.get("aprobado"),
                "created_at": r.get("created_at"),
            }
            for r in sorted_reviews
        ]

        # Get XP/Level/Streak data
        xp_data = await db.get_user_xp_data(user_id)
        current_level = xp_data.get("level", 1)
        current_xp = xp_data.get("xp", 0)
        progress_in_level, total_for_level = db.xp_progress_in_level(current_xp, current_level)

        # Build trends: calificaciones by week (last 8 weeks)
        from datetime import datetime, timedelta
        trends = _build_trends(all_reviews)

        return {
            "total_projects": total_projects,
            "total_tickets": total_tickets,
            "tickets_by_state": by_state,
            "tickets_by_priority": by_priority,
            "tickets_by_difficulty": by_difficulty,
            "total_reviews": total_reviews,
            "approved_reviews": approved_reviews,
            "avg_score": avg_score,
            "recent_reviews": recent_reviews,
            "xp": current_xp,
            "level": current_level,
            "xp_progress": progress_in_level,
            "xp_needed": total_for_level,
            "current_streak": xp_data.get("current_streak", 0),
            "trends": trends,
        }

    except DBServiceError as e:
        logger.error(f"Error fetching stats for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="No se pudieron obtener las estadísticas")


def _empty_stats():
    return {
        "total_projects": 0,
        "total_tickets": 0,
        "tickets_by_state": {"to_do": 0, "in_review": 0, "done": 0},
        "tickets_by_priority": {"alta": 0, "media": 0, "baja": 0},
        "tickets_by_difficulty": {"fácil": 0, "media": 0, "difícil": 0},
        "total_reviews": 0,
        "approved_reviews": 0,
        "avg_score": None,
        "recent_reviews": [],
        "xp": 0,
        "level": 1,
        "xp_progress": 0,
        "xp_needed": 100,
        "current_streak": 0,
        "trends": [],
    }


def _build_trends(all_reviews: list[dict]) -> list[dict]:
    """Build weekly average calificaciones for the last 8 weeks.

    Returns a list of {week: "Jul 14", avg: 78} sorted chronologically.
    """
    from datetime import datetime, timedelta

    now = datetime.now()
    # Get reviews with calificacion and created_at
    scored = [
        r for r in all_reviews
        if r.get("calificacion") is not None and r.get("created_at")
    ]

    if not scored:
        return []

    # Build 8 weekly buckets
    weeks: list[dict] = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i, days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)
        weeks.append({
            "start": week_start,
            "end": week_end,
            "label": week_start.strftime("%b %d"),
            "scores": [],
        })

    # Assign reviews to weeks
    for r in scored:
        created = r["created_at"]
        if isinstance(created, str):
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                continue
        else:
            dt = created.replace(tzinfo=None) if hasattr(created, 'replace') else created

        for w in weeks:
            if w["start"] <= dt < w["end"]:
                w["scores"].append(r["calificacion"])
                break

    # Build output (only weeks with data)
    result = []
    for w in weeks:
        if w["scores"]:
            avg = round(sum(w["scores"]) / len(w["scores"]))
            result.append({"week": w["label"], "avg": avg, "count": len(w["scores"])})
        else:
            result.append({"week": w["label"], "avg": None, "count": 0})

    return result


@router.get(
    "/skills",
    summary="Get user's skill radar data (averaged from all reviews)",
)
async def get_skill_radar(current_user: dict = Depends(get_current_user)):
    """
    Returns the user's skill profile as averaged scores across the 5 evaluation
    dimensions from all their approved reviews. Used to render a radar/spider chart.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
    user_id = current_user["id"]

    try:
        skills = await db.get_user_skill_radar(user_id)
        return {"skills": skills}
    except Exception as e:
        logger.error(f"Error getting skill radar: {e}")
        return {"skills": []}
