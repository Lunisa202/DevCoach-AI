# DevCoach AI — Guía de Inicio Rápido para el Equipo

## Ramas creadas en GitHub

Cada persona ya tiene su(s) rama(s) lista(s) para trabajar. Todas parten de `development`.

| Persona | Rama | Tareas |
|---------|------|--------|
| Génesis (Backend IA) | `feature/backend/ai-provider` | 2.1, 2.2, 2.3 |
| Génesis (Backend IA) | `feature/backend/agents` | 2.4, 2.5, 2.6, 2.7, 2.8 |
| Camilo (Plataforma) | `feature/backend/github-service` | 3.1, 3.2 |
| Camilo (Plataforma) | `feature/backend/db-service` | 4.1, 5.1 |
| Camilo (Plataforma) | `feature/backend/api-endpoints` | 7.1, 7.2, 7.3, 7.4, 7.5 |
| Carolina (Frontend) | `feature/frontend/setup` | 1.2 |
| Carolina (Frontend) | `feature/frontend/repo-input` | 9.1 |
| Carolina (Frontend) | `feature/frontend/file-selector` | 9.2 |
| Carolina (Frontend) | `feature/frontend/dashboard` | 9.3 |
| Carolina/Abner (Frontend) | `feature/frontend/interview` | 9.4, 9.5, 9.6, 9.7 |
| Carolina (Frontend) | `feature/frontend/routing` | 11.1, 11.2 |

---

## ¿Cómo empiezo?

### 1. Clonar el repositorio (solo la primera vez)

```bash
git clone https://github.com/Lunisa202/DevCoach-AI.git
cd DevCoach-AI
```

### 2. Cambiar a tu rama de trabajo

```bash
# Ejemplo para Génesis:
git checkout feature/backend/ai-provider

# Ejemplo para Camilo:
git checkout feature/backend/github-service

# Ejemplo para Carolina:
git checkout feature/frontend/setup
```

### 3. Trabajar normalmente

Haz tus cambios, commits frecuentes y push:

```bash
# Hacer cambios...
git add .
git commit -m "feat: descripción breve de lo que hiciste"
git push
```

### 4. Cuando termines tu tarea

1. Haz push final de tu rama
2. Ve a GitHub → tu rama → botón **"Compare & pull request"**
3. Base: `development` ← Compare: tu rama
4. Escribe un título breve y crea el PR
5. Pide a alguien del equipo que le dé un vistazo rápido y apruebe

---

## Convención de commits

Usamos prefijos para que el historial sea claro:

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| `feat:` | Funcionalidad nueva | `feat: add Code_Reviewer agent` |
| `fix:` | Corrección de bug | `fix: handle empty URL validation` |
| `docs:` | Solo documentación | `docs: update README` |
| `refactor:` | Cambiar código sin cambiar comportamiento | `refactor: extract validation logic` |
| `test:` | Agregar o modificar tests | `test: add parser unit tests` |
| `chore:` | Configuración, dependencias | `chore: add httpx to requirements` |

---

## Mantener tu rama actualizada

Si `development` avanzó (porque alguien más mergeó su PR), actualiza tu rama:

```bash
git checkout tu-rama
git pull origin development
# Resolvé conflictos si los hay, luego:
git push
```

---

## Estructura del proyecto

```
DevCoach-AI/
├── backend/                ← Python + FastAPI (Génesis y Camilo)
│   ├── app/
│   │   ├── main.py        ← Punto de entrada del servidor
│   │   ├── config.py      ← Variables de entorno
│   │   ├── ai/            ← Agentes de IA (Génesis)
│   │   ├── api/           ← Endpoints REST (Camilo)
│   │   ├── services/      ← GitHub + DB (Camilo)
│   │   └── models/        ← Modelos Pydantic (Camilo)
│   ├── tests/             ← Tests con pytest
│   ├── requirements.txt
│   └── .env.example       ← Copiar a .env y llenar valores
├── frontend/               ← React + Vite + Tailwind (Carolina y Abner)
│   └── (se crea con la tarea 1.2)
└── docs/
```

---

## Setup del backend (para Génesis y Camilo)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Editar .env con valores reales

# Correr el servidor:
uvicorn app.main:app --reload
# → Abrir http://localhost:8000/docs para ver la API
```

---

## Setup del frontend (para Carolina y Abner)

Se creará con la tarea 1.2, pero será algo como:

```bash
cd frontend
npm install
npm run dev
# → Abrir http://localhost:5173
```

---

## Reglas de oro

1. **Nunca pushear directo a `main` o `development`** — siempre usar tu rama feature + PR
2. **Commits pequeños y frecuentes** — no acumular un día entero de trabajo en un solo commit
3. **Si algo se rompe o te trabas** — avisar al grupo, no quedarse callado 2 horas
4. **Probar antes de hacer PR** — que al menos tu parte corra sin errores obvios

---

¡Éxito equipo! 🚀
