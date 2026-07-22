# DevCoach AI — Tareas: Entrevista (Chat + Video Llamada)

> Se numeran como **C.1** (chat), **C.2** (video llamada) y **C.3** (selector de modalidad).
> El backend ya tiene los endpoints listos (`/api/interviews/start` y `/api/interviews/evaluate`).
> Solo es trabajo de frontend.

---

## Flujo del usuario

```
Dashboard → click "Iniciar entrevista" → Modal selector de modalidad
                                              │
                                   ┌──────────┴──────────┐
                                   │                     │
                              💬 Chat              🎥 Video llamada
                                   │               (deshabilitado si
                                   │                browser no soporta
                                   │                SpeechRecognition)
                                   ↓                     ↓
                            /interview/:id?mode=chat   /interview/:id?mode=voice
```

---

## C.3 — Selector de modalidad (modal)

**Dificultad: Baja** | ~30 min

Al hacer click en "Iniciar entrevista" en el Dashboard, aparece un modal centrado (usando portal como ConfirmModal) que pregunta:

```
┌─────────────────────────────────────┐
│  ¿Cómo querés hacer la entrevista?  │
│                                     │
│  [ 💬 Chat ]    [ 🎤 Llamada ]     │
│                                     │
│  (Llamada deshabilitada si el       │
│   navegador no lo soporta)          │
└─────────────────────────────────────┘
```

### Feature detection

```ts
const isSpeechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
```

- Si `isSpeechSupported === true` → ambos botones habilitados
- Si `false` → botón "Llamada" deshabilitado con tooltip: "Tu navegador no soporta esta función. Usá Chrome o Edge."

### Archivos

```
src/components/InterviewModeModal.tsx
```

---

## C.1 — Chat Interview

**Dificultad: Baja** | ~2-3 horas

### Pantalla

Ruta: `/interview/:ticketId?mode=chat`

Layout tipo chat (como WhatsApp/iMessage):
- Lado izquierdo: burbujas del Tech Lead (las preguntas)
- Lado derecho: campos de texto del usuario (una por pregunta, máx 2000 chars)
- Botón "Enviar respuestas" al final
- Spinner mientras se evalúan las respuestas
- Resultado: card con feedback + badge aprobado/rechazado
- Botón "Volver al dashboard" después del resultado

### Flujo

1. Al montar → `POST /api/interviews/start` con `ticket_id` + `mode: "chat"`
2. Spinner mientras carga
3. Muestra preguntas una a una como burbujas
4. Usuario escribe respuestas
5. Click "Enviar" → `POST /api/interviews/evaluate`
6. Muestra resultado (feedback + aprobado)
7. Si aprobado → toast success + el ticket pasa a Done (refrescar al volver al dashboard)
8. Si no aprobado → toast info "Podés intentar de nuevo" + volver al dashboard

### Archivos

```
src/pages/InterviewPage.tsx         ← wrapper que lee mode del query param
src/pages/ChatInterviewPage.tsx     ← la UI del chat
src/services/interviewService.ts    ← startInterview(), evaluateAnswers()
src/types/interview.ts              ← InterviewStartResponse, EvaluateResponse
```

---

## C.2 — Voice Interview (Video Llamada)

**Dificultad: Alta** | ~6-8 horas

### Pantalla

Ruta: `/interview/:ticketId?mode=voice`

Layout tipo video llamada:
- Panel principal: avatar del Tech Lead (SVG animado que "pulsa" cuando habla)
- Panel inferior o lateral: preview de la cámara del usuario (decorativo, solo visual)
- Estado visible: "Tech Lead está hablando...", "Tu turno — respondé", "Procesando..."
- Botón "Terminé de responder" para pasar a la siguiente pregunta
- Botón "Finalizar entrevista" aparece después de la última pregunta

### Flujo

1. Al montar → pedir permiso de micrófono (y cámara si se quiere el preview)
2. Si deniega → toast error + redirigir a modo chat como fallback
3. `POST /api/interviews/start` → recibir preguntas
4. Avatar dice saludo: "Bienvenido a tu defensa de PR. Vamos a hablar sobre tu código." (TTS)
5. Avatar lee pregunta 1 (TTS) → estado "Tu turno"
6. Se activa `SpeechRecognition` → transcribe en tiempo real (se muestra el texto parcial)
7. Usuario da click "Terminé" → se guarda la transcripción de la respuesta 1
8. Avatar lee pregunta 2... repite
9. Después de pregunta 3 → "Terminé" → envía las 3 transcripciones al backend
10. `POST /api/interviews/evaluate` → avatar lee el feedback en voz alta
11. Muestra badge aprobado/rechazado

### Tecnologías (todas nativas, sin APIs externas)

| Función | API |
|---------|-----|
| Avatar habla | `window.speechSynthesis` |
| Usuario habla → texto | `window.SpeechRecognition` / `webkitSpeechRecognition` |
| Preview cámara (decorativo) | `navigator.mediaDevices.getUserMedia({ video: true })` |
| Animación del avatar | CSS transitions / SVG animado |

### Manejo del botón "Terminé de responder"

- Mientras el usuario habla → el texto se muestra en tiempo real debajo del avatar
- El botón "Terminé" siempre está visible
- Al dar click → `SpeechRecognition.stop()` → se guarda el texto final
- Si el usuario no habló nada → mostrar toast "Respondé antes de continuar"
- Timeout de seguridad: si pasan 60s sin click → toast warning "¿Seguís ahí?"

### Pantalla de revisión (después de las 3 preguntas)

Después de que el usuario responde las 3 preguntas, se muestra una pantalla de revisión antes de enviar:

```
┌─────────────────────────────────────────────────┐
│  Revisá tus respuestas antes de enviar          │
│                                                 │
│  Pregunta 1: "¿Por qué elegiste...?"           │
│  ┌─────────────────────────────────────┐       │
│  │ [transcripción editable en textarea]│ [🔄]  │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Pregunta 2: "¿Qué alternativa...?"            │
│  ┌─────────────────────────────────────┐       │
│  │ [transcripción editable en textarea]│ [🔄]  │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Pregunta 3: "¿Cómo verificarías...?"          │
│  ┌─────────────────────────────────────┐       │
│  │ [transcripción editable en textarea]│ [🔄]  │
│  └─────────────────────────────────────┘       │
│                                                 │
│         [ Enviar respuestas ]                   │
└─────────────────────────────────────────────────┘
```

- Cada respuesta se muestra en un `<textarea>` editable — el usuario puede corregir errores de transcripción directamente
- Botón 🔄 "Volver a grabar" al lado de cada respuesta → vuelve a activar el micrófono solo para esa pregunta, reemplaza la transcripción
- Botón "Enviar respuestas" al final → `POST /api/interviews/evaluate`
- Esta pantalla también se usa como fallback: si la transcripción fue mala, el usuario puede escribir directamente

### Flujo completo revisado (modo voz)

```
1. Avatar saluda (TTS)
2. Avatar lee pregunta 1 → usuario habla → click "Terminé"
3. Avatar lee pregunta 2 → usuario habla → click "Terminé"
4. Avatar lee pregunta 3 → usuario habla → click "Terminé"
5. → PANTALLA DE REVISIÓN (textareas editables + botón re-grabar)
6. Usuario revisa/edita/re-graba → click "Enviar respuestas"
7. POST /api/interviews/evaluate
8. Avatar lee el feedback → muestra resultado
```

### Fallback

Si en cualquier momento `SpeechRecognition` falla (error de red, denied, etc.):
- Toast: "Hubo un problema con el micrófono. Continuando en modo chat."
- Redirigir a `/interview/:ticketId?mode=chat`

### Archivos

```
src/pages/VoiceInterviewPage.tsx    ← la UI de la "llamada"
src/components/AvatarSpeaker.tsx    ← avatar visual + indicador de estado
src/components/VoiceRecorder.tsx    ← micrófono + transcripción en tiempo real
src/hooks/useSpeechSynthesis.ts     ← wrapper de TTS con estado (speaking/idle)
src/hooks/useSpeechRecognition.ts   ← wrapper de STT con transcript + error handling
```

---

## Orden de implementación

1. **C.1 (chat)** — primero, es el fallback y garantiza la demo
2. **C.3 (modal selector)** — segundo, conecta con ambos modos
3. **C.2 (voz)** — tercero, es el wow factor

---

## Checklist

### C.1 — Chat
- [x] `interviewService.ts` con `startInterview()` y `evaluateAnswers()`
- [x] `ChatInterviewPage.tsx` con burbujas + campos de texto
- [x] Spinner mientras carga preguntas y durante evaluación
- [x] Resultado detallado con calificación + 5 dimensiones + conceptos
- [x] Toast de éxito/error
- [x] Botón "Intentar de nuevo" si no aprueba

### C.3 — Modal selector
- [x] `InterviewModeModal.tsx` con feature detection
- [x] Botón "Llamada" deshabilitado si no soporta SpeechRecognition
- [x] Tooltip explicativo en botón deshabilitado
- [x] Navega a la ruta correcta según elección (`?mode=chat` o `?mode=voice`)

### C.2 — Voice
- [x] `useSpeechSynthesis.ts` hook (speak, stop, isSpeaking)
- [x] `useSpeechRecognition.ts` hook (start, stop, transcript, error, resetTranscript)
- [x] `AvatarSpeaker.tsx` con animación de "hablando" + estados (speaking/listening/processing)
- [x] `VoiceInterviewPage.tsx` con flujo completo
- [x] Greeting del avatar antes de las preguntas
- [x] Permiso de micrófono con fallback a chat si falla
- [x] Botón "Terminé de responder" siempre visible durante fase listening
- [x] Botón "🔁 Repetir pregunta" para que el avatar lea de nuevo
- [x] Botón "🎤 Reiniciar micrófono" si pierde el foco
- [x] Pantalla de revisión con textareas editables + "Volver a grabar" con ícono micrófono
- [x] Indicador visual de grabación (ícono micrófono rojo + "Grabando..." + transcripción parcial)
- [x] Avatar lee feedback del evaluador al final
- [x] Fallback automático a chat si STT falla
