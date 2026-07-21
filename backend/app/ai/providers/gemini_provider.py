"""Gemini AI provider implementation using the new google-genai SDK."""

import asyncio

from google import genai

from app.ai.providers.base import AIProvider

# Timeout for AI generation calls (seconds)
_TIMEOUT_SECONDS = 30


class GeminiProvider(AIProvider):
    """AI provider that uses Google's Gemini 2.5 Flash model."""

    def __init__(self, api_key: str) -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required but was empty")
        self._client = genai.Client(api_key=api_key)
        self._model = "gemini-flash-latest"

    async def generate(self, prompt: str) -> str:
        """Send prompt to Gemini and return the text response.

        Uses asyncio.to_thread to avoid blocking the event loop since
        the google-genai SDK is synchronous.

        Raises:
            TimeoutError: If Gemini doesn't respond within 30 seconds.
            RuntimeError: If the API call fails.
        """
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(self._generate_sync, prompt),
                timeout=_TIMEOUT_SECONDS,
            )
            return response
        except asyncio.TimeoutError:
            raise TimeoutError(
                f"Gemini did not respond within {_TIMEOUT_SECONDS} seconds"
            )
        except TimeoutError:
            raise
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {e}") from e

    def _generate_sync(self, prompt: str) -> str:
        """Synchronous call to Gemini's generate_content."""
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
        )
        return response.text
