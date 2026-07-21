# Testing Guide — Tarea 4.1: DB Service (CRUD Supabase)

> Archivo de referencia para probar `app/services/db_service.py` cuando llegues a casa.

---

## Pre-requisitos

1. **Supabase funcionando** con las 3 tablas creadas (el SQL que ya corriste).
2. **Variables de entorno** en `.env`:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-anon-key-publica
   ```
3. Dependencias instaladas: `pip install -r requirements.txt`

---

## Script de prueba

Crea `test_db_manual.py` en la carpeta `backend/`:

```python
"""Test manual del DBService — correr desde backend/"""
import asyncio
from uuid import UUID
from app.services.db_service import DBService, DBServiceError, RecordNotFoundError
from app.models.ticket import TicketData, Prioridad, Dificultad, EstadoTicket

# ⚠️ PON TUS VALORES REALES ACÁ
SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-anon-key"


async def main():
    db = DBService(url=SUPABASE_URL, key=SUPABASE_KEY)

    print("=" * 60)
    print("CASO 1: Crear un proyecto")
    print("=" * 60)
    try:
        project = await db.create_project(
            repo_url="https://github.com/test/repo-prueba",
            archivos_seleccionados=["src/main.py", "src/utils.py"]
        )
        print(f"  ✅ Proyecto creado:")
        print(f"     ID: {project['id']}")
        print(f"     repo_url: {project['repo_url']}")
        print(f"     archivos: {project['archivos_seleccionados']}")
        project_id = UUID(project["id"])
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return  # Sin proyecto no podemos seguir

    print()
    print("=" * 60)
    print("CASO 2: Obtener el proyecto por ID")
    print("=" * 60)
    try:
        fetched = await db.get_project(project_id)
        print(f"  ✅ Proyecto obtenido: {fetched['repo_url']}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 3: Crear 3 tickets para el proyecto")
    print("=" * 60)
    try:
        mock_tickets = [
            TicketData(
                titulo="Agregar manejo de errores",
                descripcion="El código no tiene try/except en operaciones críticas",
                prioridad=Prioridad.ALTA,
                dificultad=Dificultad.MEDIA,
                tiempo_estimado_minutos=120,
            ),
            TicketData(
                titulo="Agregar tests unitarios",
                descripcion="No hay tests para las funciones principales",
                prioridad=Prioridad.MEDIA,
                dificultad=Dificultad.FACIL,
                tiempo_estimado_minutos=90,
            ),
            TicketData(
                titulo="Refactorizar módulo utils",
                descripcion="Funciones muy largas, dividir en funciones más chicas",
                prioridad=Prioridad.BAJA,
                dificultad=Dificultad.FACIL,
                tiempo_estimado_minutos=45,
            ),
        ]

        tickets = await db.create_tickets(project_id, mock_tickets)
        print(f"  ✅ {len(tickets)} tickets creados:")
        for t in tickets:
            print(f"     - [{t['prioridad']}] {t['titulo']} ({t['tiempo_estimado']}) estado={t['estado']}")
        
        ticket_id = UUID(tickets[0]["id"])
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return

    print()
    print("=" * 60)
    print("CASO 4: Obtener tickets del proyecto")
    print("=" * 60)
    try:
        project_tickets = await db.get_tickets_by_project(project_id)
        print(f"  ✅ {len(project_tickets)} tickets encontrados")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 5: Cambiar estado de ticket (to_do → in_review)")
    print("=" * 60)
    try:
        updated = await db.update_ticket_state(ticket_id, EstadoTicket.IN_REVIEW)
        print(f"  ✅ Estado actualizado: {updated['estado']}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 6: Crear una review para el ticket")
    print("=" * 60)
    try:
        review = await db.create_review(
            ticket_id=ticket_id,
            preguntas=["¿Por qué usaste ese patrón?", "¿Qué alternativa consideraste?"],
            respuestas="Usé ese patrón porque... La alternativa era...",
            feedback="Buena explicación del razonamiento.",
            aprobado=True,
        )
        print(f"  ✅ Review creada:")
        print(f"     ID: {review['id']}")
        print(f"     aprobado: {review['aprobado']}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 7: Obtener reviews del ticket")
    print("=" * 60)
    try:
        reviews = await db.get_reviews_by_ticket(ticket_id)
        print(f"  ✅ {len(reviews)} reviews encontradas")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 8: Proyecto que no existe (error esperado)")
    print("=" * 60)
    try:
        fake_id = UUID("00000000-0000-0000-0000-000000000000")
        await db.get_project(fake_id)
        print("  ❌ Debería haber lanzado RecordNotFoundError")
    except RecordNotFoundError as e:
        print(f"  ✅ RecordNotFoundError: {e}")
    except Exception as e:
        print(f"  ⚠️ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 9: Verificar formato de tiempo")
    print("=" * 60)
    from app.services.db_service import DBService
    test_cases = [(30, "30min"), (60, "1h"), (90, "1h 30min"), (120, "2h"), (150, "2h 30min")]
    all_ok = True
    for minutes, expected in test_cases:
        result = DBService._format_time(minutes)
        status = "✅" if result == expected else "❌"
        if result != expected:
            all_ok = False
        print(f"  {status} {minutes}min → '{result}' (esperado: '{expected}')")

    print()
    print("=" * 60)
    print("LIMPIEZA: Borrar datos de prueba")
    print("=" * 60)
    print("  ⚠️ Los datos de prueba quedan en Supabase.")
    print("  Para limpiar, ve al Table Editor y borra el proyecto de prueba.")
    print("  (Los tickets y reviews se borran solos por CASCADE)")
    print()
    print(f"  Proyecto de prueba ID: {project_id}")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Cómo correr

```bash
cd backend
# Asegúrate de tener SUPABASE_URL y SUPABASE_KEY en el script o en .env
python test_db_manual.py
```

---

## Resultado esperado

```
CASO 1: Crear un proyecto
  ✅ Proyecto creado: ID: abc123...

CASO 2: Obtener el proyecto por ID
  ✅ Proyecto obtenido: https://github.com/test/repo-prueba

CASO 3: Crear 3 tickets para el proyecto
  ✅ 3 tickets creados:
     - [alta] Agregar manejo de errores (2h) estado=to_do
     - [media] Agregar tests unitarios (1h 30min) estado=to_do
     - [baja] Refactorizar módulo utils (45min) estado=to_do

...

CASO 9: Verificar formato de tiempo
  ✅ 30min → '30min'
  ✅ 60min → '1h'
  ✅ 90min → '1h 30min'
  ✅ 120min → '2h'
  ✅ 150min → '2h 30min'
```

---

## Qué verificar

| Caso | Qué comprueba | Éxito si... |
|------|--------------|-------------|
| 1 | INSERT en `projects` funciona | Devuelve dict con id y fecha |
| 2 | SELECT por ID funciona | Devuelve el mismo proyecto |
| 3 | INSERT batch en `tickets` + conversión de tiempo | 3 tickets con estado `to_do` |
| 4 | SELECT con filtro por project_id | Devuelve los 3 tickets |
| 5 | UPDATE de estado | Estado cambia a `in_review` |
| 6 | INSERT en `reviews` | Devuelve review con `aprobado: true` |
| 7 | SELECT reviews por ticket_id | Devuelve la review creada |
| 8 | SELECT con ID inexistente | Lanza `RecordNotFoundError` |
| 9 | Conversión minutos → texto legible | Todos los formatos correctos |

---

## Errores comunes y solución

| Error | Causa | Solución |
|-------|-------|----------|
| `AuthApiError` | Key inválida o expirada | Revisa SUPABASE_KEY en .env |
| `ConnectionRefused` | URL incorrecta | Revisa SUPABASE_URL |
| `Check constraint violation` | Dato inválido (ej: prioridad="urgente") | Esto es CORRECTO — la DB rechaza bien |
| `Foreign key violation` | project_id no existe | Crear proyecto primero |

---

## Limpieza post-test

Después de probar, borra el proyecto de prueba desde el Table Editor de Supabase.
Al borrar el proyecto, los tickets y reviews se eliminan automáticamente (CASCADE).
