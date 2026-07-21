"""Application configuration loaded from environment variables."""

import sys
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Environment-based settings with startup validation."""

    AI_PROVIDER: str
    GITHUB_TOKEN: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Frontend origin for CORS
    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, v: str) -> str:
        if v not in ("gemini", "groq"):
            print(
                f"ERROR: AI_PROVIDER must be 'gemini' or 'groq', got '{v}'",
                file=sys.stderr,
            )
            sys.exit(1)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    """Load and validate settings. Exits with code 1 if any required var is missing."""
    try:
        return Settings()  # type: ignore[call-arg]
    except Exception as e:
        print(f"ERROR: Missing or invalid environment variable — {e}", file=sys.stderr)
        sys.exit(1)
