"""Manual test for Evaluator agent.

Run from backend/: python scripts/try_evaluator.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _setup  # noqa: F401

import asyncio
import json

from app.ai.providers.base import get_provider
from app.ai.agents.evaluator import evaluate_answers
from app.ai.schemas import TicketData, Prioridad, Dificultad


SAMPLE_TICKET = TicketData(
    titulo="Agregar manejo de división por cero en calc",
    descripcion=(
        "La función calc en utils.py no valida cuando el operador es '/' y y=0. "
        "Se debe agregar validación explícita."
    ),
    prioridad=Prioridad.alta,
    dificultad=Dificultad.facil,
    tiempo_estimado_minutos=30,
)

SAMPLE_DIFF = """
diff --git a/utils.py b/utils.py
--- a/utils.py
+++ b/utils.py
@@ -5,4 +5,8 @@ def calc(x, y, op):
     if op == "*":
         return x * y
     if op == "/":
+        if y == 0:
+            raise ValueError("Division by zero is not allowed")
         return x / y
+    raise ValueError(f"Unknown operator: {op}")
"""

SAMPLE_QUESTIONS = [
    "¿Por qué elegiste lanzar ValueError en lugar de retornar None o un código de error?",
    "¿Qué pasaría si el llamador espera un número y le llega la excepción sin manejar? ¿Cómo debería documentarse esta función?",
    "El diff también agrega un raise para operadores desconocidos. ¿Por qué es importante ese cambio adicional?",
]

# Two sets of answers — cambiá cuál usar para ver ambos casos
GOOD_ANSWERS = [
    (
        "Elegí ValueError porque es la excepción semánticamente correcta para "
        "argumentos inválidos en Python. Retornar None ocultaría el error y "
        "obligaría al llamador a chequear el tipo, mezclando el flujo de datos "
        "con el flujo de errores. Un código de error tampoco escala si en el "
        "futuro hay más casos."
    ),
    (
        "Si el llamador no maneja la excepción, propagará hasta arriba y "
        "romperá el programa. Es intencional: es un bug del llamador, no de "
        "calc. Habría que documentarlo con un docstring que liste ValueError "
        "en la sección Raises, así IDEs y type checkers lo detectan."
    ),
    (
        "Sin ese raise final, un operador inválido pasaría silenciosamente y "
        "la función retornaría None implícitamente, causando errores muy "
        "difíciles de rastrear más adelante. Fail-fast siempre es mejor que "
        "fail-silent."
    ),
]

BAD_ANSWERS = [
    "Porque sí, es lo más fácil.",
    "No sé, supongo que el que la llame lo maneja.",
    "Porque estaba en el ticket.",
]


async def main():
    provider = get_provider()
    print(f"Provider: {type(provider).__name__}")

    # Cambiá aquí entre GOOD_ANSWERS y BAD_ANSWERS para ver el otro caso
    answers = GOOD_ANSWERS
    label = "GOOD_ANSWERS" if answers is GOOD_ANSWERS else "BAD_ANSWERS"
    print(f"Evaluating {label}...\n")

    result = await evaluate_answers(
        provider, SAMPLE_TICKET, SAMPLE_DIFF, SAMPLE_QUESTIONS, answers
    )

    print("=" * 60)
    print(f"APROBADO: {result.aprobado}")
    print(f"\nFEEDBACK:\n{result.feedback}")
    print("=" * 60)
    print("\nFull JSON:")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
