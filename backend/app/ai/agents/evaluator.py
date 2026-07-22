"""Evaluator agent — evaluates interview answers and decides approval."""

import json

from app.ai.providers.base import AIProvider
from app.ai.schemas import EvaluationResult, TicketData

_SYSTEM_PROMPT = """Eres un evaluador técnico senior. Un desarrollador resolvió un ticket, y un Tech Lead le hizo preguntas de seguimiento. Tu tarea es evaluar las respuestas del desarrollador.

INSTRUCCIONES:
- Evalúa si las respuestas demuestran comprensión técnica real del cambio realizado.
- Considera: ¿entiende el por qué detrás de su decisión? ¿Conoce las limitaciones? ¿Podría defender su enfoque?
- No exijas perfección — busca comprensión genuina, no respuestas de libro.
- Si las respuestas son vagas, evasivas, o muestran desconocimiento del propio código, no apruebes.
- El feedback debe ser constructivo: explica qué estuvo bien y qué podría mejorar.
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

CRITERIOS DE APROBACIÓN:
- Aprobado (true): el desarrollador demuestra que entiende lo que hizo y por qué.
- No aprobado (false): las respuestas son insuficientes, copiadas, o no demuestran comprensión.

FORMATO DE RESPUESTA (JSON estricto):
{
  "feedback": "Retroalimentación detallada sobre las respuestas...",
  "aprobado": true
}"""


async def evaluate_answers(
    provider: AIProvider,
    ticket: TicketData,
    diff: str,
    questions: list[str],
    answers: list[str],
) -> EvaluationResult:
    """Evaluate developer answers to interview questions.

    Args:
        provider: The AI provider to use for generation.
        ticket: The ticket that was resolved.
        diff: The git diff of the commit.
        questions: The Tech_Lead's questions.
        answers: The developer's answers to each question.

    Returns:
        EvaluationResult with feedback text and approval boolean.

    Raises:
        ValueError: If the AI response doesn't match the expected schema.
        TimeoutError: If the AI doesn't respond in time.
        RuntimeError: If the AI call fails.
    """
    # Build Q&A pairs
    qa_section = ""
    for i, (q, a) in enumerate(zip(questions, answers), 1):
        qa_section += f"Pregunta {i}: {q}\nRespuesta {i}: {a}\n\n"

    context = (
        f"TICKET RESUELTO:\n"
        f"- Título: {ticket.titulo}\n"
        f"- Descripción: {ticket.descripcion}\n\n"
        f"DIFF DEL COMMIT:\n{diff}\n\n"
        f"ENTREVISTA:\n{qa_section}"
    )

    prompt = f"{_SYSTEM_PROMPT}\n\n{context}"

    raw_response = await provider.generate(prompt)

    return _parse_response(raw_response)


def _parse_response(raw: str) -> EvaluationResult:
    """Parse and validate the AI response as EvaluationResult.

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
            f"Evaluator response is not valid JSON: {e}\nRaw: {raw[:500]}"
        )

    try:
        return EvaluationResult(**data)
    except Exception as e:
        raise ValueError(
            f"Evaluator response doesn't match expected schema: {e}"
        )
