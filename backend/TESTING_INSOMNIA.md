# Guía de Testing con Insomnia — Endpoints DevCoach AI

## Setup previo

1. Generar un **nuevo** GitHub Personal Access Token en https://github.com/settings/tokens
2. Ponerlo en `backend/.env` como `GITHUB_TOKEN=ghp_tu_nuevo_token`
3. Levantar el backend: `.\venv\Scripts\activate` luego `python -m uvicorn app.main:app --reload`
4. El servidor estará en `http://localhost:8000`
5. Swagger UI automático: `http://localhost:8000/docs`

## Base URL

```
http://localhost:8000
```

---

## Endpoint 1: Health Check

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `http://localhost:8000/health` |
| Body | ninguno |

**Response (200):**
```json
{
  "status": "ok",
  "ai_provider": "gemini"
}
```

---

## Endpoint 2: Validate Repo

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/projects/validate-repo` |
| Body type | JSON |

### Test A — URL válida
```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```
**Response (200):**
```json
{
  "valid": true,
  "owner": "Lunisa202",
  "repo": "DevCoach-AI"
}
```

### Test B — Formato inválido
```json
{
  "repo_url": "https://gitlab.com/algo/repo"
}
```
**Response (400):**
```json
{
  "detail": "Formato de URL inválido. Debe ser: https://github.com/owner/repo"
}
```

### Test C — Repo inexistente
```json
{
  "repo_url": "https://github.com/Lunisa202/repo-que-no-existe"
}
```
**Response (404):**
```json
{
  "detail": "Repositorio no encontrado o no es público"
}
```

---

## Endpoint 3: Crear Proyecto (pipeline completo)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/projects` |
| Body type | JSON |
| Timeout | Subir a 70s (el pipeline IA puede tardar) |

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI",
  "archivos_seleccionados": ["README.md", "backend/app/main.py"]
}
```

**Response (200)** — proyecto + 3 tickets:
```json
{
  "project": {
    "id": "uuid-auto-generado",
    "repo_url": "https://github.com/Lunisa202/DevCoach-AI",
    "archivos_seleccionados": ["README.md", "backend/app/main.py"],
    "fecha_analisis": "2026-07-21T..."
  },
  "tickets": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "titulo": "Agregar manejo de errores",
      "descripcion": "...",
      "prioridad": "alta",
      "dificultad": "media",
      "tiempo_estimado": "2h",
      "estado": "to_do"
    },
    { ... ticket 2 ... },
    { ... ticket 3 ... }
  ]
}
```

**NOTA:** Si los agentes de IA de Génesis aún no están mergeados, este endpoint usa datos mock (3 tickets predefinidos). Cuando se integren los agentes reales, los tickets serán generados por la IA.

---

## Endpoint 4: Obtener Tickets de un Proyecto

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `http://localhost:8000/api/projects/{project_id}/tickets` |
| Body | ninguno |

Usa el `project.id` del endpoint anterior.

**Response (200):**
```json
[
  { "id": "...", "titulo": "...", "estado": "to_do", ... },
  { ... },
  { ... }
]
```

---

## Endpoint 5: Verificar Commit

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/tickets/{ticket_id}/verify` |
| Body | ninguno |

Usa el `id` de uno de los tickets.

**Response (200) — con cambios:**
```json
{
  "ticket": { ... ticket con estado "in_review" ... },
  "diff": "--- a/file.py\n+++ b/file.py\n...",
  "message": "Cambios detectados en 1 archivo(s). Ticket en revisión."
}
```

**Response (200) — SIN cambios (revierte a to_do):**
```json
{
  "ticket": { ... ticket con estado "to_do" ... },
  "diff": null,
  "message": "No se detectaron cambios en los archivos del proyecto en el último commit."
}
```

---

## Endpoint 6: Iniciar Entrevista

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/start` |
| Body type | JSON |

**Prerequisito:** El ticket debe estar en estado `in_review` (pasa primero por verify).

```json
{
  "ticket_id": "uuid-del-ticket-en-in_review",
  "mode": "chat"
}
```

**Response (200):**
```json
{
  "ticket_id": "uuid",
  "questions": [
    "¿Por qué elegiste este enfoque para resolver el problema?",
    "¿Qué alternativa consideraste y por qué la descartaste?",
    "¿Cómo verificarías que tu solución funciona correctamente?"
  ]
}
```

**Error si ticket no está en in_review (400):**
```json
{
  "detail": "El ticket debe estar en estado 'in_review' para iniciar la entrevista. Estado actual: 'to_do'"
}
```

---

## Endpoint 7: Evaluar Respuestas

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/evaluate` |
| Body type | JSON |

```json
{
  "ticket_id": "uuid-del-ticket",
  "questions": [
    "¿Por qué elegiste este enfoque para resolver el problema?",
    "¿Qué alternativa consideraste y por qué la descartaste?",
    "¿Cómo verificarías que tu solución funciona correctamente?"
  ],
  "answers": [
    "Elegí try/except porque es el patrón estándar en Python.",
    "Consideré usar decoradores pero era más complejo.",
    "Escribiría tests unitarios que simulen los casos de error."
  ]
}
```

**Response (200) — aprobado:**
```json
{
  "feedback": "Buenas respuestas. Demuestran comprensión del problema...",
  "aprobado": true
}
```

**Efecto secundario:** Si `aprobado: true`, el ticket pasa a estado `done` automáticamente.

---

## Flujo completo de prueba (en orden)

```
1. GET  /health                              → confirmar que server arranca
2. POST /api/projects/validate-repo          → probar los 3 casos (válido, inválido, inexistente)
3. POST /api/projects                        → crear proyecto, guardar project_id y ticket_ids
4. GET  /api/projects/{project_id}/tickets   → verificar que hay 3 tickets en to_do
5. POST /api/tickets/{ticket_id}/verify      → verificar commit (puede ir a in_review o volver a to_do)
6. POST /api/interviews/start                → iniciar entrevista (solo si ticket está en in_review)
7. POST /api/interviews/evaluate             → evaluar respuestas → ticket pasa a done si aprueba
8. GET  /api/projects/{project_id}/tickets   → confirmar estados finales en el kanban
```

## Tips

- Guarda los UUIDs que devuelve cada response para usarlos en los siguientes pasos
- Si un endpoint devuelve 503, verifica tu GITHUB_TOKEN en `.env`
- El timeout de Insomnia debe estar en al menos 70 segundos para el endpoint de crear proyecto
- Puedes verificar datos directamente en Supabase → Table Editor
