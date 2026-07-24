# Propuesta de Diseño Nuevo — DevCoach AI

> Análisis de las funcionalidades/pantallas del diseño nuevo (`diseño-nuevo/DevCoach AI interfaz completa`) y su relevancia para el proyecto, clasificadas por esfuerzo de implementación.
>
> Contexto: la **capa visual base** (tipografía Inter + JetBrains Mono, utilidades `.btn-primary`, `.gradient-text`, `.card-hover`, animaciones) ya está aplicada en la rama `feat/frontend-visual-refresh` sin tocar lógica.

## Leyenda de categorías

- 🟢 **Solo Frontend** — el backend ya expone el dato; es maquetar/estilar.
- 🟡 **Requiere cambios en BD** — falta una columna o tabla nueva.
- 🔵 **Nueva funcionalidad de Backend** — falta un endpoint/servicio nuevo (a veces junto con cambio de BD).

---

## 0. Ya aplicado (capa visual base)

| Elemento | Estado |
|----------|--------|
| Tipografía Inter (UI) + JetBrains Mono (código) | ✅ Aplicado |
| Botón primario con gradiente (`.btn-primary`) | ✅ Disponible |
| Texto con gradiente (`.gradient-text`) | ✅ Disponible |
| Hover de tarjetas (`.card-hover`) + animaciones (`.fade-in`, `.slide-in`) | ✅ Disponible |

---

## 1. 🟢 Solo Frontend (backend ya hecho)

Usan datos/endpoints que ya existen. Máximo impacto visual, mínimo esfuerzo.

| Funcionalidad del diseño | Qué aporta | Dato/endpoint que ya existe |
|--------------------------|-----------|------------------------------|
| **Dashboard con StatCards** (Proyectos, Por completar, Completados, Promedio) | Vista de progreso de un vistazo | `GET /api/stats` (`total_projects`, `tickets_by_state`, `avg_score`, `approved_reviews`) |
| **Barras de progreso por proyecto** (done/total) | Sensación de avance, gamificación | Estados de `tickets` (`to_do/in_review/done`) |
| **Kanban rediseñado con badges** de prioridad y dificultad | Lectura rápida del tablero | Campos `tickets.prioridad` y `tickets.dificultad` |
| **Saludo personalizado** ("Buenas tardes, X 👋") | Cercanía, personalización | Datos de usuario ya en sesión (`full_name`) |
| **Visualización destacada de calificación** (0-100) | Refuerza el resultado de la entrevista | `reviews.calificacion` |
| **Estados vacíos y de carga** (skeletons, mensajes) | Percepción de calidad | No requiere dato nuevo |
| **Pulido de la pantalla de entrevista** (chat/voz) | Cohesión visual del flujo core | Endpoints de `interviews` ya existen |

---

## 2. 🟡 Requiere cambios en Base de Datos

Necesitan una columna o tabla nueva antes de poder mostrarse.

| Funcionalidad | Cambio en BD necesario |
|---------------|------------------------|
| **Alias / nombre público** (privacidad en ranking) | Nueva columna `alias TEXT` en `users` |
| **Avatar / foto de perfil** | Nueva columna `avatar_url TEXT` en `users` |
| **Sistema de logros / badges** | Nueva tabla `achievements` + tabla puente `user_achievements` |
| **Racha de actividad (streak)** | Registro de actividad diaria (columna/tabla de fechas de actividad) |
| **Nivel / XP del usuario** | Columnas `xp INTEGER`, `level INTEGER` en `users` (o tabla derivada) |

---

## 3. 🔵 Nuevas funcionalidades de Backend

Requieren endpoint/servicio nuevo. Se indica si además dependen de un cambio de BD (sección 2).

| Funcionalidad | Backend nuevo | ¿Depende de BD? |
|---------------|---------------|-----------------|
| **Ranking / Leaderboard** (comparar usuarios) | `GET /api/ranking` + agregación cross-user en `db_service.py` | Sí — `users.alias` (para privacidad) |
| **Actualizar alias** | `PATCH /api/users/me` (o similar) | Sí — `users.alias` |
| **Perfil de usuario** (avatar, bio) | `GET/PATCH /api/users/me` | Sí — columnas de perfil |
| **Notificaciones** (la campana del diseño) | `GET /api/notifications` + tabla `notifications` | Sí — tabla nueva |
| **Tendencias temporales en stats** (progreso por semana) | Ampliar `GET /api/stats` con series de tiempo | No — `reviews.created_at` ya existe |
| **Logros automáticos** (otorgar badges al cumplir hitos) | Servicio que evalúa hitos + endpoint de consulta | Sí — tablas de logros |

---

## 4. Recomendación de priorización

1. **Primero (mejor retorno inmediato):** sección 1 — Dashboard con StatCards + barras de progreso. El dato ya existe, solo es frontend.
2. **Segundo (alinea con el objetivo de interactividad):** Ranking/Leaderboard (sección 3) — ya tiene requisitos redactados en `.kiro/specs/ranking-leaderboard/`. Implica un cambio pequeño de BD (`users.alias`) + un endpoint.
3. **Tercero (gamificación extendida):** logros, racha y nivel/XP (secciones 2 y 3), que profundizan la interactividad una vez el ranking esté en marcha.

### Notas
- Casi toda la sección 1 es frontend puro sobre datos existentes; no requiere backend nuevo.
- El ranking es el punto donde frontend, un cambio menor de BD y un endpoint nuevo convergen; es el mejor "siguiente gran paso".
- La campana de notificaciones del diseño hoy no tiene backend; se recomienda omitirla hasta implementar la sección de notificaciones para no mostrar una función falsa.
