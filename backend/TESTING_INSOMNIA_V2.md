# Guía de Testing Insomnia V2 — Con Autenticación

## Setup

1. Backend corriendo: `python -m uvicorn app.main:app --reload`
2. Migraciones 001, 002, 003 aplicadas en Supabase
3. Variables JWT en `.env`:
   ```
   JWT_SECRET_KEY=una-clave-super-secreta-de-al-menos-32-caracteres
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=60
   ```

---

## FLUJO COMPLETO DE PRUEBA (en orden)

```
1. Register     → obtener token JWT
2. Login        → verificar credenciales
3. Validate     → validar URL de repo
4. Create       → crear proyecto + tickets (REQUIERE TOKEN)
5. Get tickets  → listar tickets del proyecto (REQUIERE TOKEN)
6. Verify       → verificar commit
7. Start        → iniciar entrevista
8. Evaluate     → evaluar respuestas
```

---

## 1. POST /api/auth/register

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/auth/register` |
| Body type | JSON |

```json
{
  "full_name": "Camilo Test",
  "email": "camilo@test.com",
  "password": "MiPassword123!"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-del-usuario",
    "full_name": "Camilo Test",
    "email": "camilo@test.com",
    "created_at": "2026-07-22T..."
  }
}
```

⚠️ **GUARDA EL `access_token`** — lo necesitas para todos los endpoints protegidos.

**Error email duplicado (409):**
```json
{ "detail": "El email ya está registrado" }
```

---

## 2. POST /api/auth/login

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/auth/login` |
| Body type | JSON |

```json
{
  "email": "camilo@test.com",
  "password": "MiPassword123!"
}
```

**Response (200):** mismo formato que register (token + user)

**Error credenciales (401):**
```json
{ "detail": "Credenciales incorrectas" }
```

---

## CÓMO USAR EL TOKEN EN INSOMNIA

Para los endpoints que requieren autenticación:

1. En Insomnia → pestaña **Auth**
2. Seleccionar **Bearer Token**
3. Pegar el `access_token` que obtuviste del register/login

O manualmente en Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. POST /api/projects/validate-repo

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/projects/validate-repo` |
| Auth | NO requerida |
| Body type | JSON |

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```

**Response (200):**
```json
{ "valid": true, "owner": "Lunisa202", "repo": "DevCoach-AI" }
```

---

## 4. POST /api/projects (🔒 REQUIERE TOKEN)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/projects` |
| Auth | Bearer Token |
| Body type | JSON |
| Timeout | 70s |

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI",
  "archivos_seleccionados": ["README.md", "backend/app/main.py"]
}
```

**Response (200):** proyecto + 3 tickets generados por IA

**Error sin token (401):**
```json
{ "detail": "Not authenticated" }
```

---

## 5. GET /api/projects/{project_id}/tickets (🔒 REQUIERE TOKEN)

| Campo | Valor |
|-------|-------|
| Método | GET |
| URL | `http://localhost:8000/api/projects/{project_id}/tickets` |
| Auth | Bearer Token |
| Body | ninguno |

Usa el `project.id` del paso 4.

**Response (200):** array con 3 tickets

---

## 6. POST /api/tickets/{ticket_id}/verify (🔒 REQUIERE TOKEN)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/tickets/{ticket_id}/verify` |
| Auth | Bearer Token |
| Body | ninguno |

**Response (200) — commit posterior con cambios:**
```json
{
  "ticket": { ... estado: "in_review" ... },
  "diff": "@@ ...",
  "message": "Cambios detectados en 1 archivo(s). Ticket en revisión."
}
```

**Response (200) — commit anterior al análisis:**
```json
{
  "ticket": { ... estado: "to_do" ... },
  "diff": null,
  "message": "El último commit es anterior al análisis. Haz un commit nuevo..."
}
```

---

## 7. POST /api/interviews/start (🔒 REQUIERE TOKEN)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/start` |
| Auth | Bearer Token |
| Body type | JSON |

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
    "¿Por qué elegiste este enfoque?",
    "¿Qué alternativa consideraste?",
    "¿Cómo verificarías que funciona?"
  ]
}
```

---

## 8. POST /api/interviews/evaluate (🔒 REQUIERE TOKEN)

| Campo | Valor |
|-------|-------|
| Método | POST |
| URL | `http://localhost:8000/api/interviews/evaluate` |
| Auth | Bearer Token |
| Body type | JSON |

```json
{
  "ticket_id": "uuid-del-ticket",
  "questions": [
    "¿Por qué elegiste este enfoque?",
    "¿Qué alternativa consideraste?",
    "¿Cómo verificarías que funciona?"
  ],
  "answers": [
    "Implementé un @app.exception_handler para capturar excepciones globalmente y devolver JSON estandarizado con un error_id único.",
    "Consideré BaseHTTPMiddleware pero genera issues con streaming responses. El exception_handler es más limpio para este caso.",
    "Agregaría tests con TestClient que lancen excepciones y verifiquen que la respuesta tiene el formato JSON esperado con las cabeceras CORS."
  ]
}
```

**Response (200):**
```json
{
  "feedback": "Excelentes respuestas. Demuestra conocimiento...",
  "aprobado": true
}
```

---

## Resumen de endpoints que requieren token

| Endpoint | Token |
|----------|-------|
| POST /api/auth/register | ❌ No |
| POST /api/auth/login | ❌ No |
| POST /api/projects/validate-repo | ❌ No |
| POST /api/projects | ✅ Sí |
| GET /api/projects/{id}/tickets | ✅ Sí |
| POST /api/tickets/{id}/verify | ✅ Sí |
| POST /api/interviews/start | ✅ Sí |
| POST /api/interviews/evaluate | ✅ Sí |
