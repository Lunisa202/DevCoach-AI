"""Manual test for Tech_Lead agent.

Run from backend/: python scripts/try_tech_lead.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _setup  # noqa: F401

import asyncio
import json

from app.ai.providers.base import get_provider
from app.ai.agents.tech_lead import generate_questions
from app.ai.schemas import TicketData, Prioridad, Dificultad


SAMPLE_TICKET = TicketData(
    titulo="Agregar manejo de división por cero en calc",
    descripcion=(
        "La función calc en utils.py no valida cuando el operador es '/' y y=0. "
        "Actualmente lanza ZeroDivisionError sin manejarlo. Se debe agregar "
        "una validación explícita y retornar un error controlado o levantar "
        "una excepción custom."
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


async def main():
    provider = get_provider()
    print(f"Provider: {type(provider).__name__}")
    print("Generating interview questions...\n")

    result = await generate_questions(provider, SAMPLE_TICKET, SAMPLE_DIFF)

    print("=" * 60)
    print(f"PREGUNTAS ({len(result.preguntas)}):\n")
    for i, q in enumerate(result.preguntas, 1):
        print(f"  {i}. {q}\n")
    print("=" * 60)
    print("\nFull JSON:")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
