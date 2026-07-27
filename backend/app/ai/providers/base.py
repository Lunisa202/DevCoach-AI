"""Abstract AI provider interface and factory function."""

from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Contract that all AI providers must implement.

    Any provider (Gemini, Groq, etc.) must be able to receive a text prompt
    and return a text response. This abstraction lets the rest of the code
    work with any provider without knowing implementation details.
    """

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        """Send a prompt to the AI model and return the text response.

        Args:
            prompt: The full text prompt to send to the model.

        Returns:
            The model's text response.

        Raises:
            TimeoutError: If the model doesn't respond within 30 seconds.
            RuntimeError: If the API call fails for any other reason.
        """
        ...


def get_provider(user_id: str | None = None) -> AIProvider:
    """Factory that returns the correct AI provider based on AI_PROVIDER env var.

    If a user_id is provided, attempts to use the user's personal API key
    (stored in the DB). Falls back to the system key from .env if:
    - user_id is None
    - The user doesn't have a personal key configured
    - There's an error reading the user's key

    Args:
        user_id: Optional user ID to look up personal API key.

    Returns:
        An instance of GeminiProvider or GroqProvider.

    Raises:
        ValueError: If AI_PROVIDER is not 'gemini' or 'groq'.
    """
    from app.config import get_settings

    settings = get_settings()
    provider_name = settings.AI_PROVIDER

    # Determine API key: user's personal key takes priority over system key
    api_key = _resolve_api_key(provider_name, user_id, settings)

    if provider_name == "gemini":
        from app.ai.providers.gemini_provider import GeminiProvider

        models = _parse_model_chain(getattr(settings, "GEMINI_MODEL_CHAIN", ""))
        return GeminiProvider(api_key=api_key, models=models)

    elif provider_name == "groq":
        from app.ai.providers.groq_provider import GroqProvider

        return GroqProvider(api_key=api_key)

    else:
        raise ValueError(
            f"AI_PROVIDER must be 'gemini' or 'groq', got '{provider_name}'"
        )


def _parse_model_chain(raw: str) -> list[str] | None:
    """Parse the GEMINI_MODEL_CHAIN env value into a list of model names.

    Returns None when the setting is empty/missing so the provider falls back
    to its built-in default chain.
    """
    if not raw or not raw.strip():
        return None
    models = [m.strip() for m in raw.split(",") if m.strip()]
    return models or None


def _resolve_api_key(provider_name: str, user_id: str | None, settings) -> str:
    """Resolve which API key to use: user's personal key or system fallback.

    Priority: user key > system key (.env)
    """
    system_key = settings.GEMINI_API_KEY if provider_name == "gemini" else settings.GROQ_API_KEY

    if not user_id:
        return system_key

    # Try to get user's personal key (only for Gemini for now)
    if provider_name == "gemini":
        try:
            from app.services.db_service import DBService
            import asyncio

            db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

            # Run the async method synchronously since get_provider is sync
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We're already in an async context, use a thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    user_key = pool.submit(
                        lambda: asyncio.run(db.get_user_api_key(user_id))
                    ).result(timeout=5)
            else:
                user_key = asyncio.run(db.get_user_api_key(user_id))

            if user_key:
                return user_key
        except Exception:
            # Any error fetching user key → fall back to system key
            pass

    return system_key
