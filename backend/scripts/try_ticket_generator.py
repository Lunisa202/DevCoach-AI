"""Manual test for Ticket_Generator agent.

Run from backend/: python scripts/try_ticket_generator.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _setup  # noqa: F401

import asyncio
import json

from app.ai.providers.base import get_provider
from app.ai.agents.ticket_generator import generate_tickets
from app.ai.schemas import CodeReviewResult


SAMPLE_REVIEW = CodeReviewResult(
    fortalezas=[
        "El código es simple y fácil de entender",
        "Los nombres de funciones son descriptivos",
        "Separación básica entre lógica y almacenamiento",
    ],
    debilidades=[
        "La función calc no maneja división por cero",
        "read_file nunca cierra el archivo (fuga de recursos)",
        "Se usa una lista global 'users' — no es thread-safe",
        "No hay validación de inputs (email, age)",
        "Se usan prints en vez de logging estructurado",
    ],
)


async def main():
    provider = get_provider()
    print(f"Provider: {type(provider).__name__}")
    print("Generating 3 tickets from sample review...\n")

    result = await generate_tickets(provider, SAMPLE_REVIEW)

    print("=" * 60)
    for i, ticket in enumerate(result.tickets, 1):
        print(f"\nTicket {i}:")
        print(f"  Título:              {ticket.titulo}")
        print(f"  Descripción:         {ticket.descripcion}")
        print(f"  Prioridad:           {ticket.prioridad.value}")
        print(f"  Dificultad:          {ticket.dificultad.value}")
        print(f"  Tiempo estimado:     {ticket.tiempo_estimado_minutos} min")
    print("\n" + "=" * 60)
    print("\nFull JSON:")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
