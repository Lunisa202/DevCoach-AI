"""DevCoach AI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_debug import router as ai_debug_router
from app.config import get_settings

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
