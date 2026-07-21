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


def get_provider() -> AIProvider:
    """Factory that returns the correct AI provider based on AI_PROVIDER env var.

    Reads the AI_PROVIDER setting and instantiates the corresponding provider.
    The provider is NOT a singleton — a new instance is created each call.
    Use dependency injection or app state to cache if needed.

    Returns:
        An instance of GeminiProvider or GroqProvider.

    Raises:
        ValueError: If AI_PROVIDER is not 'gemini' or 'groq'.
    """
    from app.config import get_settings

    settings = get_settings()
    provider_name = settings.AI_PROVIDER

    if provider_name == "gemini":
        from app.ai.providers.gemini_provider import GeminiProvider

        return GeminiProvider(api_key=settings.GEMINI_API_KEY)

    elif provider_name == "groq":
        from app.ai.providers.groq_provider import GroqProvider

        return GroqProvider(api_key=settings.GROQ_API_KEY)

    else:
        raise ValueError(
            f"AI_PROVIDER must be 'gemini' or 'groq', got '{provider_name}'"
        )
