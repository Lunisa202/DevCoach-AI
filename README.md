<div align="center">

# 🧠 DevCoach AI

**Tu coach técnico con IA que trabaja con tu código real**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## ¿Qué es DevCoach AI?

DevCoach AI es una plataforma de coaching técnico impulsada por inteligencia artificial que transforma la forma en que los desarrolladores mejoran sus habilidades. A diferencia de cursos genéricos, DevCoach trabaja directamente con **tu código real** — analiza tu repositorio, genera desafíos personalizados, y te entrevista sobre tus decisiones técnicas.


## 🚀 El Ciclo de Aprendizaje

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Conecta tu │ ──► │ Code Review │ ──► │  3 Tickets  │ ──► │   Commit    │
│  repositorio│     │  con IA     │     │  de mejora  │     │   real      │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  Feedback   │ ◄── │  Evaluación │ ◄── │ Entrevista  │ ◄──────────┘
│  + XP + 🏆  │     │ 5 dimensiones│    │ Chat o Voz  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## ✨ Features Principales

### 🤖 4 Agentes de IA Especializados
| Agente | Rol | Qué hace |
|--------|-----|----------|
| **Code Reviewer** | Analista senior | Detecta fortalezas y debilidades en tu código |
| **Ticket Generator** | Project Manager | Crea 3 tickets de mejora concretos y accionables |
| **Tech Lead** | Entrevistador | Te hace preguntas técnicas sobre tus decisiones |
| **Evaluator** | Evaluador | Califica en 5 dimensiones y decide si apruebas |

### 🎙️ Entrevista por Voz
La primera plataforma que te entrevista **por voz** sobre tu propio código. Speech-to-text en tiempo real, con feedback instantáneo.

### 🎮 Gamificación Completa
- **XP y Niveles** — Curva progresiva de 11 niveles
- **Racha de actividad** — Días consecutivos aprobando entrevistas
- **8 Logros desbloqueables** — Desde "Primera sangre" hasta "Leyenda"
- **Ranking global** — Compite con otros desarrolladores

### 👤 Perfiles Públicos
- Bio, GitHub, LinkedIn
- Stats visibles (proyectos, tickets, promedio)
- Logros desbloqueados
- Accesible desde el ranking

### 📊 Dashboard Inteligente
- Stats en tiempo real (proyectos, tickets, promedio)
- Gráfico de evolución semanal de calificaciones
- XP, nivel y racha visibles
- Progreso por proyecto


## 🏗️ Arquitectura

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  React 19 + TypeScript + Tailwind + Redux Toolkit       │
│  Vite · React Router v7 · lucide-react                  │
└──────────────────────────┬─────────────────────────────┘
                           │ REST API (JWT)
┌──────────────────────────▼─────────────────────────────┐
│                    BACKEND                               │
│  FastAPI + Python 3.11                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │ API Layer│  │ Services │  │   AI Agents      │      │
│  │ (routes) │──│ (GitHub, │──│ (Gemini/Groq)    │      │
│  │          │  │  DB, Auth)│  │                  │      │
│  └──────────┘  └──────────┘  └──────────────────┘      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│               SUPABASE (PostgreSQL)                      │
│  users · projects · tickets · reviews                   │
│  achievements · user_achievements                       │
└────────────────────────────────────────────────────────┘
```

## 🛠️ Setup Local

### Requisitos
- Python 3.11+
- Node.js 18+
- pnpm
- Cuenta en Supabase (free tier)
- API Key de Gemini (Google AI Studio)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env           # Editar con valores reales
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
pnpm install --config.minimum-release-age=0
./node_modules/.bin/vite --host
# → http://localhost:5173
```

### Variables de entorno (backend/.env)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=tu-api-key
GITHUB_TOKEN=tu-github-token
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=tu-anon-key
JWT_SECRET_KEY=un-secreto-largo
FRONTEND_URL=http://localhost:5173
```


## 📋 Migraciones de Base de Datos

Ejecutar en orden en Supabase → SQL Editor:

| # | Archivo | Qué hace |
|---|---------|----------|
| 001 | `001_initial_schema.sql` | Tablas projects, tickets, reviews |
| 002 | `002_add_users_auth.sql` | Tabla users + FK projects→users |
| 003 | `003_evaluacion_detallada.sql` | Campos de evaluación 5D en reviews |
| 004 | `004_user_api_key.sql` | API key personal del usuario |
| 005 | `005_add_user_alias.sql` | Alias para privacidad en ranking |
| 006 | `006_add_avatar_url.sql` | Avatar URL del usuario |
| 007 | `007_xp_level_streak.sql` | XP, nivel, racha |
| 008 | `008_retroactive_xp.sql` | Script para calcular XP retroactivo |
| 009 | `009_achievements.sql` | Tablas de logros + seed de 8 badges |
| 010 | `010_user_profile_fields.sql` | Bio, LinkedIn, GitHub username |

## 📁 Estructura del Proyecto

```
DevCoach-AI/
├── backend/
│   ├── app/
│   │   ├── ai/              ← 4 agentes de IA + providers
│   │   ├── api/             ← Endpoints REST (auth, projects, interviews, stats, ranking, achievements, profiles)
│   │   ├── models/          ← Modelos Pydantic
│   │   ├── services/        ← GitHub, DB, Auth services
│   │   ├── config.py        ← Variables de entorno
│   │   └── main.py          ← Entry point FastAPI
│   ├── supabase/            ← Migraciones SQL
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      ← UI reutilizable
│   │   ├── pages/           ← Páginas de la app
│   │   ├── hooks/           ← Custom hooks
│   │   ├── services/        ← API calls (axiosClient)
│   │   ├── store/           ← Redux slices
│   │   └── types/           ← TypeScript interfaces
│   ├── tailwind.config.js
│   └── vite.config.ts
└── docs/                    ← Documentación del proyecto
```

## 👥 Equipo

| Nombre | Rol | Foco |
|--------|-----|------|
| Génesis | Backend IA | Agentes de IA (Code Reviewer, Tech Lead, Evaluator, Ticket Generator) |
| Camilo | Plataforma | Backend (API, DB, GitHub Service, Auth) |
| Carolina | Frontend | UI/UX (páginas, componentes, entrevista) |
| Abner | Cloud | Arquitectura AWS, infraestructura |

## 🏆 Hackathon Kiro 2026

Proyecto desarrollado para el Hackathon Kiro 2026. Evaluado en:
- **Innovación** — Entrevista técnica por voz con IA sobre tu propio código
- **Impacto** — Resuelve el gap entre "funciona" y "entiendes por qué funciona"
- **Funcionalidad** — Flujo completo end-to-end con gamificación

---

<div align="center">

**Made with ❤️ and AI**

</div>
