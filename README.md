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

## 🔗 Demo y Enlaces

| | Enlace |
|--|--------|
| 🎬 **Video Demo** | [Video demo](https://drive.google.com/file/d/1QwcC1rgUkxyxGk3NzQoSx1nSbP_9rMhF/view) |
| 🌐 **App en producción (Vercel + Render)** | [Deploy in vercel](https://devcoach-ai-frontend.vercel.app/)_ |
| ☁️ **App en AWS (S3 + Elastic Beanstalk)** | [Deploy in AWS](https://d20a7qc0shf987.cloudfront.net/) |
| 📂 **Repositorio** | [github.com/Lunisa202/DevCoach-AI](https://github.com/Lunisa202/DevCoach-AI) |

---

## ¿Qué es DevCoach AI?

DevCoach AI es una plataforma de coaching técnico impulsada por inteligencia artificial que transforma la forma en que los desarrolladores mejoran sus habilidades. A diferencia de cursos genéricos, DevCoach trabaja directamente con **tu código real** — analiza tu repositorio, genera desafíos personalizados, y te entrevista sobre tus decisiones técnicas.


## 🚀 El Ciclo de Aprendizaje

```mermaid
flowchart LR
    A[🔗 Conecta tu\nrepositorio] --> B[🔍 Code Review\ncon IA]
    B --> C[📋 3 Tickets\nde mejora]
    C --> D[💻 Commit\nreal]
    D --> E[🎤 Entrevista\nChat o Voz]
    E --> F[📊 Evaluación\n5 dimensiones]
    F --> G[🏆 Feedback\n+ XP]
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

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (React 19 + TypeScript + Tailwind)"]
        Pages[Pages] --> Hooks[Custom Hooks]
        Hooks --> Services[Services]
        Services --> Axios[axiosClient]
        Hooks --> Store[Redux Store]
    end

    subgraph Backend["⚙️ Backend (FastAPI + Python)"]
        API[API Routes] --> BServices[Services]
        BServices --> Agents[AI Agents]
        Agents --> Gemini[Gemini 2.5 Flash]
        BServices --> GitHub[GitHub API]
    end

    subgraph Database["🗄️ Supabase (PostgreSQL)"]
        Users[(users)]
        Projects[(projects)]
        Tickets[(tickets)]
        Reviews[(reviews)]
        Achievements[(achievements)]
    end

    Axios -->|REST + JWT| API
    BServices --> Database
```

## 🤖 Pipeline de IA

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant AI as Gemini AI

    U->>F: Selecciona archivos del repo
    F->>B: POST /api/projects
    B->>AI: Code Reviewer (archivos)
    AI-->>B: { fortalezas, debilidades }
    B->>AI: Ticket Generator (review)
    AI-->>B: 3 tickets de mejora
    B-->>F: Proyecto + tickets creados

    Note over U,AI: El usuario hace commit con mejoras...

    U->>F: Verificar commit
    F->>B: POST /api/tickets/{id}/verify
    B-->>F: Ticket pasa a "En revisión"

    U->>F: Iniciar entrevista
    F->>B: POST /api/interviews/start
    B->>AI: Tech Lead (ticket + diff)
    AI-->>B: 2-3 preguntas técnicas
    B-->>F: Preguntas al usuario

    U->>F: Responde (chat o voz)
    F->>B: POST /api/interviews/evaluate
    B->>AI: Evaluator (ticket + diff + Q&A)
    AI-->>B: Calificación 5D + feedback
    B-->>F: Resultado + XP
```

## 🗄️ Modelo de Datos

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "crea"
    PROJECTS ||--o{ TICKETS : "genera"
    TICKETS ||--o{ REVIEWS : "tiene"
    USERS ||--o{ USER_ACHIEVEMENTS : "desbloquea"
    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : "otorga"

    USERS {
        uuid id PK
        text full_name
        text email UK
        text password
        int xp
        int level
        int streak
        text alias
        text avatar_url
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid user_id FK
        text repo_url
        text[] archivos_seleccionados
        timestamp fecha_analisis
    }

    TICKETS {
        uuid id PK
        uuid project_id FK
        text titulo
        text descripcion
        text prioridad
        text dificultad
        text tiempo_estimado
        text estado
    }

    REVIEWS {
        uuid id PK
        uuid ticket_id FK
        text[] preguntas_generadas
        text respuesta_usuario
        text feedback_evaluator
        boolean aprobado
        int calificacion
        jsonb aspectos_evaluados
        text[] conceptos_a_mejorar
        timestamp created_at
    }

    ACHIEVEMENTS {
        uuid id PK
        text code UK
        text name
        text description
        text icon
        text condition_type
        int condition_value
    }
```

## 🎤 Flujo de Entrevista

```mermaid
stateDiagram-v2
    [*] --> SeleccionarModo: Click "Iniciar entrevista"

    SeleccionarModo --> Chat: Elige Chat
    SeleccionarModo --> Voz: Elige Llamada

    state Chat {
        [*] --> CargarPreguntas
        CargarPreguntas --> MostrarFormulario
        MostrarFormulario --> Enviar: Responde y envía
        Enviar --> Resultado
    }

    state Voz {
        [*] --> Saludo: Avatar habla
        Saludo --> Pregunta1: TTS lee pregunta
        Pregunta1 --> Escuchar1: Mic activado
        Escuchar1 --> Pregunta2: "Terminé"
        Pregunta2 --> Escuchar2: Mic activado
        Escuchar2 --> Pregunta3: "Terminé"
        Pregunta3 --> Escuchar3: Mic activado
        Escuchar3 --> Revision: "Terminé"
        Revision --> EnviarVoz: Confirma respuestas
        EnviarVoz --> ResultadoVoz
    }

    Resultado --> [*]: Volver al dashboard
    ResultadoVoz --> [*]: Volver al dashboard
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

### 📚 Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`docs/AWS_ARCHITECTURE.md`](./docs/AWS_ARCHITECTURE.md) | Arquitectura AWS detallada (S3, CloudFront, Elastic Beanstalk, Secrets Manager, costos) |
| [`docs/TAREAS_COMPLETADAS.md`](./docs/TAREAS_COMPLETADAS.md) | Registro de las 43 tareas implementadas + reglas de diseño del frontend |

## 👥 Equipo

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AbnerHub">
        <img src="https://github.com/AbnerHub.png" width="80" style="border-radius:50%" /><br />
        <b>Abner González Carrillo</b>
      </a><br />
      Cloud Engineer<br />
      <a href="https://www.linkedin.com/in/abner-gonzalez-carrillo-2365b1232/">
        <img src="https://img.shields.io/badge/-LinkedIn-0A66C2?logo=linkedin&logoColor=white&style=flat-square" />
      </a>
      <a href="https://github.com/AbnerHub">
        <img src="https://img.shields.io/badge/-GitHub-181717?logo=github&logoColor=white&style=flat-square" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/camilo-atb">
        <img src="https://github.com/camilo-atb.png" width="80" style="border-radius:50%" /><br />
        <b>Camilo Téllez</b>
      </a><br />
      Plataforma (Backend)<br />
      <a href="https://www.linkedin.com/in/camilo-téllez">
        <img src="https://img.shields.io/badge/-LinkedIn-0A66C2?logo=linkedin&logoColor=white&style=flat-square" />
      </a>
      <a href="https://github.com/camilo-atb">
        <img src="https://img.shields.io/badge/-GitHub-181717?logo=github&logoColor=white&style=flat-square" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/genesis-morales">
        <img src="https://github.com/genesis-morales.png" width="80" style="border-radius:50%" /><br />
        <b>Génesis Morales</b>
      </a><br />
      Backend IA<br />
      <a href="https://www.linkedin.com/in/génesismoralescastro">
        <img src="https://img.shields.io/badge/-LinkedIn-0A66C2?logo=linkedin&logoColor=white&style=flat-square" />
      </a>
      <a href="https://github.com/genesis-morales">
        <img src="https://img.shields.io/badge/-GitHub-181717?logo=github&logoColor=white&style=flat-square" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Lunisa202">
        <img src="https://github.com/Lunisa202.png" width="80" style="border-radius:50%" /><br />
        <b>Carolina Limay Oliva</b>
      </a><br />
      Frontend<br />
      <a href="https://www.linkedin.com/in/carolina-limay-oliva/">
        <img src="https://img.shields.io/badge/-LinkedIn-0A66C2?logo=linkedin&logoColor=white&style=flat-square" />
      </a>
      <a href="https://github.com/Lunisa202">
        <img src="https://img.shields.io/badge/-GitHub-181717?logo=github&logoColor=white&style=flat-square" />
      </a>
    </td>
  </tr>
</table>

## 🏆 Hackathon Kiro 2026

Proyecto desarrollado para el Hackathon Kiro 2026.

### a) Impacto Tecnológico (30%)

**Problema real que resolvemos:** En la industria del software, el 68% de los desarrolladores no reciben feedback técnico personalizado sobre su código. Los code reviews en equipos son superficiales por falta de tiempo, y los juniors no entienden el "por qué" detrás de las decisiones técnicas.

**Valor que aportamos:**
- **En educación** — Reemplaza la evaluación genérica por coaching personalizado basado en el código real del estudiante
- **En empresas** — Reduce el tiempo de onboarding de desarrolladores nuevos al darles un Tech Lead virtual disponible 24/7
- **En desarrollo individual** — Cierra el gap entre "mi código funciona" y "entiendo por qué funciona así"

La plataforma no evalúa sintaxis — evalúa **comprensión técnica** en 5 dimensiones concretas, lo que ninguna herramienta de linting o CI/CD puede hacer.

### b) Innovación (30%)

**¿Qué existe hoy?**
| Herramienta | Qué hace | Limitación |
|-------------|----------|------------|
| GitHub Copilot | Genera código | No evalúa comprensión |
| SonarQube | Detecta bugs | No enseña por qué |
| LeetCode | Ejercicios genéricos | No usa tu código real |
| Code reviews manuales | Feedback real | No escalan, dependen de personas |

**Ventaja técnica de DevCoach AI:**
- **Entrevista por voz** — Primera plataforma que te entrevista verbalmente sobre tu propio PR, usando Web Speech API nativa (sin costos de APIs externas de voz)
- **Evaluación en 5 dimensiones** — No es un "aprobado/rechazado" binario; califica comprensión, justificación, alternativas, limitaciones y comunicación
- **Pipeline de 4 agentes especializados** — Cada agente tiene un rol definido (análisis, generación, entrevista, evaluación) en vez de un prompt genérico
- **Zero-config para el usuario** — Solo pega la URL de GitHub, el sistema hace todo lo demás
- **Gamificación con XP y logros** — Convierte el aprendizaje en un ciclo adictivo de mejora continua

### c) Software Funcional y Entregables (30%)

| Entregable | Estado |
|------------|--------|
| ✅ Repositorio público en GitHub | [github.com/Lunisa202/DevCoach-AI](https://github.com/Lunisa202/DevCoach-AI) |
| ✅ README completo | Con diagramas Mermaid, setup, arquitectura |
| ✅ Demo en línea | [Enlace de producción] |
| ✅ Video de presentación | [Enlace al video — máx 5 min] |
| ✅ Diagramas de arquitectura | 5 diagramas Mermaid (ciclo, arquitectura, pipeline IA, ER, flujo entrevista) |
| ✅ Código funcional end-to-end | Login → Análisis → Tickets → Entrevista → Evaluación |

### d) Uso de Servicios AWS y Kiro (10%)

```mermaid
graph TB
    subgraph AWS["☁️ AWS Cloud"]
        CF[CloudFront CDN]
        S3[S3 — Frontend estático]
        EB[Elastic Beanstalk — Backend FastAPI]
        SM[Secrets Manager — API Keys]
        CW[CloudWatch — Monitoreo]
    end

    subgraph External["🔌 Servicios externos"]
        GH[GitHub API]
        AI[Gemini 2.5 Flash]
        DB[Supabase PostgreSQL]
    end

    User[👤 Usuario] --> CF
    CF --> S3
    CF -->|REST + JWT| EB
    EB --> SM
    EB --> DB
    EB --> GH
    EB --> AI
    CW -.->|métricas| EB
```

**Servicios AWS utilizados:**

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| **Amazon S3** | Hosting del frontend React (archivos estáticos post-build) | ✅ Implementado |
| **Amazon CloudFront** | CDN global con HTTPS automático, caché de assets | ✅ Implementado |
| **AWS Elastic Beanstalk** | Despliegue del backend FastAPI (Python 3.11, auto-scaling) | ✅ Implementado |
| **AWS Secrets Manager** | Almacenamiento seguro de API keys (Gemini, GitHub, JWT) | ✅ Implementado |
| **Amazon CloudWatch** | Monitoreo de latencia, errores y alertas del backend | ✅ Configurado |

**Uso de Kiro:**

| Capacidad | Cómo se usó |
|-----------|-------------|
| **Spec-driven development** | Todas las features se diseñaron primero como specs documentadas antes de implementar |
| **Steering files** | Reglas de arquitectura (capas, tipos, español neutro) como guías activas |
| **Asistencia de código** | Implementación completa del frontend y backend con Kiro como pair programmer |
| **Hooks de automatización** | Validación de formato y lint al guardar archivos |


**Costo total en AWS Free Tier: $0/mes** (S3, CloudFront, Elastic Beanstalk t2.micro y Secrets Manager dentro de los límites gratuitos).

**Infraestructura como Código:** toda la infraestructura AWS está definida con **Terraform** en la carpeta [`infra/`](./infra), permitiendo despliegues reproducibles y versionados.

> 📄 Documentación detallada de la arquitectura AWS: [`docs/AWS_ARCHITECTURE.md`](./docs/AWS_ARCHITECTURE.md)
> 📂 Código Terraform de infraestructura: [`infra/`](./infra)

---

<div align="center">

**Made with ❤️ and AI**

</div>
