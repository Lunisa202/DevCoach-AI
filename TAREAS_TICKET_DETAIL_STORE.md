# DevCoach AI — Tareas E.1 y F.1

---

## E.1 — Página de detalle de ticket (COMPLETADA ✅)

### Qué hace

Página dedicada para ver toda la información de un ticket y su historial de entrevistas.

### Ruta

`/ticket/:ticketId`

### Funcionalidad implementada

- Header con título, descripción, estado (badge de color), prioridad, dificultad, tiempo estimado
- Botón "Verificar commit" si estado es `to_do`
- Botón "Iniciar entrevista" si estado es `in_review` (abre modal selector de modalidad)
- Botón "Volver al dashboard"
- Historial de entrevistas: cada intento es un accordion expandible que muestra:
  - Badge aprobado/no + calificación /100
  - Fecha y hora del intento
  - Barra de progreso general
  - 5 dimensiones con barras individuales (0-20) + comentario por dimensión
  - Conceptos a profundizar como tags
  - Feedback completo del evaluador

### Archivos

- `src/pages/TicketDetailPage.tsx`
- `backend/app/api/tickets.py` — agregado `GET /api/tickets/{ticketId}` 

### Acceso

- Desde el Dashboard: click en tarjeta expandida → botón "Ver detalle completo"
- URL directa: `/ticket/:ticketId`

---

## F.1 — Mover tickets al Redux Store (PENDIENTE)

### Por qué

Los tickets del proyecto activo se usan en múltiples páginas:
- `DashboardPage` — kanban con 3 columnas
- `TicketDetailPage` — detalle individual
- `Sidebar` — potencialmente mostrar progreso ("2/3 completados")

Actualmente cada página hace un fetch independiente. Con el store se cargan una vez y se comparten.

### Qué hacer

1. Crear `src/store/slices/ticketsSlice.ts`:
```ts
interface TicketsState {
  tickets: TicketResponse[]
  activeTicketId: string | null
  isLoading: boolean
}

Actions:
- setTickets(tickets)
- updateTicketState(ticketId, newState)
- setActiveTicket(ticketId)
- setTicketsLoading(boolean)
```

2. Crear `src/hooks/useTickets.ts`:
```ts
// Carga tickets del proyecto activo
// Expone: tickets, isLoading, loadTickets(projectId), updateTicket(id, state)
```

3. Actualizar `DashboardPage.tsx`:
- Usar `useTickets()` en vez de useState + fetch local
- Al verificar commit → dispatch `updateTicketState`

4. Actualizar `TicketDetailPage.tsx`:
- Leer el ticket del store (si ya está cargado) o fetch si no
- Al verificar/evaluar → dispatch `updateTicketState`

5. Actualizar `store/index.ts`:
- Agregar `ticketsReducer`

### Beneficios

- Navegación instantánea entre Dashboard ↔ TicketDetail (sin re-fetch)
- Estado sincronizado: si verifico un commit en TicketDetail, el Dashboard lo refleja al volver
- El sidebar puede mostrar "2/3 completados" sin fetch adicional

### Archivos a crear/modificar

```
src/store/slices/ticketsSlice.ts    ← CREAR
src/hooks/useTickets.ts             ← CREAR
src/store/index.ts                  ← agregar ticketsReducer
src/pages/DashboardPage.tsx         ← refactorizar a useTickets()
src/pages/TicketDetailPage.tsx      ← leer del store
```

### Checklist

- [x] `ticketsSlice.ts` creado con estado y acciones
- [x] `useTickets.ts` hook creado
- [x] `useTicketDetail.ts` hook creado (carga ticket + reviews, parsea aspectos, verifica commit)
- [x] `store/index.ts` actualizado con ticketsReducer
- [x] `DashboardPage` usa el store via `useTickets()`
- [x] `TicketDetailPage` usa `useTicketDetail()` — no importa axiosClient
- [x] `ticketService.ts` actualizado con `getTicketById()`
- [x] Navegación Dashboard ↔ Detail no re-fetchea tickets del store
- [x] Arquitectura de capas: Page → Hook → Service → axiosClient
