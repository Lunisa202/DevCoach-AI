# Guía de Testing con Insomnia — Endpoints DevCoach AI

## Setup previo

1. Tener el backend corriendo: `.\venv\Scripts\python.exe -m uvicorn app.main:app --reload`
2. El servidor estará en `http://localhost:8000`
3. También puedes usar Swagger UI: `http://localhost:8000/docs` (alternativa visual sin Insomnia)

## Base URL

```
http://localhost:8000/api
```

---

## Endpoint 1: Health Check (ya funciona)

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `http://localhost:8000/health` |
| Body | ninguno |

**Response esperada (200):**
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
| Headers | `Content-Type: application/json` |
| Body | JSON (ver abajo) |

### Caso exitoso:
```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```

**Response esperada (200):**
```json
{
  "valid": true,
  "owner": "Lunisa202",
  "repo": "DevCoach-AI"
}
```

### Caso URL inválida:
```json
{
  "repo_url": "https://gitlab.com/algo/repo"
}
```

**Response esperada (400):**
```json
{
  "detail": "Formato de URL inválido. Debe ser https://github.com/{owner}/{repo}"
}
```

### Caso repo inexistente:
```json
{
  "repo_url": "https://github.com/Lunisa202/repo-que-no-existe"
}
```

**Response esperada (404):**
```json
{
  "detail": "El repositorio no fue encontrado o no es público"
}
```

---

## Endpoint 3: Crear Proyecto (análisis completo)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/projects` |
| Headers | `Content-Type: application/json` |
| Body | JSON (ver abajo) |

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI",
  "archivos_seleccionados": [
    "backend/app/main.py",
    "backend/app/config.py"
  ]
}
```

**Response esperada (200):** proyecto + 3 tickets generados

**Nota:** Este endpoint llama a la IA (Code_Reviewer + Ticket_Generator). Puede tardar 20-40 segundos. Si la IA no está configurada, devolverá error 503.

---

## Endpoint 4: Obtener Tickets de un Proyecto

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `http://localhost:8000/api/projects/{project_id}/tickets` |
| Body | ninguno |

Reemplaza `{project_id}` por el UUID que devolvió el endpoint 3.

**Response esperada (200):**
```json
[
  {
    "id": "uuid-del-ticket",
    "project_id": "uuid-del-proyecto",
    "titulo": "Mejorar manejo de errores",
    "descripcion": "...",
    "prioridad": "alta",
    "dificultad": "media",
    "tiempo_estimado": "2 horas",
    "estado": "to_do"
  },
  ...
]
```

---

## Endpoint 5: Verificar Commit

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/tickets/{ticket_id}/verify` |
| Body | ninguno |

**Response esperada (200):**
```json
{
  "ticket": { ... ticket actualizado a "in_review" ... },
  "diff": "--- a/file.py\n+++ b/file.py\n..."
}
```

**Si no hay cambios en archivos del proyecto (revierte a to_do):**
```json
{
  "ticket": { ... ticket en "to_do" ... },
  "message": "No se detectaron cambios en los archivos del proyecto"
}
```

---

## Endpoint 6: Iniciar Entrevista

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/start` |
| Headers | `Content-Type: application/json` |
| Body | JSON (ver abajo) |

```json
{
  "ticket_id": "uuid-del-ticket-en-in_review",
  "mode": "chat"
}
```

**Response esperada (200):**
```json
{
  "ticket_id": "uuid",
  "questions": [
    "¿Por qué elegiste este enfoque?",
    "¿Qué alternativa consideraste?"
  ]
}
```

---

## Endpoint 7: Evaluar Respuestas

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/evaluate` |
| Headers | `Content-Type: application/json` |
| Body | JSON (ver abajo) |

```json
{
  "ticket_id": "uuid-del-ticket",
  "questions": [
    "¿Por qué elegiste este enfoque?",
    "¿Qué alternativa consideraste?"
  ],
  "answers": [
    "Elegí try/except porque es el estándar en Python para manejo de errores.",
    "Consideré usar decoradores pero era más complejo para este caso."
  ]
}
```

**Response esperada (200) — aprobado:**
```json
{
  "feedback": "Excelente respuesta. Demuestra comprensión del patrón...",
  "aprobado": true
}
```

**Response esperada (200) — rechazado:**
```json
{
  "feedback": "La respuesta no demuestra comprensión suficiente...",
  "aprobado": false
}
```

---

## Orden de prueba recomendado

1. Health check (confirmar que el server arranca)
2. Validate repo (probar los 3 casos: válido, inválido, no existe)
3. Crear proyecto (el más complejo — depende de IA)
4. Obtener tickets
5. Verificar commit
6. Iniciar entrevista
7. Evaluar respuestas

## Tips en Insomnia

- Crea un **Environment** con variable `base_url = http://localhost:8000/api`
- Usa `{{ base_url }}/projects/validate-repo` en las URLs
- Guarda los UUIDs que devuelven las respuestas para usarlos en las siguientes peticiones
- El header `Content-Type: application/json` se pone automáticamente si eliges Body tipo JSON
