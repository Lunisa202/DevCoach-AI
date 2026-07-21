# Guía Completa — Camilo (Perfil Plataforma)

> Este documento contiene todo lo que necesitas para trabajar en tus tareas sin depender de la conversación con Kiro. Léelo de principio a fin antes de empezar a codear.

---

## 1. Tu flujo de tareas (orden de ejecución)

Tus tareas van en este orden estricto. Cada una depende de la anterior:

```
Wave 0:  1.1 → Setup FastAPI ✅ (YA HECHO)
         1.3 → Schema Supabase (crear tablas)

Wave 1:  5.1 → Modelos Pydantic (definir la forma de los datos)
         3.1 → GitHub Service (clase que habla con GitHub API)
         4.1 → DB Service (CRUD contra Supabase)

Wave 3:  7.1 → Endpoints de Projects
               ⚠️ PRIORIZAR validate-repo PRIMERO (desbloquea a Carolina)
         7.2 → Endpoints de Tickets
         7.3 → Endpoints de Interviews

Wave 4:  7.4* → Tests de transiciones de estado (opcional)
         7.5* → Tests del provider factory (opcional)
```

### Tabla detallada

| # | Tarea | Qué significa | Archivo(s) a crear | Rama | Cuidado con... |
|---|-------|---------------|-------------------|------|----------------|
| 1.3 | Schema Supabase | Crear las 3 tablas en el panel de Supabase | SQL en Supabase dashboard | `feature/backend/db-service` | Los CHECK de enums usan acentos: `'fácil'` no `'facil'` |
| 5.1 | Modelos Pydantic | Clases Python que definen la forma de cada dato | `app/models/project.py`, `ticket.py`, `review.py` | `feature/backend/db-service` | Alinear con Génesis (ver sección 3) |
| 3.1 | GitHub Service | Clase con métodos para hablar con GitHub API | `app/services/github_service.py` | `feature/backend/github-service` | Timeout de 10s, manejar 429/403, decodificar base64 |
| 4.1 | DB Service | Funciones CRUD para Supabase | `app/services/db_service.py` | `feature/backend/db-service` | Nunca exponer errores SQL al usuario |
| 7.1 | Endpoints Projects | `validate-repo` + `create project` | `app/api/projects.py` | `feature/backend/api-endpoints` | Pipeline AI tiene timeout de 60s total |
| 7.2 | Endpoints Tickets | Listar tickets + verificar commit | `app/api/tickets.py` | `feature/backend/api-endpoints` | Revertir a `to_do` si no hay cambios en archivos del proyecto |
| 7.3 | Endpoints Interviews | Start interview + evaluate | `app/api/interviews.py` | `feature/backend/api-endpoints` | Validar que ticket esté `in_review` antes de empezar |

### Qué rama usar para qué

```
feature/backend/github-service   → Tarea 3.1
feature/backend/db-service       → Tareas 1.3, 4.1, 5.1
feature/backend/api-endpoints    → Tareas 7.1, 7.2, 7.3, 7.4, 7.5
```

### Orden sugerido de ramas

1. Empezar en `feature/backend/db-service` (modelos + schema + DB service)
2. Pasar a `feature/backend/github-service` (GitHub service)
3. Terminar en `feature/backend/api-endpoints` (los 6 endpoints que conectan todo)

---

## 2. ¿Qué es validate-repo?

### El endpoint más simple pero más urgente

```
POST /api/projects/validate-repo
Content-Type: application/json

{ "repo_url": "https://github.com/owner/repo" }
```

### Qué hace paso a paso

1. **Recibe** la URL que el usuario escribió en el frontend
2. **Valida formato** con regex: debe ser `https://github.com/{owner}/{repo}`
3. Si el formato está mal → responde **400** con `{"detail": "Formato de URL inválido"}`
4. Si el formato está bien → llama a `github_service.validate_repo(owner, repo)`
5. Si el repo existe y es público → responde **200** con `{"valid": true, "owner": "...", "repo": "..."}`
6. Si no existe o es privado → responde **404** con `{"detail": "Repositorio no encontrado o no es público"}`
7. Si GitHub no responde en 10s → responde **503** con `{"detail": "No se pudo conectar con GitHub"}`

### ¿Por qué es urgente?

Carolina está haciendo el componente `RepoInput` (tarea 9.1). Cuando el usuario escribe una URL y da click en "Analizar", el frontend llama a este endpoint. Sin él, Carolina no puede probar el flujo real — tendría que mockear la respuesta.

**Recomendación**: haz `validate-repo` como lo PRIMERO cuando llegues a la tarea 7.1. Solo necesitas:
- La función `validate_repo()` del GitHub Service (tarea 3.1)
- Una regex para validar el formato

### Código de ejemplo para la regex

```python
import re

GITHUB_REPO_PATTERN = re.compile(
    r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$"
)

def parse_github_url(url: str) -> tuple[str, str] | None:
    """Extrae owner y repo de una URL de GitHub. Retorna None si el formato es inválido."""
    match = GITHUB_REPO_PATTERN.match(url.strip())
    if not match:
        return None
    return match.group(1), match.group(2)
```

---

## 3. ¿Qué son los modelos Pydantic y por qué alinear con Génesis?

### ¿Qué es Pydantic?

Pydantic es una librería que define la "forma" exacta de los datos usando clases Python. Si un dato no cumple las reglas, Pydantic lo rechaza automáticamente.

```python
from pydantic import BaseModel, Field

class TicketData(BaseModel):
    titulo: str = Field(max_length=120)
    descripcion: str
    prioridad: str  # "alta", "media", "baja"
    tiempo_estimado_minutos: int = Field(ge=15, le=480)

# Esto funciona:
ticket = TicketData(titulo="Mejorar manejo de errores", descripcion="...", prioridad="alta", tiempo_estimado_minutos=60)

# Esto EXPLOTA automáticamente (tiempo fuera de rango):
ticket = TicketData(titulo="...", descripcion="...", prioridad="alta", tiempo_estimado_minutos=5)
# → ValidationError: ensure this value is greater than or equal to 15
```

### ¿Por qué hay que alinearse con Génesis?

Tú y Génesis comparten los mismos modelos pero desde lados opuestos:

```
GÉNESIS (produce datos)              TÚ (consumes datos)
─────────────────────                ───────────────────
ai/code_reviewer.py                  api/projects.py
  → return CodeReviewResult(...)       → review = await analyze_code(...)
                                        → usa review.fortalezas, review.debilidades

ai/ticket_generator.py               api/projects.py  
  → return [TicketData(...), ...]      → tickets = await generate_tickets(...)
                                        → usa ticket.titulo, ticket.prioridad
```

**Si no se alinean**: Génesis podría llamar al campo `tiempo_estimado` y tú esperar `tiempo_estimado_minutos`. O él usar `"facil"` sin acento y la DB esperar `"fácil"` con acento. Todo explota silenciosamente.

### La solución

**Tú defines los modelos UNA SOLA VEZ** en `app/models/` (tarea 5.1), y Génesis los importa:

```python
# app/models/ticket.py (TÚ LO CREAS)
from enum import Enum
from pydantic import BaseModel, Field

class Prioridad(str, Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"

class Dificultad(str, Enum):
    FACIL = "fácil"
    MEDIA = "media"
    DIFICIL = "difícil"

class TicketData(BaseModel):
    titulo: str = Field(max_length=120)
    descripcion: str
    prioridad: Prioridad
    dificultad: Dificultad
    tiempo_estimado_minutos: int = Field(ge=15, le=480)
```

```python
# app/ai/ticket_generator.py (GÉNESIS LO USA)
from app.models.ticket import TicketData, CodeReviewResult

async def generate_tickets(provider, review: CodeReviewResult) -> list[TicketData]:
    # ... llama a la IA, parsea la respuesta ...
    return [TicketData(**parsed_json) for parsed_json in response]
```

### Checklist para la reunión de 15 min con Génesis

1. ✅ ¿Los campos se llaman igual? (`tiempo_estimado_minutos` no `tiempo_estimado`)
2. ✅ ¿Los enums incluyen acentos? (`"fácil"` no `"facil"`)
3. ✅ ¿`CodeReviewResult` tiene exactamente `fortalezas` y `debilidades`?
4. ✅ ¿`TicketData` tiene exactamente los 5 campos definidos?
5. ✅ ¿Ambos importan de `app/models/` (no definen sus propias versiones)?

---

## 4. Los 6 endpoints que vas a crear (resumen rápido)

### POST /api/projects/validate-repo
- **Input**: `{ "repo_url": "https://github.com/owner/repo" }`
- **Output**: `{ "valid": true, "owner": "...", "repo": "..." }`
- **Orquesta**: regex → `github_service.validate_repo()`

### POST /api/projects
- **Input**: `{ "repo_url": "...", "archivos_seleccionados": ["src/main.py", "src/utils.py"] }`
- **Output**: El proyecto creado + los 3 tickets generados
- **Orquesta**: `db.create_project()` → `github.get_file_content()` (×N) → `code_reviewer.analyze_code()` → `ticket_generator.generate_tickets()` → `db.create_tickets()`
- ⚠️ **Este es el endpoint más complejo** — timeout total de 60s para el pipeline de IA

### GET /api/projects/{id}/tickets
- **Input**: project ID en la URL
- **Output**: Lista de 3 tickets con su estado actual
- **Orquesta**: `db.get_tickets_by_project()`

### POST /api/tickets/{id}/verify
- **Input**: ticket ID en la URL
- **Output**: `{ "status": "in_review", "diff": "..." }` o error si no hay cambios
- **Orquesta**: `db.update_ticket_state("in_review")` → `github.get_default_branch()` → `github.get_last_commit()` → verificar intersección de archivos → si no hay cambios: revertir a `to_do`

### POST /api/interviews/start
- **Input**: `{ "ticket_id": "uuid", "mode": "chat" }`
- **Output**: `{ "questions": ["¿Por qué elegiste...?", "¿Qué alternativa...?"] }`
- **Orquesta**: validar ticket en `in_review` → `tech_lead.generate_questions()`

### POST /api/interviews/evaluate
- **Input**: `{ "ticket_id": "uuid", "questions": [...], "answers": [...] }`
- **Output**: `{ "feedback": "...", "aprobado": true/false }`
- **Orquesta**: `evaluator.evaluate_answers()` → `db.create_review()` → `db.update_ticket_state()` (done si aprobado, mantener in_review si no)

---

## 5. Cómo se conecta tu código con el de Génesis

### NO son dos backends separados

Es **un solo proyecto FastAPI**. La estructura es:

```
backend/app/
├── ai/                    ← GÉNESIS (funciones puras)
│   ├── provider.py        ← Interfaz + factory
│   ├── gemini_provider.py
│   ├── groq_provider.py
│   ├── code_reviewer.py   ← analyze_code(provider, files) → CodeReviewResult
│   ├── ticket_generator.py← generate_tickets(provider, review) → list[TicketData]
│   ├── tech_lead.py       ← generate_questions(provider, ticket, diff) → list[str]
│   └── evaluator.py       ← evaluate_answers(...) → EvaluationResult
│
├── api/                   ← TÚ (endpoints HTTP)
│   ├── projects.py        ← Importa y llama funciones de ai/
│   ├── tickets.py
│   └── interviews.py
│
├── services/              ← TÚ (servicios auxiliares)
│   ├── github_service.py
│   └── db_service.py
│
└── models/                ← TÚ (compartidos con Génesis)
    ├── project.py
    ├── ticket.py
    └── review.py
```

### La conexión es un import

```python
# En TU archivo api/projects.py:

from app.ai.provider import get_provider
from app.ai.code_reviewer import analyze_code
from app.ai.ticket_generator import generate_tickets
from app.services.github_service import GitHubService
from app.services.db_service import DBService

async def create_project_endpoint(data: ProjectCreate):
    # 1. Crear proyecto en DB (TU código)
    project = await db_service.create_project(data.repo_url, data.archivos_seleccionados)
    
    # 2. Traer archivos de GitHub (TU código)
    files = {}
    for path in data.archivos_seleccionados:
        content = await github_service.get_file_content(owner, repo, path)
        files[path] = content
    
    # 3. Llamar a los agentes de Génesis (IMPORTAS sus funciones)
    provider = get_provider()
    review = await analyze_code(provider, files)
    tickets = await generate_tickets(provider, review)
    
    # 4. Guardar tickets en DB (TU código)
    saved_tickets = await db_service.create_tickets(project.id, tickets)
    
    return {"project": project, "tickets": saved_tickets}
```

### ¿Cómo trabajar si Génesis no ha terminado?

Mockea sus funciones temporalmente:

```python
# Mock temporal en tu código mientras Génesis termina:
from app.models.ticket import TicketData, Prioridad, Dificultad
from app.models.review import CodeReviewResult

async def mock_analyze_code(provider, files):
    """Mock: simula el Code_Reviewer."""
    return CodeReviewResult(
        fortalezas=["Buen uso de tipos", "Código legible"],
        debilidades=["Falta manejo de errores", "No hay tests"]
    )

async def mock_generate_tickets(provider, review):
    """Mock: simula el Ticket_Generator."""
    return [
        TicketData(titulo="Agregar manejo de errores", descripcion="...", 
                   prioridad=Prioridad.ALTA, dificultad=Dificultad.MEDIA, 
                   tiempo_estimado_minutos=120),
        TicketData(titulo="Agregar tests unitarios", descripcion="...", 
                   prioridad=Prioridad.MEDIA, dificultad=Dificultad.FACIL, 
                   tiempo_estimado_minutos=90),
        TicketData(titulo="Refactorizar utils", descripcion="...", 
                   prioridad=Prioridad.BAJA, dificultad=Dificultad.FACIL, 
                   tiempo_estimado_minutos=60),
    ]
```

Cuando Génesis mergee su código, reemplazas los mocks por los imports reales. Es un cambio de 2 líneas.

---

## 6. Timeouts y manejo de errores (reglas de oro)

| Servicio | Timeout | Qué hacer si falla |
|----------|---------|-------------------|
| GitHub API | 10 segundos | Devolver 503 "No se pudo conectar con GitHub" |
| AI Provider (individual) | 30 segundos | Devolver 503 "El análisis no pudo completarse" |
| AI Pipeline completo | 60 segundos | Devolver 503 "El análisis excedió el tiempo límite" |
| Supabase | sin timeout explícito | Devolver 500 "No se pudo completar la operación" |

### Regla: NUNCA exponer detalles internos

```python
# ❌ MAL:
except Exception as e:
    return {"error": str(e)}  # Puede mostrar SQL, nombres de tabla, etc.

# ✅ BIEN:
except Exception as e:
    logger.error(f"DB error: {e}")  # Solo en logs del servidor
    raise HTTPException(status_code=500, detail="No se pudo completar la operación")
```

---

## 7. Cómo correr el backend para probar

```bash
cd backend

# Crear entorno virtual (solo la primera vez)
python -m venv venv
venv\Scripts\activate          # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales

# Correr el servidor
uvicorn app.main:app --reload

# Abrir en el navegador:
# http://localhost:8000/docs  ← Swagger UI (probar endpoints interactivamente)
# http://localhost:8000/health ← Health check
```

---

## 8. Checklist antes de hacer PR

Antes de crear un Pull Request hacia `development`:

- [ ] El servidor arranca sin errores (`uvicorn app.main:app --reload`)
- [ ] Los endpoints aparecen en `/docs`
- [ ] Probaste al menos el happy path en Swagger
- [ ] Los errores devuelven mensajes genéricos (no SQL ni tracebacks)
- [ ] No dejaste API keys ni tokens hardcodeados
- [ ] Hiciste commits con prefijo (`feat:`, `fix:`, `chore:`)

---

## 9. Resumen de archivos que vas a crear

```
backend/
├── app/
│   ├── api/
│   │   ├── projects.py         ← POST validate-repo + POST create
│   │   ├── tickets.py          ← GET tickets + POST verify
│   │   └── interviews.py       ← POST start + POST evaluate
│   ├── models/
│   │   ├── project.py          ← ProjectCreate, ProjectResponse
│   │   ├── ticket.py           ← TicketData, TicketResponse, enums
│   │   └── review.py           ← InterviewStartRequest, EvaluationResponse, etc.
│   └── services/
│       ├── github_service.py   ← GitHubService class
│       └── db_service.py       ← CRUD Supabase
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  ← (o directo en panel de Supabase)
```

---

¡Dale con todo mañana! 🚀 Si necesitas ayuda desde otra computadora, solo abre este documento y tendrás todo el contexto.
