# Testing Guide — POST /api/projects/validate-repo

> Guía para probar el endpoint validate-repo desde casa.

---

## Pre-requisitos

1. `.env` configurado con al menos:
   ```
   AI_PROVIDER=gemini
   GITHUB_TOKEN=ghp_tu_token
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-key
   ```
2. Dependencias instaladas: `pip install -r requirements.txt`

---

## Cómo arrancar el servidor

```bash
cd backend
uvicorn app.main:app --reload
```

Debería decir algo como:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

## Opción 1: Probar desde Swagger UI (más fácil)

1. Abrir en el navegador: http://localhost:8000/docs
2. Buscar el endpoint **POST /api/projects/validate-repo**
3. Click en "Try it out"
4. Pegar el JSON de prueba (ver casos abajo)
5. Click "Execute"
6. Verificar el código de respuesta y el body

---

## Opción 2: Probar con curl

### CASO 1: Repo válido ✅ → Esperar 200
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/Lunisa202/DevCoach-AI"}'
```

**Respuesta esperada (200):**
```json
{
  "valid": true,
  "owner": "Lunisa202",
  "repo": "DevCoach-AI"
}
```

---

### CASO 2: Formato inválido (sin https) ❌ → Esperar 400
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "http://github.com/owner/repo"}'
```

**Respuesta esperada (400):**
```json
{
  "detail": "Formato de URL inválido. Debe ser: https://github.com/owner/repo"
}
```

---

### CASO 3: Formato inválido (falta repo) ❌ → Esperar 400
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/solo-owner"}'
```

**Respuesta esperada (400):**
```json
{
  "detail": "Formato de URL inválido. Debe ser: https://github.com/owner/repo"
}
```

---

### CASO 4: Repo que no existe ❌ → Esperar 404
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/Lunisa202/este-repo-no-existe-xyz-123"}'
```

**Respuesta esperada (404):**
```json
{
  "detail": "Repositorio no encontrado o no es público"
}
```

---

### CASO 5: URL vacía ❌ → Esperar 400
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": ""}'
```

**Respuesta esperada (400):**
```json
{
  "detail": "Formato de URL inválido. Debe ser: https://github.com/owner/repo"
}
```

---

### CASO 6: URL con slash final ✅ → Esperar 200
```bash
curl -X POST http://localhost:8000/api/projects/validate-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/Lunisa202/DevCoach-AI/"}'
```

**Respuesta esperada (200):**
```json
{
  "valid": true,
  "owner": "Lunisa202",
  "repo": "DevCoach-AI"
}
```

---

## Opción 3: Probar desde PowerShell (Windows)

```powershell
# Caso 1: Repo válido
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/projects/validate-repo" -ContentType "application/json" -Body '{"repo_url": "https://github.com/Lunisa202/DevCoach-AI"}'

# Caso 2: Formato inválido
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/projects/validate-repo" -ContentType "application/json" -Body '{"repo_url": "http://github.com/owner/repo"}'
```

---

## Tabla resumen

| # | Input | Código esperado | Detalle |
|---|-------|----------------|---------|
| 1 | `https://github.com/Lunisa202/DevCoach-AI` | 200 | valid=true, owner=Lunisa202 |
| 2 | `http://github.com/owner/repo` | 400 | No es HTTPS |
| 3 | `https://github.com/solo-owner` | 400 | Falta nombre del repo |
| 4 | `https://github.com/Lunisa202/no-existe-xyz` | 404 | Repo no existe |
| 5 | `""` (vacío) | 400 | No cumple formato |
| 6 | `https://github.com/Lunisa202/DevCoach-AI/` | 200 | Slash final aceptado |

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `uvicorn: command not found` | No está instalado | `pip install uvicorn[standard]` |
| Server no arranca: "Missing env variable" | Falta `.env` | Copia `.env.example` a `.env` y llena los valores |
| 503 "No se pudo conectar con GitHub" | Sin internet o rate limit | Verifica internet y que GITHUB_TOKEN esté en .env |
| El endpoint no aparece en /docs | El router no se registró | Verifica que `main.py` tenga `app.include_router(projects_router)` |

---

## ¿Qué sigue después de que esto funcione?

Si validate-repo pasa todos los casos:
1. Puedes avisarle a Carolina que ya tiene endpoint listo para probar su RepoInput
2. Puedes continuar con el endpoint `POST /api/projects` (crear proyecto + pipeline IA)
   - Pero ese depende de que el DB Service y GitHub Service estén probados primero
