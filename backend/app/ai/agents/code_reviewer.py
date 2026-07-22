"""Code_Reviewer agent — analyzes source code and identifies strengths/weaknesses."""

import json

from app.ai.providers.base import AIProvider
from app.ai.schemas import CodeReviewResult

_SYSTEM_PROMPT = """Eres un revisor de código senior experto. Tu tarea es analizar el código fuente proporcionado e identificar sus fortalezas y debilidades.

INSTRUCCIONES:
- Analiza el código considerando: legibilidad, estructura, buenas prácticas, manejo de errores, seguridad, rendimiento y mantenibilidad.
- Identifica entre 3 y 6 fortalezas concretas del código.
- Identifica entre 3 y 6 debilidades o áreas de mejora concretas.
- Sé específico: menciona archivos, funciones o patrones concretos cuando sea posible.
- Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

FORMATO DE RESPUESTA (JSON estricto):
{
  "fortalezas": ["fortaleza 1", "fortaleza 2", "..."],
  "debilidades": ["debilidad 1", "debilidad 2", "..."]
}"""


async def analyze_code(
    provider: AIProvider, files: dict[str, str]
) -> CodeReviewResult:
    """Analyze source code files and return strengths/weaknesses.

    Args:
        provider: The AI provider to use for generation.
        files: Dictionary mapping file paths to their content.

    Returns:
        CodeReviewResult with fortalezas and debilidades lists.

    Raises:
        ValueError: If the AI response doesn't match the expected schema.
        TimeoutError: If the AI doesn't respond in time.
        RuntimeError: If the AI call fails.
    """
    # Build the code context from files
    code_context = _build_code_context(files)

    prompt = f"{_SYSTEM_PROMPT}\n\nCÓDIGO A ANALIZAR:\n{code_context}"

    raw_response = await provider.generate(prompt)

    return _parse_response(raw_response)


def _build_code_context(files: dict[str, str]) -> str:
    """Format files dict into a readable text block for the prompt."""
    sections = []
    for path, content in files.items():
        sections.append(f"--- {path} ---\n{content}")
    return "\n\n".join(sections)


def _parse_response(raw: str) -> CodeReviewResult:
    """Parse and validate the AI response as CodeReviewResult.

    Raises:
        ValueError: If response is not valid JSON or doesn't match schema.
    """
    # Clean up common LLM formatting issues
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove markdown code fences
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Code_Reviewer response is not valid JSON: {e}\nRaw: {raw[:500]}"
        )

    try:
        return CodeReviewResult(**data)
    except Exception as e:
        raise ValueError(
            f"Code_Reviewer response doesn't match expected schema: {e}"
        )
