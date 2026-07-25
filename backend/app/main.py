"""DevCoach AI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_debug import router as ai_debug_router
from app.config import get_settings
from app.api.projects import router as projects_router
from app.api.tickets import router as tickets_router
from app.api.interviews import router as interviews_router
from app.api.auth import router as auth_router
from app.api.stats import router as stats_router
from app.api.ranking import router as ranking_router
from app.api.achievements import router as achievements_router
from app.api.profiles import router as profiles_router

# Validate environment on import (fail-fast)
settings = get_settings()

app = FastAPI(
    title="DevCoach AI",
    description="AI-powered code coaching platform",
    version="0.1.0",
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Debug endpoints for AI agents (used to test agents individually via Swagger)
app.include_router(ai_debug_router)


@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok", "ai_provider": settings.AI_PROVIDER}


# --- Register API routers ---
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tickets_router)
app.include_router(interviews_router)
app.include_router(stats_router)
app.include_router(ranking_router)
app.include_router(achievements_router)
app.include_router(profiles_router)
