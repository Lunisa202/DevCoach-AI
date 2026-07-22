# Testing Guide — Autenticación JWT (Insomnia)

> Guía paso a paso para probar los endpoints de auth desde Insomnia.

---

## Pre-requisitos

1. ✅ SQL `002_add_users_auth.sql` ejecutado en Supabase
2. ✅ Dependencias instaladas (`pip install -r requirements.txt` desde `backend/`)
3. `.env` con las variables JWT:
   ```
   JWT_SECRET_KEY=mi-clave-secreta-de-al-menos-32-caracteres-muy-larga
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=60
   ```

---

## Arrancar el servidor

```bash
cd backend
uvicorn app.main:app --reload
```

Si arranca bien, verás:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Si falla con "Missing or invalid environment variable", revisa tu `.env`.

---

## Configurar Insomnia

1. Crear una nueva **Collection** llamada "DevCoach AI - Auth"
2. Crear las siguientes requests:

---

## CASO 1: Registrar usuario nuevo ✅

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/auth/register`
- Body: JSON

```json
{
  "full_name": "Camilo Téllez",
  "email": "camilo@test.com",
  "password": "MiPassword123"
}
```

**Headers:**
- `Content-Type: application/json`

**Respuesta esperada (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-generado",
    "full_name": "Camilo Téllez",
    "email": "camilo@test.com",
    "created_at": "2026-07-22T..."
  }
}
```

⚠️ **Copia el `access_token`** — lo necesitas para los siguientes tests.

---

## CASO 2: Login con credenciales correctas ✅

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/auth/login`
- Body: JSON

```json
{
  "email": "camilo@test.com",
  "password": "MiPassword123"
}
```

**Respuesta esperada (200 OK):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-generado",
    "full_name": "Camilo Téllez",
    "email": "camilo@test.com",
    "created_at": "..."
  }
}
```

---

## CASO 3: Login con contraseña incorrecta ❌

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/auth/login`
- Body: JSON

```json
{
  "email": "camilo@test.com",
  "password": "ContraseñaIncorrecta"
}
```

**Respuesta esperada (401 Unauthorized):**
```json
{
  "detail": "Credenciales incorrectas"
}
```

---

## CASO 4: Login con email que no existe ❌

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/auth/login`
- Body: JSON

```json
{
  "email": "noexiste@test.com",
  "password": "Cualquiera123"
}
```

**Respuesta esperada (401 Unauthorized):**
```json
{
  "detail": "Credenciales incorrectas"
}
```

> NOTA: El mensaje es el MISMO que con contraseña incorrecta — esto es intencional
> para no revelar si un email está registrado o no.

---

## CASO 5: Registrar email duplicado ❌

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/auth/register`
- Body: JSON

```json
{
  "full_name": "Otro Usuario",
  "email": "camilo@test.com",
  "password": "OtraPassword123"
}
```

**Respuesta esperada (409 Conflict):**
```json
{
  "detail": "El email ya está registrado"
}
```

---

## CASO 6: Registrar con datos inválidos ❌

**Request (falta email):**
```json
{
  "full_name": "Test",
  "password": "123456"
}
```

**Respuesta esperada (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "email"],
      "msg": "Field required"
    }
  ]
}
```

---

## CASO 7: Usar token en endpoint protegido ✅

Después de hacer login/register, usa el token para acceder a endpoints protegidos.

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/api/projects/validate-repo`
- Body: JSON

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer TU_TOKEN_AQUI`

(En Insomnia: pestaña "Auth" → seleccionar "Bearer Token" → pegar el token)

**Respuesta esperada (200 OK):**
```json
{
  "valid": true,
  "owner": "Lunisa202",
  "repo": "DevCoach-AI"
}
```

---

## CASO 8: Endpoint protegido SIN token ❌

**Request (sin header Authorization):**
- Method: `POST`
- URL: `http://localhost:8000/api/projects/validate-repo`
- Body: JSON

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```

**Respuesta esperada (403 Forbidden):**
```json
{
  "detail": "Not authenticated"
}
```

---

## CASO 9: Token inválido/expirado ❌

**Request con token basura:**
- Method: `POST`
- URL: `http://localhost:8000/api/projects/validate-repo`
- Headers: `Authorization: Bearer token.invalido.xyz`
- Body: JSON

```json
{
  "repo_url": "https://github.com/Lunisa202/DevCoach-AI"
}
```

**Respuesta esperada (401 Unauthorized):**
```json
{
  "detail": "Token inválido o expirado"
}
```

---

## Resumen de casos

| # | Endpoint | Qué prueba | Código esperado |
|---|----------|-----------|----------------|
| 1 | POST /api/auth/register | Registro exitoso | 201 |
| 2 | POST /api/auth/login | Login exitoso | 200 |
| 3 | POST /api/auth/login | Password incorrecto | 401 |
| 4 | POST /api/auth/login | Email inexistente | 401 |
| 5 | POST /api/auth/register | Email duplicado | 409 |
| 6 | POST /api/auth/register | Datos faltantes | 422 |
| 7 | POST /api/projects/validate-repo | Con token válido | 200 |
| 8 | POST /api/projects/validate-repo | Sin token | 403 |
| 9 | POST /api/projects/validate-repo | Token inválido | 401 |

---

## Tips para Insomnia

### Configurar Bearer Token globalmente

1. En la Collection, click en "..." → "Collection Settings"
2. Ve a la pestaña "Auth"
3. Selecciona "Bearer Token"
4. Pega tu token

Así todas las requests de la collection lo heredan automáticamente.
Para las de auth (register/login), pon "No Auth" individualmente.

### Environment variables en Insomnia

Puedes crear un Environment con:
```json
{
  "base_url": "http://localhost:8000",
  "token": ""
}
```

Y usar `{{ base_url }}/api/auth/login` en las URLs.
Después de hacer login, copia el token al environment.

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Server no arranca: "JWT_SECRET_KEY" | Falta en .env | Agregar JWT_SECRET_KEY con una cadena larga |
| 500 en register | Tabla `users` no existe | Correr `002_add_users_auth.sql` en Supabase |
| 500 en register | Columna `user_id` en projects falla | Borrar datos de prueba en projects, o ver si la migración corrió bien |
| 401 siempre | Token expirado | Hacer login de nuevo y usar el nuevo token |
| 403 "Not authenticated" | No hay header Authorization | Agregar Bearer Token en Insomnia |

---

## Después de probar

Si todo funciona:
1. ✅ La autenticación backend está lista
2. ✅ Carolina puede conectar su frontend (LoginPage, RegisterPage) con estos endpoints
3. ✅ Todos los endpoints de projects/tickets/interviews requieren token
