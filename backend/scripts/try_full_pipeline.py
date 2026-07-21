"""Run the FULL pipeline end-to-end with a real AI provider.

Code_Reviewer -> Ticket_Generator -> Tech_Lead -> Evaluator

Run from backend/: python scripts/try_full_pipeline.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _setup  # noqa: F401

import asyncio

from app.ai.providers.base import get_provider
from app.ai.agents.code_reviewer import analyze_code
from app.ai.agents.ticket_generator import generate_tickets
from app.ai.agents.tech_lead import generate_questions
from app.ai.agents.evaluator import evaluate_answers


SAMPLE_FILES = {
    "utils.py": """
def calc(x, y, op):
    if op == "+":
        return x + y
    if op == "-":
        return x - y
    if op == "*":
        return x * y
    if op == "/":
        return x / y
""",
}

SAMPLE_DIFF = """
diff --git a/utils.py b/utils.py
--- a/utils.py
+++ b/utils.py
@@ -8,3 +8,7 @@ def calc(x, y, op):
     if op == "/":
+        if y == 0:
+            raise ValueError("Division by zero is not allowed")
         return x / y
+    raise ValueError(f"Unknown operator: {op}")
"""

SAMPLE_ANSWERS = [
    (
        "Elegí ValueError porque semánticamente representa un argumento "
        "inválido en Python, que es exactamente lo que ocurre acá."
    ),
    (
        "El llamador debe manejarlo con try/except. Habría que documentar "
        "la excepción en el docstring para que sea explícito."
    ),
    (
        "Sin ese raise, un operador desconocido devolvería None implícitamente "
        "y sería muy difícil de rastrear. Fail-fast es más seguro."
    ),
]


async def main():
    provider = get_provider()
    print(f"Provider: {type(provider).__name__}\n")

    print("[1/4] Running Code_Reviewer...")
    review = await analyze_code(provider, SAMPLE_FILES)
    print(f"      Fortalezas: {len(review.fortalezas)}")
    print(f"      Debilidades: {len(review.debilidades)}\n")

    print("[2/4] Running Ticket_Generator...")
    tickets = await generate_tickets(provider, review)
    print(f"      Tickets generados: {len(tickets.tickets)}")
    first_ticket = tickets.tickets[0]
    print(f"      Primer ticket: {first_ticket.titulo}\n")

    print("[3/4] Running Tech_Lead (con el primer ticket + diff simulado)...")
    questions = await generate_questions(provider, first_ticket, SAMPLE_DIFF)
    print(f"      Preguntas generadas: {len(questions.preguntas)}\n")
    for i, q in enumerate(questions.preguntas, 1):
        print(f"        {i}. {q}")
    print()

    print("[4/4] Running Evaluator (respuestas hardcoded)...")
    # Adjust answers to question count
    n = len(questions.preguntas)
    answers = SAMPLE_ANSWERS[:n]
    while len(answers) < n:
        answers.append("Respuesta genérica adicional.")

    evaluation = await evaluate_answers(
        provider, first_ticket, SAMPLE_DIFF, questions.preguntas, answers
    )
    print(f"      Aprobado: {evaluation.aprobado}")
    print(f"      Feedback: {evaluation.feedback[:200]}...\n")

    print("=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
