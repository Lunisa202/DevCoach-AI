# DevCoach AI — Tareas Extra: Historial de Proyectos + Sidebar

> Estas tareas se numeran como **B.1** (backend) y **B.2** (frontend).
> Se ejecutan **después** de la tarea 9.1 (RepoInput) y **antes** de 9.2/9.3.
> Agregan la funcionalidad de historial y el layout con sidebar tipo Gemini/Deepseek.

---

## Rama de trabajo

| Módulo | Rama | Tareas |
|--------|------|--------|
| Backend | `feature/backend/api-endpoints` | B.1 |
| Frontend | `feature/frontend/sidebar` | B.2 |

---

## B.1 — Backend: Endpoints de historial de proyectos

### Qué hace concretamente

Agrega 3 endpoints nuevos que permiten:
- Listar todos los proyectos del usuario autenticado
- Eliminar un proyecto (y sus tickets/reviews en cascada)
- Obtener el historial de entrevistas de un ticket

### Endpoints nuevos

**GET /api/projects**
```
Headers:  Authorization: Bearer <token>
Response 200: [
  { id, repo_url, archivos_seleccionados, fecha_analisis, user_id },
  ...
]
Ordenados por fecha_analisis descendente (más reciente primero)
```

**DELETE /api/projects/{id}**
```
Headers:  Authorization: Bearer <token>
Response 204: (sin body, proyecto eliminado)
Error 404:    Proyecto no encontrado
Error 403:    El proyecto no pertenece al usuario autenticado
```
Nota: el CASCADE de la FK en la DB elimina tickets y reviews automáticamente.

**GET /api/tickets/{id}/reviews**
```
Headers:  Authorization: Bearer <token>
Response 200: [
  { id, ticket_id, preguntas_generadas, respuesta_usuario, feedback_evaluator, aprobado },
  ...
]
Ordenadas por fecha (más reciente primero)
```

### Métodos a agregar en `db_service.py`

```python
async def get_projects_by_user(self, user_id: str) -> list[dict]:
    """Lista todos los proyectos de un usuario, ordenados por fecha desc."""

async def delete_project(self, project_id: str, user_id: str) -> bool:
    """Elimina un proyecto verificando que pertenezca al usuario. Retorna True si se eliminó."""
```

`get_reviews_by_ticket` ya existe — solo falta el endpoint HTTP.

### Archivos a crear/modificar

```
backend/app/
├── api/
│   └── projects.py     ← agregar GET /api/projects + DELETE /api/projects/{id}
│   └── tickets.py      ← agregar GET /api/tickets/{id}/reviews
└── services/
    └── db_service.py   ← agregar get_projects_by_user + delete_project
```

### Seguridad

- `GET /api/projects` filtra por `user_id` del token — un usuario nunca ve proyectos de otro
- `DELETE /api/projects/{id}` verifica que el `user_id` del proyecto coincida con el del token antes de borrar
- `GET /api/tickets/{id}/reviews` verifica que el ticket pertenezca a un proyecto del usuario

### Cómo saber que funciona

1. Registrar un usuario → crear un proyecto → `GET /api/projects` devuelve ese proyecto
2. Registrar otro usuario → `GET /api/projects` devuelve lista vacía (no ve el del primero)
3. `DELETE /api/projects/{id}` con un proyecto propio → 204 + verificar que tickets y reviews desaparecieron
4. `DELETE /api/projects/{id}` con un proyecto ajeno → 403
5. `GET /api/tickets/{id}/reviews` después de una entrevista → devuelve la review

---

## B.2 — Frontend: Sidebar + AppLayout

### Qué hace concretamente

Implementa un layout con panel lateral persistente (como Gemini, Deepseek o ChatGPT) que:
- Muestra la lista de proyectos del usuario
- Permite hacer click en un proyecto para ver su detalle (tickets, reviews)
- Permite eliminar un proyecto desde el sidebar
- Tiene un botón "Nuevo análisis" que lleva al RepoInput
- Se mantiene visible en todas las páginas protegidas

### Diseño visual

- **Sidebar izquierdo** fijo, ancho ~280px en desktop, colapsable en mobile (hamburguesa)
- **Mismo esquema de colores** que login: `slate-800`/`slate-900` para el sidebar, contenido en `slate-50`/`slate-900`
- Cada proyecto muestra: nombre del repo (extraído de la URL), fecha relativa ("hace 2 días")
- Hover state sutil, proyecto activo con fondo `indigo-600/10`
- Botón de eliminar: ícono trash en hover, con confirmación ("¿Eliminar este proyecto?")
- Botón "Nuevo análisis" arriba del listado, estilo outlined indigo
- Header del sidebar: logo pequeño + nombre del usuario + botón logout
- En mobile: sidebar se oculta, icono hamburguesa en la esquina para desplegarlo

### Archivos a crear

```
frontend/src/
├── components/
│   ├── AppLayout.tsx          ← layout con sidebar + área de contenido (<Outlet />)
│   ├── Sidebar.tsx            ← panel lateral con lista de proyectos + header usuario
│   └── SidebarProjectItem.tsx ← cada proyecto en la lista (nombre, fecha, botón eliminar)
├── store/slices/
│   └── projectsSlice.ts      ← estado: { projects: [], activeProjectId, isLoading }
├── services/
│   └── projectService.ts     ← getProjects(), deleteProject(), getProjectTickets(), getTicketReviews()
└── hooks/
    ├── useProjects.ts         ← carga la lista de proyectos al montar
    └── useDeleteProject.ts    ← elimina proyecto con confirmación + toast
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `App.tsx` | Las rutas protegidas se envuelven con `<AppLayout>` en vez de `<ProtectedRoute>` directo |
| `store/index.ts` | Agregar `projectsReducer` al store |

### Detalle de AppLayout

```tsx
// AppLayout.tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    <Outlet />  {/* Aquí se renderiza la ruta actual */}
  </main>
</div>
```

### Estructura de rutas actualizada

```
/login          → <LoginPage />           (pública, sin sidebar)
/register       → <RegisterPage />        (pública, sin sidebar)

/               → <AppLayout>             (protegida, con sidebar)
                    <RepoInputPage />      (nuevo análisis)
/dashboard/:id  → <AppLayout>
                    <DashboardPage />      (kanban de un proyecto)
/select/:id     → <AppLayout>
                    <FileSelectorPage />
/interview/:id  → <AppLayout>
                    <InterviewPage />
```

### Flujo del sidebar

1. Al cargar `AppLayout` → hook `useProjects()` llama `GET /api/projects` → carga la lista
2. Si hay proyectos → se muestran en el sidebar ordenados por fecha
3. Click en un proyecto → navega a `/dashboard/{projectId}` → el contenido muestra el kanban
4. Click en "Nuevo análisis" → navega a `/` (RepoInput)
5. Click en eliminar → modal/confirm → `DELETE /api/projects/{id}` → toast "Proyecto eliminado" → refresca lista
6. Header muestra el nombre del usuario (de `useAuth()`) + botón logout

### Cómo saber que funciona

1. Login → sidebar muestra "No tenés proyectos aún" + botón "Nuevo análisis"
2. Crear un proyecto (9.1 + 9.2) → aparece en el sidebar automáticamente
3. Click en el proyecto → muestra el dashboard con sus tickets
4. Recargar → la lista persiste (viene del backend, no del localStorage)
5. Eliminar un proyecto → desaparece de la lista + toast de confirmación
6. En mobile → sidebar oculto, hamburguesa lo muestra como overlay

---

## Impacto en tareas existentes

| Tarea | Cambio |
|-------|--------|
| 9.1 RepoInput | Sin cambios en lógica — ahora se renderiza dentro de `<AppLayout>` |
| 9.2 FileSelector | Sin cambios en lógica — se renderiza dentro de `<AppLayout>` |
| 9.3 Dashboard | Ahora recibe `projectId` de la URL (`:id`) en vez de tenerlo hardcodeado |
| `App.tsx` | Rutas protegidas envueltas en `<AppLayout>` |
| `store/index.ts` | Agregar `projectsReducer` |

---

## Checklist

### Backend (B.1)
- [x] `GET /api/projects` devuelve proyectos del usuario autenticado
- [x] `DELETE /api/projects/{id}` elimina solo si es del usuario (403 si no)
- [x] `GET /api/tickets/{id}/reviews` devuelve historial de entrevistas
- [x] `get_projects_by_user()` en db_service
- [x] `delete_project()` en db_service

### Frontend (B.2)
- [x] `AppLayout` con sidebar + Outlet
- [x] Sidebar muestra lista de proyectos del usuario
- [x] Click en proyecto → navega a su dashboard
- [x] Botón "Nuevo análisis" → navega a `/`
- [x] Botón eliminar con modal de confirmación (portal, centrado) → borra + toast
- [x] `ConfirmModal.tsx` componente reutilizable con portal (variant: danger/default)
- [x] Header del sidebar con nombre de usuario + logout
- [x] Responsive: sidebar colapsable en mobile (overlay + hamburguesa)
- [x] `projectsSlice` en el store
- [x] `projectService.ts` con las llamadas HTTP (getProjects, deleteProject, getProjectTickets, getRepoTree)
- [x] `useProjects` hook para cargar la lista
- [x] `utils/repoUrl.ts` para extraer nombre del repo de la URL
- [x] Probado y funcionando ✅
