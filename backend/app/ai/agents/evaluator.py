"""Evaluator agent — evaluates interview answers and decides approval."""

import json

from app.ai.providers.base import AIProvider
from app.ai.schemas import EvaluationResult, TicketData

_SYSTEM_PROMPT = """Eres un evaluador técnico senior. Un desarrollador resolvió un ticket, y un Tech Lead le hizo preguntas de seguimiento. Tu tarea es evaluar las respuestas del desarrollador.

INSTRUCCIONES:
- Evalúa las respuestas en 5 dimensiones (0-20 puntos cada una, suman 100 puntos total).
- No exijas perfección — busca comprensión genuina, no respuestas de libro.
- Si las respuestas son vagas, evasivas, o muestran desconocimiento del propio código, califica bajo.
- El feedback debe ser constructivo: explica qué estuvo bien y qué podría mejorar.
- Identifica conceptos específicos que el desarrollador debería estudiar.
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

LAS 5 DIMENSIONES DE EVALUACIÓN:
1. Comprensión del problema (0-20): ¿Entiende qué estaba mal y por qué importa?
2. Justificación técnica (0-20): ¿Puede explicar por qué eligió esa solución?
3. Conocimiento de alternativas (0-20): ¿Sabe qué más podría haber hecho?
4. Conciencia de limitaciones (0-20): ¿Reconoce qué no cubre su solución?
5. Claridad de comunicación (0-20): ¿Se expresa con precisión técnica?

REGLA DE APROBACIÓN:
- calificacion >= 70 → aprobado: true
- calificacion < 70 → aprobado: false

FORMATO DE RESPUESTA (JSON estricto):
{
  "feedback": "Retroalimentación general constructiva...",
  "aprobado": true,
  "calificacion": 78,
  "aspectos_evaluados": [
    { "dimension": "Comprensión del problema", "puntaje": 18, "comentario": "Demuestra entender claramente el problema original." },
    { "dimension": "Justificación técnica", "puntaje": 15, "comentario": "Buena justificación aunque falta profundidad." },
    { "dimension": "Conocimiento de alternativas", "puntaje": 14, "comentario": "Menciona una alternativa pero no la analiza." },
    { "dimension": "Conciencia de limitaciones", "puntaje": 16, "comentario": "Reconoce limitaciones de forma honesta." },
    { "dimension": "Claridad de comunicación", "puntaje": 15, "comentario": "Se expresa con claridad." }
  ],
  "conceptos_a_mejorar": ["Testing unitario", "Principio de responsabilidad única"]
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
