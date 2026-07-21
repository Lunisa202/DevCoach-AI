# Pendientes para la Casa — Camilo

> Este documento tiene TODO lo que necesitas hacer cuando llegues a casa en otra computadora.
> No depende de la conversación con Kiro. Solo sigue los pasos.

---

## 0. Preparar el entorno (si es computador nuevo)

```bash
# Clonar el repo (si no lo tienes)
git clone https://github.com/Lunisa202/DevCoach-AI.git
cd DevCoach-AI

# O si ya lo tienes, actualizar:
git fetch --all

# Cambiar a la rama de trabajo
git checkout feature/backend/db-service
git pull origin feature/backend/db-service

# También necesitas la rama del GitHub Service
git checkout feature/backend/github-service
git pull origin feature/backend/github-service

# Instalar dependencias
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
```

---

## 1. Crear Personal Access Token de GitHub (2 minutos, gratis)

1. Ir a: https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Nombre: `DevCoach-AI` (o lo que quieras)
4. Expiración: 30 días está bien
5. **NO marques ningún permiso** — para repos públicos no hace falta
6. Click **"Generate token"**
7. **Copia el token** (empieza con `ghp_...`) — solo lo ves una vez

---

## 2. Configurar el archivo .env

```bash
cd backend
cp .env.example .env
```

Editar `.env` con valores reales:

```env
AI_PROVIDER=gemini
GITHUB_TOKEN=ghp_TU_TOKEN_AQUI
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key-publica
FRONTEND_URL=http://localhost:5173
```

**¿Dónde conseguir SUPABASE_URL y SUPABASE_KEY?**
- Entra a https://supabase.com/dashboard
- Selecciona tu proyecto
- Ve a Settings → API
- `SUPABASE_URL` = Project URL
- `SUPABASE_KEY` = anon/public key (la primera que aparece)

---

## 3. Probar el GitHub Service (rama: feature/backend/github-service)

```bash
git checkout feature/backend/github-service
cd backend
```

Crea el archivo `test_github_manual.py` copiando el script de `TESTING_GITHUB_SERVICE.md` (está en la misma carpeta `backend/`).

```bash
python test_github_manual.py
```

**Resultado esperado:** 8 casos, todos con ✅

| Caso | Qué debe pasar |
|------|---------------|
| 1. Repo válido | `True` |
| 2. Repo inexistente | `RepoNotFoundError` |
| 3. Owner inválido | `RepoNotFoundError` |
| 4. Rama por defecto | Devuelve `"main"` |
| 5. Árbol de archivos | Lista de archivos (puede ser corta si main tiene poco) |
| 6. Contenido archivo | Texto del README.md |
| 7. Archivo inexistente | `RepoNotFoundError` |
| 8. Último commit | SHA + mensaje + archivos cambiados |

**Si ves `RateLimitExceededError`:** pon tu GITHUB_TOKEN en la variable `TOKEN` del script.

---

## 4. Probar el DB Service (rama: feature/backend/db-service)

```bash
git checkout feature/backend/db-service
cd backend
```

Crea el archivo `test_db_manual.py` copiando el script de `TESTING_DB_SERVICE.md` (está en la misma carpeta `backend/`).

**IMPORTANTE:** Edita las variables al inicio del script:
```python
SUPABASE_URL = "https://tu-proyecto.supabase.co"  # ← pon la tuya
SUPABASE_KEY = "tu-anon-key"                       # ← pon la tuya
```

```bash
python test_db_manual.py
```

**Resultado esperado:** 9 casos, todos con ✅

| Caso | Qué debe pasar |
|------|---------------|
| 1. Crear proyecto | Devuelve dict con ID |
| 2. Obtener proyecto | Lo encuentra |
| 3. Crear 3 tickets | 3 tickets con estado `to_do` |
| 4. Listar tickets | Los 3 tickets |
| 5. Cambiar estado | `in_review` |
| 6. Crear review | Guardada con `aprobado: true` |
| 7. Listar reviews | 1 review encontrada |
| 8. Proyecto inexistente | `RecordNotFoundError` |
| 9. Formato de tiempo | Todas las conversiones correctas |

**Limpieza:** Después de probar, borra el proyecto de prueba desde el Table Editor de Supabase (los tickets/reviews se borran solos por CASCADE).

---

## 5. Si todo pasa: Mergear a development

```bash
# Primero el GitHub Service
git checkout development
git pull origin development
git merge feature/backend/github-service --no-edit
git push origin development

# Luego el DB Service
git merge feature/backend/db-service --no-edit
git push origin development
```

**Avisa al grupo** que ya hay código nuevo en `development`:
> "Ya subí GitHub Service y DB Service a development. Hagan `git pull origin development`"

---

## 6. Siguiente tarea después del merge

La siguiente tarea es **7.1 — Endpoints de Projects** (rama: `feature/backend/api-endpoints`).

Prioridad: hacer `POST /api/projects/validate-repo` PRIMERO porque desbloquea a Carolina.

**NOTA:** El endpoint `validate-repo` ya está hecho en la rama `feature/backend/api-endpoints`.
Para probarlo:
1. `git checkout feature/backend/api-endpoints`
2. `git pull origin feature/backend/api-endpoints`
3. Configura `.env` y corre `uvicorn app.main:app --reload`
4. Abre http://localhost:8000/docs y prueba el endpoint
5. Revisa `TESTING_VALIDATE_REPO.md` para los 6 casos de prueba

Si funciona, también mergea esa rama a development.

---

## Resumen de lo que ya está hecho

| Tarea | Estado | Rama | Archivos |
|-------|--------|------|----------|
| 1.1 Setup FastAPI | ✅ Completo | merged a development | `app/main.py`, `app/config.py` |
| 1.3 Schema Supabase | ✅ Completo | SQL en Supabase | 3 tablas creadas |
| 5.1 Modelos Pydantic | ✅ Completo + merged | development | `app/models/*.py` |
| 3.1 GitHub Service | ✅ Código listo, falta probar | feature/backend/github-service | `app/services/github_service.py` |
| 4.1 DB Service | ✅ Código listo, falta probar | feature/backend/db-service | `app/services/db_service.py` |
| 7.1 validate-repo | ✅ Código listo, falta probar | feature/backend/api-endpoints | `app/api/projects.py` |

---

## Estructura actual del backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              ← FastAPI app (ya funciona)
│   ├── config.py            ← Lee .env, valida vars
│   ├── ai/
│   │   └── __init__.py      ← Génesis trabaja aquí
│   ├── api/
│   │   └── __init__.py      ← Tarea 7.x (siguiente)
│   ├── models/
│   │   ├── __init__.py      ← Re-exports todo
│   │   ├── project.py       ← ProjectCreate, ProjectResponse, etc.
│   │   ├── ticket.py        ← TicketData, enums, TicketResponse
│   │   └── review.py        ← CodeReviewResult, EvaluationResult, etc.
│   └── services/
│       ├── __init__.py
│       ├── github_service.py ← 5 métodos (validate, tree, content, branch, commit)
│       └── db_service.py     ← CRUD projects, tickets, reviews
├── tests/
├── requirements.txt
├── .env.example
├── TESTING_GITHUB_SERVICE.md ← Guía de test para tarea 3.1
└── TESTING_DB_SERVICE.md     ← Guía de test para tarea 4.1
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `ModuleNotFoundError: No module named 'httpx'` | `pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'supabase'` | `pip install -r requirements.txt` |
| `Error de conexión con GitHub` | Verifica internet y que el token no esté expirado |
| `AuthApiError` de Supabase | Revisa SUPABASE_KEY, copia la anon key del dashboard |
| `relation "projects" does not exist` | No corriste el SQL del schema. Ve al SQL Editor de Supabase y pégalo |
| Git merge conflict | `git merge --abort` y pregunta antes de resolver |
| `rate limit exceeded` | Agrega tu GITHUB_TOKEN, o espera 1 hora |
