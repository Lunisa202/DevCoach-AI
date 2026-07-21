"""Ticket_Generator agent — converts a code review into exactly 3 improvement tickets."""

import json

from app.ai.providers.base import AIProvider
from app.ai.schemas import CodeReviewResult, TicketGenerationResult

_SYSTEM_PROMPT = """Eres un gestor de proyectos técnico. Tu tarea es convertir un diagnóstico de code review en exactamente 3 tickets de mejora accionables.

INSTRUCCIONES:
- Genera EXACTAMENTE 3 tickets basados en las debilidades identificadas.
- Cada ticket debe ser una mejora concreta y alcanzable.
- Prioriza las debilidades más impactantes.
- Los tickets deben ser independientes entre sí (se pueden resolver en cualquier orden).
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

RESTRICCIONES POR CAMPO:
- titulo: máximo 120 caracteres, claro y descriptivo
- descripcion: detalle de qué hay que hacer y por qué
- prioridad: uno de ["alta", "media", "baja"]
- dificultad: uno de ["fácil", "media", "difícil"]
- tiempo_estimado_minutos: número entero entre 15 y 480

FORMATO DE RESPUESTA (JSON estricto):
{
  "tickets": [
    {
      "titulo": "Título del ticket 1",
      "descripcion": "Descripción detallada...",
      "prioridad": "alta",
      "dificultad": "media",
      "tiempo_estimado_minutos": 60
    },
    {
      "titulo": "Título del ticket 2",
      "descripcion": "Descripción detallada...",
      "prioridad": "media",
      "dificultad": "fácil",
      "tiempo_estimado_minutos": 30
    },
    {
      "titulo": "Título del ticket 3",
      "descripcion": "Descripción detallada...",
      "prioridad": "baja",
      "dificultad": "difícil",
      "tiempo_estimado_minutos": 120
    }
  ]
}"""


async def generate_tickets(
    provider: AIProvider, review: CodeReviewResult
) -> TicketGenerationResult:
    """Generate exactly 3 improvement tickets from a code review.

    Args:
        provider: The AI provider to use for generation.
        review: The code review result with fortalezas and debilidades.

    Returns:
        TicketGenerationResult containing exactly 3 tickets.

    Raises:
        ValueError: If the AI response doesn't match the expected schema.
        TimeoutError: If the AI doesn't respond in time.
        RuntimeError: If the AI call fails.
    """
    review_context = (
        f"FORTALEZAS DEL CÓDIGO:\n"
        + "\n".join(f"- {f}" for f in review.fortalezas)
        + f"\n\nDEBILIDADES DEL CÓDIGO:\n"
        + "\n".join(f"- {d}" for d in review.debilidades)
    )

    prompt = f"{_SYSTEM_PROMPT}\n\nDIAGNÓSTICO DE CODE REVIEW:\n{review_context}"

    raw_response = await provider.generate(prompt)

    return _parse_response(raw_response)


def _parse_response(raw: str) -> TicketGenerationResult:
    """Parse and validate the AI response as TicketGenerationResult.

    Raises:
        ValueError: If response is not valid JSON or doesn't match schema.
    """
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Ticket_Generator response is not valid JSON: {e}\nRaw: {raw[:500]}"
        )

    # Handle case where LLM returns a list directly instead of wrapped object
    if isinstance(data, list):
        data = {"tickets": data}

    try:
        return TicketGenerationResult(**data)
    except Exception as e:
        raise ValueError(
            f"Ticket_Generator response doesn't match expected schema: {e}"
        )
