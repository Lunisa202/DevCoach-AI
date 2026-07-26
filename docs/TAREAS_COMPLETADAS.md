# DevCoach AI — Registro de Tareas Completadas

> Documento unificado con todas las tareas implementadas durante el desarrollo.
> Numeración secuencial por orden de ejecución.

---

## Resumen de progreso

| # | Tarea | Módulo | Estado |
|---|-------|--------|--------|
| 1 | Frontend Setup (Vite + React + TS + Tailwind v3 + React Router) | Frontend | ✅ |
| 2 | Backend Auth (JWT register/login + endpoints protegidos) | Backend | ✅ |
| 3 | Frontend Auth (Redux Persist + Axios interceptors + Login/Register pages) | Frontend | ✅ |
| 4 | RepoInput (validación URL GitHub) | Frontend | ✅ |
| 5 | Backend Historial (GET/DELETE projects, GET reviews, GET tree) | Backend | ✅ |
| 6 | Sidebar + AppLayout (lista de proyectos, eliminar, responsive) | Frontend | ✅ |
| 7 | FileSelector (árbol de archivos, checkboxes, crear proyecto) | Frontend | ✅ |
| 8 | Dashboard Kanban (3 columnas, tarjetas expandibles, verificar commit) | Frontend | ✅ |
| 9 | Evaluación detallada (5 dimensiones, calificación 0-100, conceptos) | Backend + Frontend | ✅ |
| 10 | Ticket Detail Page (historial expandible con barras de progreso) | Frontend | ✅ |
| 11 | Tickets en Redux Store (ticketsSlice + useTickets + useTicketDetail) | Frontend | ✅ |
| 12 | Chat Interview (preguntas + respuestas + resultado detallado) | Frontend | ✅ |
| 13 | Voice Interview (TTS + STT + avatar + audio bars + review screen) | Frontend | ✅ |
| 14 | Interview Mode Selector (modal + feature detection) | Frontend | ✅ |
| 15 | Profile/Settings (refactored con useProfile hook) | Frontend | ✅ |
| 16 | Migración a lucide-react (íconos) | Frontend | ✅ |
| 17 | Plus Jakarta Sans (tipografía) | Frontend | ✅ |
| 18 | Audio Bars CSS animation (reacciona a speech real) | Frontend | ✅ |
| 19 | Speech cleanup on unmount (detiene audio al navegar) | Frontend | ✅ |
| 20 | Español neutro latinoamericano (sin voseo argentino) | Frontend | ✅ |
| 21 | README profesional (Mermaid diagrams, hackathon criteria, equipo) | Docs | ✅ |

---

## Detalle por área

### Backend

**Autenticación (Tarea 2)**
- Tabla `users` en Supabase + migración `002`
- `POST /api/auth/register` y `POST /api/auth/login` con JWT
- `get_current_user` dependencia aplicada en todos los endpoints
- `create_project()` asocia `user_id` del token
- Contraseñas hasheadas con bcrypt

**Historial y Eliminación (Tarea 5)**
- `GET /api/projects` — lista proyectos del usuario autenticado
- `DELETE /api/projects/{id}` — elimina con verificación de ownership (403 si ajeno)
- `GET /api/tickets/{id}/reviews` — historial de entrevistas
- `GET /api/projects/tree/{owner}/{repo}` — estructura de archivos del repo
- `GET /api/tickets/{id}` — detalle de un ticket individual

**Evaluación Detallada (Tarea 9)**
- Prompt del Evaluator actualizado con 5 dimensiones (0-20 cada una)
- Schema `EvaluationResult` con `calificacion`, `aspectos_evaluados`, `conceptos_a_mejorar`
- Migración `003` con columnas nuevas en `reviews`
- Endpoint `evaluate` devuelve estructura completa

### Frontend

**Arquitectura (regla estricta)**
```
Page → Hook → Service → axiosClient
```
Ninguna page importa `axiosClient` directamente.

**Tipos** en `src/types/` (auth.ts, project.ts, interview.ts). Nunca inline.

**Store (Redux Toolkit)**
- `authSlice` — token + user (persistido en localStorage)
- `projectsSlice` — lista de proyectos del sidebar
- `ticketsSlice` — tickets del proyecto activo

**Hooks**
- `useAuth`, `useProjects`, `useTickets`, `useTicketDetail`
- `useProfile`, `useSpeechSynthesis`, `useSpeechRecognition`
- `useDarkMode`

**Pages**
- LoginPage, RegisterPage, RepoInputPage, FileSelectorPage
- DashboardPage, TicketDetailPage
- InterviewPage (wrapper), ChatInterviewPage, VoiceInterviewPage
- SettingsPage (ProfilePage)

**Componentes**
- AppLayout, Sidebar, SidebarProjectItem
- ProtectedRoute, ConfirmModal, InterviewModeModal
- Spinner, AppLoader, DevCoachLogo, DarkModeToggle
- AvatarSpeaker, AudioBars

### Migraciones SQL (Supabase)

| # | Archivo | Qué hace |
|---|---------|----------|
| 001 | initial_schema.sql | projects, tickets, reviews |
| 002 | add_users_auth.sql | users + FK projects→users |
| 003 | evaluacion_detallada.sql | calificacion, aspectos_evaluados, conceptos_a_mejorar, created_at |

### Diseño

- Paleta: slate (grises) + indigo (acento) + emerald/amber (estados)
- Dark mode con clase `dark` en `<html>` + localStorage
- Tipografía: Plus Jakarta Sans (Google Fonts)
- Íconos: lucide-react
- Responsive: sidebar colapsable, botones stack en mobile
- Toasts: react-hot-toast (5 segundos, éxito/error/info)
- Idioma: español neutro latinoamericano


---

## Funcionalidades de diseño avanzado (Propuesta implementada)

Basado en el diseño nuevo de interfaz, se implementaron las siguientes funcionalidades clasificadas por esfuerzo:

### Solo Frontend (backend ya existía) ✅

| # | Funcionalidad | Estado |
|---|---------------|--------|
| 22 | Dashboard con StatCards (Proyectos, Por completar, Completados, Promedio) | ✅ |
| 23 | Barras de progreso por proyecto | ✅ |
| 24 | Kanban rediseñado con badges | ✅ |
| 25 | Saludo personalizado ("Buenas tardes, X 👋") | ✅ |
| 26 | Visualización de calificación (círculos coloreados) | ✅ |
| 27 | Estados vacíos y skeletons | ✅ |
| 28 | Pulido de pantalla de entrevista | ✅ |

### Requirió cambios en BD ✅

| # | Funcionalidad | Migración | Estado |
|---|---------------|-----------|--------|
| 29 | Alias público (privacidad en ranking) | `005_add_user_alias.sql` | ✅ |
| 30 | Avatar / foto de perfil | `006_add_avatar_url.sql` | ✅ |
| 31 | XP y nivel del usuario | `007_xp_level_streak.sql` | ✅ |
| 32 | Racha de actividad (streak) | `007_xp_level_streak.sql` | ✅ |
| 33 | Sistema de logros / badges | `009_achievements.sql` | ✅ |
| 34 | Bio, LinkedIn, GitHub username | `010_user_profile_fields.sql` | ✅ |

### Backend nuevo ✅

| # | Funcionalidad | Endpoint | Estado |
|---|---------------|----------|--------|
| 35 | Ranking / Leaderboard | `GET /api/ranking` | ✅ |
| 36 | Actualizar alias | `PUT /api/auth/alias` | ✅ |
| 37 | Perfil con avatar | `PUT /api/auth/avatar` | ✅ |
| 38 | Stats del usuario | `GET /api/stats` | ✅ |
| 39 | Logros automáticos | `GET /api/achievements` + `GET /api/achievements/me` | ✅ |
| 40 | XP al aprobar reviews | Servicio interno | ✅ |
| 41 | Racha de actividad | Hook en login/evaluate | ✅ |
| 42 | Perfiles públicos | `GET /api/profiles/:id` | ✅ |
| 43 | API Key personal del usuario | `PUT/DELETE /api/auth/api-key` | ✅ |

### Pendiente (no bloqueante)

| Funcionalidad | Razón |
|---------------|-------|
| Notificaciones (campana) | No hay backend — se omite para no mostrar función falsa |
| Tendencias temporales (gráfico semanal) | Mejora futura — datos ya existen en `reviews.created_at` |

---

## Reglas de diseño del frontend

1. **Arquitectura de capas:** `Page → Hook → Service → axiosClient`
2. **Tipos:** siempre en `src/types/` (nunca inline, nunca re-exportados desde services)
3. **Tipografía:** Plus Jakarta Sans (Google Fonts, pesos 400/500/600/700)
4. **Íconos:** lucide-react (tree-shakeable)
5. **Idioma:** español neutro latinoamericano (sin voseo)
6. **Store:** Redux solo para datos persistentes que se visualizan en múltiples páginas
7. **Toasts:** react-hot-toast, 5 segundos, posición top-right
