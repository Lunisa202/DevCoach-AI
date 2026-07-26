"""Gemini AI provider implementation using the new google-genai SDK.

Implements a fallback chain: if the current model is rate-limited (HTTP 429 /
RESOURCE_EXHAUSTED), the provider transparently retries with the next model
in the chain. This keeps the app responsive when a specific model exhausts
its quota, at the cost of a possibly cheaper/smaller model answering.
"""

import asyncio
import logging

from google import genai

from app.ai.providers.base import AIProvider

logger = logging.getLogger(__name__)

# Timeout for each individual generation attempt (seconds).
_ATTEMPT_TIMEOUT_SECONDS = 30

# Short wait between retries when we hit a rate limit, so we don't hammer
# the next model in the same burst.
_RATE_LIMIT_BACKOFF_SECONDS = 0.5

# Default fallback chain, most capable first, most economical last.
_DEFAULT_MODEL_CHAIN: tuple[str, ...] = (
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
)


class GeminiProvider(AIProvider):
    """AI provider using Google's Gemini models with an automatic fallback chain."""

    def __init__(self, api_key: str, models: list[str] | None = None) -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required but was empty")
        self._client = genai.Client(api_key=api_key)
        self._models: list[str] = list(models) if models else list(_DEFAULT_MODEL_CHAIN)
        if not self._models:
            raise ValueError("GeminiProvider requires at least one model")

    async def generate(self, prompt: str) -> str:
        """Send prompt to Gemini and return the text response.

        Iterates the model chain: if a model returns a rate-limit error we
        back off briefly and try the next one. If every model is rate-limited
        the last error is raised as RuntimeError.

        Raises:
            TimeoutError: If a Gemini attempt does not respond within 30 s.
            RuntimeError: If Gemini returns a non-rate-limit error, or if
                every model in the chain is rate-limited.
        """
        last_rate_limit_error: Exception | None = None

        for index, model in enumerate(self._models):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(self._generate_sync, model, prompt),
                    timeout=_ATTEMPT_TIMEOUT_SECONDS,
                )
                if index > 0:
                    logger.warning(
                        "Gemini fallback engaged: served by '%s' after %d "
                        "rate-limited model(s)",
                        model,
                        index,
                    )
                return response
            except asyncio.TimeoutError:
                raise TimeoutError(
                    f"Gemini model '{model}' did not respond within "
                    f"{_ATTEMPT_TIMEOUT_SECONDS} seconds"
                )
            except TimeoutError:
                raise
            except Exception as e:
                if _is_rate_limit_error(e):
                    last_rate_limit_error = e
                    logger.warning(
                        "Gemini model '%s' rate-limited, trying next in chain",
                        model,
                    )
                    await asyncio.sleep(_RATE_LIMIT_BACKOFF_SECONDS)
                    continue
                raise RuntimeError(f"Gemini API error ({model}): {e}") from e

        raise RuntimeError(
            "All Gemini models in the fallback chain are rate-limited: "
            f"{self._models}. Last error: {last_rate_limit_error}"
        ) from last_rate_limit_error

    def _generate_sync(self, model: str, prompt: str) -> str:
        """Synchronous call to Gemini's generate_content for a specific model."""
        response = self._client.models.generate_content(
            model=model,
            contents=prompt,
        )
        return response.text


def _is_rate_limit_error(e: Exception) -> bool:
    """Detect HTTP 429 / RESOURCE_EXHAUSTED / quota errors from google-genai."""
    code = getattr(e, "code", None) or getattr(e, "status_code", None)
    if code == 429:
        return True
    msg = str(e).upper()
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "QUOTA" in msg
