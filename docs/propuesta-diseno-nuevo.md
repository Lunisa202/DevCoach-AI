# Propuesta de Diseño Nuevo — DevCoach AI

> Análisis de las funcionalidades/pantallas del diseño nuevo (`diseño-nuevo/DevCoach AI interfaz completa`) y su relevancia para el proyecto, clasificadas por esfuerzo de implementación.
>
> Contexto: la **capa visual base** (tipografía Inter + JetBrains Mono, utilidades `.btn-primary`, `.gradient-text`, `.card-hover`, animaciones) ya está aplicada en la rama `feat/frontend-visual-refresh` sin tocar lógica.

## Leyenda de categorías

- 🟢 **Solo Frontend** — el backend ya expone el dato; es maquetar/estilar.
- 🟡 **Requiere cambios en BD** — falta una columna o tabla nueva.
- 🔵 **Nueva funcionalidad de Backend** — falta un endpoint/servicio nuevo (a veces junto con cambio de BD).

Estado en las tablas: ✅ = implementado · ⏳ = pendiente.

---

## 0. Ya aplicado (capa visual base)

| Elemento | Estado |
|----------|--------|
| Tipografía Inter (UI) + JetBrains Mono (código) | ✅ Aplicado |
| Botón primario con gradiente (`.btn-primary`) | ✅ Disponible |
| Texto con gradiente (`.gradient-text`) | ✅ Disponible |
| Hover de tarjetas (`.card-hover`) + animaciones (`.fade-in`, `.slide-in`) | ✅ Disponible |

---

## 1. 🟢 Solo Frontend (backend ya hecho) — ✅ Completada

Rama: `feat/frontend-dashboard-stats`.

| Funcionalidad del diseño | Estado | Dato/endpoint |
|--------------------------|:------:|---------------|
| Dashboard con StatCards (Proyectos, Por completar, Completados, Promedio) | ✅ | `GET /api/stats` |
| Barras de progreso por proyecto (done/total) | ✅ | Tickets por proyecto (paralelizado) |
| Kanban rediseñado con badges de prioridad y dificultad | ✅ | `tickets.prioridad`, `tickets.dificultad` |
| Saludo personalizado ("Buenas tardes, X 👋") | ✅ | `user.full_name` |
| Visualización destacada de calificación (0-100) | ✅ | Círculos coloreados en el historial de reviews |
| Estados vacíos y de carga (skeletons, mensajes) | ✅ | Skeletons + iconos de lucide |
| Pulido de la pantalla de entrevista (chat/voz) | ✅ | `ResultView` compartido, iconos en lugar de emojis |

---

## 2. 🟡 Requiere cambios en Base de Datos

Necesitan una columna o tabla nueva antes de poder mostrarse.

| Funcionalidad | Estado | Cambio en BD necesario |
|---------------|:------:|------------------------|
| Alias / nombre público (privacidad en ranking) | ✅ | `users.alias TEXT` con CHECK 1..30 chars (migración `005_add_user_alias.sql`) |
| Avatar / foto de perfil | ⏳ | `users.avatar_url TEXT` (+ storage de la imagen) |
| Sistema de logros / badges | ⏳ | Tabla `achievements` (catálogo) + tabla puente `user_achievements` |
| Racha de actividad (streak) | ⏳ | Registro de actividad diaria (`users.last_active_date`, `users.current_streak` o tabla `user_activity`) |
| Nivel / XP del usuario | ⏳ | `users.xp INTEGER`, `users.level INTEGER` (o tabla derivada) |

---

## 3. 🔵 Nuevas funcionalidades de Backend

Requieren endpoint/servicio nuevo. Se indica si además dependen de un cambio de BD (sección 2).

| Funcionalidad | Estado | Backend nuevo | ¿Depende de BD? |
|---------------|:------:|---------------|-----------------|
| Ranking / Leaderboard (comparar usuarios) | ✅ | `GET /api/ranking?limit=10` + `db_service.get_leaderboard()` con agregación cross-user | Sí — `users.alias` |
| Actualizar alias | ✅ | `PUT /api/auth/alias` (validación 1..30 chars tras trim) | Sí — `users.alias` |
| Perfil de usuario (avatar, bio) | ⏳ | `PUT /api/auth/avatar` + storage | Sí — `users.avatar_url` |
| Notificaciones (la campana del diseño) | ⏳ | `GET /api/notifications` + tabla `notifications` | Sí — tabla nueva |
| Tendencias temporales en stats (progreso por semana) | ⏳ | Ampliar `GET /api/stats` con series de tiempo | No — `reviews.created_at` ya existe |
| Logros automáticos (otorgar badges al cumplir hitos) | ⏳ | Servicio que evalúa hitos + endpoint de consulta | Sí — tablas de logros |
| XP y nivel del usuario | ⏳ | Sumar XP al aprobar reviews + endpoint que devuelva xp/level | Sí — `users.xp`, `users.level` |
| Racha de actividad | ⏳ | Middleware/hook que actualiza el streak al login o al aprobar review | Sí — columnas o tabla de actividad |

---

## 4. Pendientes de gamificación (siguiente paso)

Detalle de los 4 ítems que quedan de la fase 2 tras completar el ranking. Cada uno es independiente y cabe en una rama propia.

### 4.1. Avatar / foto de perfil

| Aspecto | Detalle |
|---------|---------|
| BD | Migración con `users.avatar_url TEXT NULL`. |
| Backend | `PUT /api/auth/avatar` (subida a Supabase Storage o URL directa). Devolver `UserResponse` con `avatar_url`. |
| Frontend | Uploader en `SettingsPage`, sustituir `UserAvatar` de iniciales por `<img>` cuando exista `avatar_url`. Fallback a iniciales si el fetch falla. |
| Complejidad | Baja (más simple de los 4). |

### 4.2. Nivel / XP

| Aspecto | Detalle |
|---------|---------|
| BD | `users.xp INTEGER DEFAULT 0`, `users.level INTEGER DEFAULT 1`. |
| Backend | Sumar XP en cada review aprobada (regla: p.ej. `xp += calificacion`). Función/servicio para recalcular nivel según curva. Endpoint `GET /api/stats` extendido con `xp`, `level`, `xp_next_level`. |
| Frontend | Barra de progreso de XP en `Sidebar` o header, badge de nivel junto al avatar, toast "¡Subiste de nivel!" al cruzar el umbral. |
| Complejidad | Media. Requiere decidir la curva de niveles (cuánto XP por nivel). |

### 4.3. Racha de actividad (streak)

| Aspecto | Detalle |
|---------|---------|
| BD | Opción A: `users.last_active_date DATE`, `users.current_streak INTEGER`. Opción B: tabla `user_activity(user_id, date)` con `UNIQUE (user_id, date)` (más flexible para estadísticas). |
| Backend | Hook al login o al aprobar review que actualiza el streak: incrementa si `last_active_date == ayer`, resetea a 1 si fue antes, no hace nada si es hoy. Endpoint devuelve `current_streak` en `/api/stats`. |
| Frontend | Widget de racha en `HomePage` con icono `Flame` (lucide) y número de días. Highlight si la racha ≥ 7. |
| Complejidad | Media. Cuidar zonas horarias al comparar fechas. |

### 4.4. Logros / badges

| Aspecto | Detalle |
|---------|---------|
| BD | `achievements(id, code, title, description, icon, threshold_rule)` — catálogo estático + `user_achievements(user_id, achievement_id, unlocked_at)` — instancias por usuario. |
| Backend | Seed inicial de badges (Primera entrevista, 10 entrevistas aprobadas, Racha de 7 días, Primer 100/100, etc.). Servicio que evalúa hitos al aprobar reviews y crea filas en `user_achievements`. Endpoints `GET /api/achievements` (catálogo) y `GET /api/achievements/me` (los del usuario). |
| Frontend | Sección "Logros" en perfil/settings o pestaña propia. Toast/modal "¡Nuevo logro!" cuando el endpoint devuelva uno recién desbloqueado. Estados bloqueado (gris) vs desbloqueado (color + fecha). |
| Complejidad | Alta. Es la más grande porque requiere catálogo, evaluación de hitos y notificación en tiempo real. |

---

## 5. Recomendación de priorización

1. **Fase 1 — Solo frontend** ✅ hecho en `feat/frontend-dashboard-stats`.
2. **Fase 2a — Ranking + Alias** ✅ hecho en `feat/ranking-leaderboard`.
3. **Fase 2b — Gamificación extendida** (sección 4): abordar por orden de retorno/esfuerzo.
    1. Avatar (baja complejidad, alta percepción de personalización).
    2. XP/Nivel (barra siempre visible, muy satisfactoria).
    3. Streak (widget puntual en el dashboard).
    4. Logros/badges (la más grande, mejor al final).

### Notas
- Cada ítem de la fase 2b es autocontenido y cabe en su propia rama sin bloquear el resto.
- La campana de notificaciones del diseño sigue sin backend; se mantiene omitida hasta implementar la sección de notificaciones para no mostrar una función falsa.
