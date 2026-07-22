"""Tech_Lead agent — generates interview questions based on a ticket and commit diff."""

import json

from app.ai.providers.base import AIProvider
from app.ai.schemas import TechLeadResult, TicketData

_SYSTEM_PROMPT = """Eres un Tech Lead senior realizando una entrevista técnica de seguimiento. Un desarrollador resolvió un ticket y subió un commit. Tu tarea es generar preguntas para verificar que entiende lo que hizo.

INSTRUCCIONES:
- Genera entre 2 y 3 preguntas basadas en el ticket resuelto y el diff del commit.
- Las preguntas deben evaluar comprensión técnica real, no solo memorización.
- Pregunta sobre decisiones de diseño, trade-offs, alternativas consideradas o posibles edge cases.
- Las preguntas deben ser específicas al cambio realizado, no genéricas.
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

FORMATO DE RESPUESTA (JSON estricto):
{
  "preguntas": [
    "¿Por qué elegiste esta estructura en lugar de...?",
    "¿Qué pasaría si el input fuera...?",
    "¿Cómo manejarías el caso donde...?"
  ]
}"""


async def generate_questions(
    provider: AIProvider, ticket: TicketData, diff: str
) -> TechLeadResult:
    """Generate 2-3 interview questions based on ticket and commit diff.

    Args:
        provider: The AI provider to use for generation.
        ticket: The ticket that was resolved.
        diff: The git diff of the commit that resolves the ticket.

    Returns:
        TechLeadResult with 2-3 interview questions.

    Raises:
        ValueError: If the AI response doesn't match the expected schema.
        TimeoutError: If the AI doesn't respond in time.
        RuntimeError: If the AI call fails.
    """
    context = (
        f"TICKET RESUELTO:\n"
        f"- Título: {ticket.titulo}\n"
        f"- Descripción: {ticket.descripcion}\n"
        f"- Prioridad: {ticket.prioridad.value}\n"
        f"- Dificultad: {ticket.dificultad.value}\n\n"
        f"DIFF DEL COMMIT:\n{diff}"
    )

    prompt = f"{_SYSTEM_PROMPT}\n\n{context}"

    raw_response = await provider.generate(prompt)

    return _parse_response(raw_response)


def _parse_response(raw: str) -> TechLeadResult:
    """Parse and validate the AI response as TechLeadResult.

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
            f"Tech_Lead response is not valid JSON: {e}\nRaw: {raw[:500]}"
        )

    # Handle case where LLM returns a list directly
    if isinstance(data, list):
        data = {"preguntas": data}

    try:
        return TechLeadResult(**data)
    except Exception as e:
        raise ValueError(
            f"Tech_Lead response doesn't match expected schema: {e}"
        )
