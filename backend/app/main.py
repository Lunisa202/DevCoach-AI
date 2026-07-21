"""DevCoach AI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.projects import router as projects_router

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


@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok", "ai_provider": settings.AI_PROVIDER}


# --- Register API routers ---
app.include_router(projects_router)
