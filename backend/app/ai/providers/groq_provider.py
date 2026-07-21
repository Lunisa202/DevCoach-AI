"""Groq AI provider implementation using the groq SDK."""

import asyncio

from groq import Groq

from app.ai.providers.base import AIProvider

# Timeout for AI generation calls (seconds)
_TIMEOUT_SECONDS = 30


class GroqProvider(AIProvider):
    """AI provider that uses Groq's Llama 3.3 70B model."""

    def __init__(self, api_key: str) -> None:
        if not api_key:
            raise ValueError("GROQ_API_KEY is required but was empty")
        self._client = Groq(api_key=api_key)
        self._model = "llama-3.3-70b-versatile"

    async def generate(self, prompt: str) -> str:
        """Send prompt to Groq and return the text response.

        Uses asyncio.to_thread since the Groq SDK is synchronous.

        Raises:
            TimeoutError: If Groq doesn't respond within 30 seconds.
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
                f"Groq did not respond within {_TIMEOUT_SECONDS} seconds"
            )
        except TimeoutError:
            raise
        except Exception as e:
            raise RuntimeError(f"Groq API error: {e}") from e

    def _generate_sync(self, prompt: str) -> str:
        """Synchronous call to Groq's chat completions."""
        chat_completion = self._client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self._model,
        )
        return chat_completion.choices[0].message.content
