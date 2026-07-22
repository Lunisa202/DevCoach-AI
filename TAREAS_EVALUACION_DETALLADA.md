# DevCoach AI — Tarea D.1: Evaluación Detallada con 5 Dimensiones

> Esta tarea enriquece el sistema de evaluación para que el Evaluator devuelva calificación
> numérica, aspectos evaluados por dimensión, y conceptos a mejorar — en vez de solo feedback + aprobado.
> Impacta backend (prompt + schema + BD) y frontend (UI de resultados en tarjetas del kanban).

---

## Dimensiones de evaluación

El Evaluator califica al usuario en 5 dimensiones (0-20 puntos cada una, suman 100):

| # | Dimensión | Qué mide |
|---|-----------|----------|
| 1 | **Comprensión del problema** | ¿Entiende qué estaba mal y por qué importa? |
| 2 | **Justificación técnica** | ¿Puede explicar por qué eligió esa solución? |
| 3 | **Conocimiento de alternativas** | ¿Sabe qué más podría haber hecho? |
| 4 | **Conciencia de limitaciones** | ¿Reconoce qué no cubre su solución? |
| 5 | **Claridad de comunicación** | ¿Se expresa con precisión técnica? |

**Regla de aprobación:** `calificacion >= 70` → aprobado

---

## Comportamiento al no aprobar

- El ticket **se queda en "In Review"** (no vuelve a To Do)
- El usuario puede intentar de nuevo inmediatamente (no necesita nuevo commit)
- Se muestra un badge "Intento X" en la tarjeta del kanban (conteo de reviews del ticket)
- El historial de todos los intentos se conserva y es visible al expandir la tarjeta

---

## Migración SQL

Archivo: `backend/supabase/003_evaluacion_detallada.sql`

```sql
-- Agregar timestamp a reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Agregar campos de evaluación detallada
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS calificacion INTEGER CHECK (calificacion >= 0 AND calificacion <= 100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS aspectos_evaluados JSONB;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS conceptos_a_mejorar TEXT[];
```

---

## Cambios en Backend

### `app/ai/schemas.py` — nuevo schema

```python
class DimensionScore(BaseModel):
    dimension: str
    puntaje: int = Field(ge=0, le=20)
    comentario: str

class EvaluationResult(BaseModel):
    feedback: str = Field(max_length=3000)
    aprobado: bool
    calificacion: int = Field(ge=0, le=100)
    aspectos_evaluados: list[DimensionScore]
    conceptos_a_mejorar: list[str]
```

### `app/ai/agents/evaluator.py` — prompt actualizado

El prompt pedirá JSON con esta estructura:
```json
{
  "feedback": "Retroalimentación general constructiva...",
  "aprobado": true,
  "calificacion": 78,
  "aspectos_evaluados": [
    { "dimension": "Comprensión del problema", "puntaje": 18, "comentario": "Entiende claramente..." },
    { "dimension": "Justificación técnica", "puntaje": 15, "comentario": "Buena justificación..." },
    { "dimension": "Conocimiento de alternativas", "puntaje": 14, "comentario": "Mencionó..." },
    { "dimension": "Conciencia de limitaciones", "puntaje": 16, "comentario": "Reconoce..." },
    { "dimension": "Claridad de comunicación", "puntaje": 15, "comentario": "Se expresa..." }
  ],
  "conceptos_a_mejorar": ["Testing unitario", "Principio de responsabilidad única"]
}
```

### `app/services/db_service.py` — actualizar `create_review()`

Agregar parámetros: `calificacion`, `aspectos_evaluados` (JSON), `conceptos_a_mejorar` (list)

### `app/api/interviews.py` — actualizar respuesta de `evaluate`

La respuesta al frontend ahora incluye todos los campos nuevos.

---

## Cambios en Frontend

### `src/types/interview.ts` — tipos actualizados

```ts
export interface DimensionScore {
  dimension: string
  puntaje: number   // 0-20
  comentario: string
}

export interface EvaluateResponse {
  feedback: string
  aprobado: boolean
  calificacion: number  // 0-100
  aspectos_evaluados: DimensionScore[]
  conceptos_a_mejorar: string[]
}

export interface ReviewDetailed {
  id: string
  ticket_id: string
  preguntas_generadas: string[]
  respuesta_usuario: string
  feedback_evaluator: string
  aprobado: boolean
  calificacion: number
  aspectos_evaluados: DimensionScore[]
  conceptos_a_mejorar: string[]
  created_at: string
}
```

### `src/pages/ChatInterviewPage.tsx` — resultado detallado

Después de evaluar, mostrar:
- Calificación general (número grande + barra de progreso coloreada)
- 5 dimensiones con barrita de progreso (0-20) y comentario
- Lista de conceptos a mejorar como tags
- Fecha y hora del intento

### `src/pages/DashboardPage.tsx` — tarjeta expandida con historial

Al expandir una tarjeta en "In Review" o "Done":
- Badge "Intento X" (conteo de reviews)
- Último resultado: calificación + aprobado/no + fecha
- Botón "Ver detalle" que muestra la evaluación completa
- Si hay múltiples intentos: lista colapsable con los anteriores

---

## Orden de implementación

1. Migración SQL (003)
2. Actualizar schema + prompt del Evaluator
3. Actualizar db_service + endpoint
4. Actualizar tipos del frontend
5. Actualizar UI de resultado en ChatInterviewPage
6. Actualizar tarjeta del kanban con historial

---

## Checklist

### Backend
- [x] Migración `003_evaluacion_detallada.sql` creada
- [x] `EvaluationResult` actualizado con calificacion + aspectos + conceptos
- [x] Prompt del Evaluator pide las 5 dimensiones con puntaje
- [x] `create_review()` guarda los nuevos campos
- [x] Endpoint `evaluate` devuelve estructura completa
- [ ] `GET /api/tickets/{id}/reviews` devuelve los campos nuevos ← ya devuelve `*`, debería funcionar
- [ ] Migración aplicada en Supabase ← pendiente: correr `003` en el panel

### Frontend
- [x] Tipos actualizados en `types/interview.ts`
- [x] `ChatInterviewPage` muestra resultado detallado (calificación + dimensiones + conceptos)
- [x] Tarjeta del kanban muestra badge "Intento X"
- [x] Tarjeta expandida muestra historial de reviews (fecha, calificación, conceptos)
- [x] `ticketService.ts` con `getTicketReviews()`
