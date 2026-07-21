# DevCoach AI — Reparto de Tareas y Guía Técnica por Perfil

> Aclaración importante: los nombres de los perfiles (Backend, Plataforma, Frontend, Infra) describen el **módulo del proyecto**, no significan que esa persona toque otras partes. Quien está en "Plataforma" solo hace backend, aunque su experiencia previa sea fullstack.

---

## Cómo leer este documento

Cada tarea tiene:
- **Qué es**, en palabras simples, sin asumir que ya conocés la herramienta.
- **Qué hace concretamente** dentro del flujo de DevCoach AI.
- **Conceptos nuevos** que probablemente aparezcan, explicados brevemente.
- **Cómo saber que funciona** — una forma rápida de probar esa pieza sola, sin depender de que el resto esté listo.

---

## 1. Perfil Backend (Génesis) — Módulo de Análisis Inteligente

Este perfil no escribe endpoints ni toca la base de datos. Escribe funciones de Python que reciben texto y devuelven texto/JSON. Es el módulo que "le habla a la IA".

### Wave 1 — Tarea 2.1: Interfaz y factory de `AIProvider`

**Qué es:** una "interfaz" en programación es un contrato: define qué funciones debe tener una clase, sin decir cómo las implementa. Acá el contrato es simple: cualquier proveedor de IA (Gemini o Groq) debe tener un método `generate(prompt) → texto`.

**Qué hace concretamente:** crea una clase abstracta `AIProvider` con un método `generate()`, y una función `get_provider()` que lee la variable de entorno `AI_PROVIDER` y decide si devolver el proveedor de Gemini o el de Groq.

**Por qué importa:** gracias a esto, el resto del código (los 4 agentes) nunca sabe si está hablando con Gemini o con Groq — solo llama a `provider.generate(prompt)`. Si mañana quieren cambiar de proveedor, cambian una variable de entorno, no el código.

**Conceptos nuevos:**
- **Clase abstracta (ABC):** una clase que no se usa directamente, solo sirve de "molde" para que otras clases la hereden y completen.
- **Variable de entorno:** un valor de configuración que vive fuera del código (por ejemplo en un archivo `.env`), para no hardcodear cosas como API keys.
- **Patrón Factory:** una función cuyo único trabajo es decidir qué objeto crear y devolverlo, según algún parámetro (acá, según el valor de `AI_PROVIDER`).

**Cómo probar que funciona:** cambiar el valor de `AI_PROVIDER` entre `"gemini"` y `"groq"` en el `.env`, y confirmar con un `print(type(get_provider()))` que devuelve la clase correcta.

---

### Wave 2 — Tareas 2.2 y 2.3: Providers de Gemini y Groq

**Qué es:** la implementación real de `generate()` para cada proveedor — la parte que efectivamente llama a la API externa por internet.

**Qué hace concretamente:** cada archivo usa el SDK oficial (`google-generativeai` o `groq`) para mandar el prompt y devolver la respuesta como texto plano, con un límite de espera de 30 segundos.

**Conceptos nuevos:**
- **SDK (Software Development Kit):** una librería que ya trae las funciones necesarias para hablar con un servicio (acá, Gemini o Groq), para no tener que armar las peticiones HTTP a mano.
- **Timeout:** un límite de tiempo de espera. Si el servicio no responde en ese lapso, se corta la espera y se lanza un error, en vez de quedar colgado indefinidamente.
- **API Key:** una credencial secreta que identifica al proyecto ante el servicio de IA. Se guarda como variable de entorno, nunca en el código.

**Cómo probar que funciona:** un script chico (`if __name__ == "__main__"`) que llame `provider.generate("Decí hola en una palabra")` y muestre el resultado por consola. Si devuelve texto, ya está andando.

---

### Wave 2 — Tareas 2.4 a 2.7: Los 4 agentes

Estas cuatro tareas son el corazón del producto. Cada una es una función que arma un prompt específico, se lo pasa al `provider.generate()`, y valida que la respuesta tenga el formato esperado.

**Estructura común de las cuatro:**
1. Recibir datos de entrada (código, ticket, respuestas del usuario, etc.).
2. Armar un prompt de texto que le da instrucciones claras a la IA, pidiéndole que responda **solo en JSON** (esto es clave: si el prompt no lo pide explícitamente, la IA puede devolver texto explicativo alrededor del JSON y romper el parseo).
3. Llamar a `provider.generate(prompt)`.
4. Parsear la respuesta como JSON y validarla contra un modelo de Pydantic (ver sección de modelos, tarea 5.1).
5. Si no cumple el formato, lanzar un error de validación (no intentar "arreglar" la respuesta a mano).

**Conceptos nuevos:**
- **Prompt engineering:** la práctica de redactar instrucciones para un LLM de forma que la respuesta sea consistente. Un buen prompt para este proyecto especifica: el rol que debe asumir la IA, el formato exacto de salida (JSON con tal estructura), y ejemplos si hace falta.
- **Parsear:** convertir un texto (la respuesta cruda de la IA) en una estructura de datos que el programa pueda usar (un diccionario, un objeto).
- **Validación de esquema:** confirmar que un JSON tiene exactamente los campos y tipos esperados antes de confiar en él (por ejemplo, que `prioridad` sea una de tres palabras válidas, no cualquier texto).

**Detalle por agente:**

| Agente | Entrada | Prompt le pide que... | Salida esperada |
|---|---|---|---|
| **2.4 Code_Reviewer** | Diccionario `{ruta_archivo: contenido}` | Actúe como revisor de código y liste fortalezas/debilidades | `{fortalezas: [...], debilidades: [...]}` |
| **2.5 Ticket_Generator** | La salida del Code_Reviewer | Convierta ese diagnóstico en exactamente 3 tickets accionables | Lista de 3 objetos ticket |
| **2.6 Tech_Lead** | Un ticket + el diff del commit | Genere 2-3 preguntas de seguimiento tipo entrevista, basadas en el cambio real | Lista de 2-3 preguntas (texto) |
| **2.7 Evaluator** | Ticket + diff + preguntas + respuestas del usuario | Evalúe si las respuestas demuestran comprensión, y decida aprobar o no | `{feedback: texto, aprobado: bool}` |

**Cómo probar que funciona (cada una por separado, sin backend ni frontend):** escribir un script con datos de ejemplo hardcodeados (un archivo de código real copiado y pegado) y correr la función directo desde la terminal, revisando el JSON que devuelve.

---

### Wave 3 — Tarea 2.8 (opcional): Tests de los parsers

**Qué es:** pruebas automáticas que confirman que el código de parseo/validación rechaza JSON mal formado y acepta el bien formado, sin tener que probarlo a mano cada vez.

**Qué hace concretamente:** usa `pytest` (el framework de testing más común en Python) para probar casos como: JSON válido, campos faltantes, tipos incorrectos, respuesta vacía.

**Conceptos nuevos:**
- **pytest:** herramienta que corre funciones que empiezan con `test_` y reporta cuáles pasan o fallan.
- **Caso borde (edge case):** una entrada inusual que pone a prueba los límites del código (por ejemplo, una lista de 2 tickets en vez de 3).

**Nota:** esta tarea tiene asterisco (`*`) porque es opcional — si el tiempo aprieta, se puede saltar sin romper el flujo principal.

---

## 2. Perfil Plataforma (Creo que yo - Camilo) (Backend — API, Supabase, GitHub)

Este perfil construye "los caminos" por donde viaja la información: recibe pedidos del frontend, llama a las funciones de IA cuando corresponde, y guarda/lee de la base de datos.

### Wave 0 — Tarea 1.1: Setup del backend FastAPI

**Qué es:** FastAPI es un framework de Python para construir APIs — programas que reciben peticiones HTTP (como las que hace un navegador) y devuelven respuestas, generalmente en JSON.

**Qué hace concretamente:**
- Crea la estructura de carpetas del backend.
- Configura el archivo `main.py`, que es el punto de entrada: acá se "arranca" el servidor.
- Configura **CORS** (ver abajo), para que el navegador permita que el frontend le hable al backend.
- Agrega validación de arranque: si falta alguna variable de entorno obligatoria (`AI_PROVIDER`, `GITHUB_TOKEN`, etc.), el servidor no arranca y avisa cuál falta.

**Conceptos nuevos:**
- **Framework:** una base de código ya armada que da estructura a un tipo de proyecto (acá, APIs web), para no tener que resolver desde cero cosas como el manejo de rutas HTTP.
- **CORS (Cross-Origin Resource Sharing):** una regla de seguridad de los navegadores que, por defecto, bloquea que una página web (el frontend, en `localhost:5173` o Vercel) le hable a un servidor en otro dominio (el backend, en Render). Hay que configurar explícitamente qué orígenes están permitidos.
- **Fail-fast:** la práctica de detener el programa apenas se detecta un problema de configuración, en vez de dejar que falle más tarde de forma confusa.

**Cómo probar que funciona:** correr `uvicorn app.main:app --reload` y entrar a `http://localhost:8000/docs` — FastAPI genera automáticamente una interfaz interactiva (Swagger) donde se ven todos los endpoints.

---

### Wave 0 — Tarea 1.3: Schema de Supabase

**Qué es:** Supabase es un servicio que da una base de datos PostgreSQL ya administrada, con una API REST generada automáticamente encima. No hay que instalar ni mantener un servidor de base de datos propio.

**Qué hace concretamente:** crea las 3 tablas (`projects`, `tickets`, `reviews`) usando SQL, con sus restricciones: longitud máxima de texto, valores permitidos (enums), y relaciones entre tablas.

**Conceptos nuevos:**
- **PostgreSQL:** un sistema de base de datos relacional (organiza los datos en tablas con filas y columnas, como Excel pero con reglas estrictas).
- **Migración:** un archivo que describe cambios a la base de datos (crear tablas, agregar columnas) de forma que se puedan aplicar de forma ordenada y repetible.
- **CHECK constraint:** una regla que la base de datos aplica sola, rechazando datos que no la cumplan (por ejemplo, que `prioridad` solo pueda ser "alta", "media" o "baja" — ni la aplicación ni un error humano pueden meter otro valor).
- **Foreign key / CASCADE:** una columna que "apunta" a otra tabla (por ejemplo, `tickets.project_id` apunta a `projects.id`). `ON DELETE CASCADE` significa que si se borra un proyecto, sus tickets se borran automáticamente con él.

**Cómo probar que funciona:** desde el panel web de Supabase (Table Editor), insertar una fila de prueba a mano en cada tabla y confirmar que las restricciones frenan datos inválidos (por ejemplo, intentar poner `prioridad = "urgente"` debería fallar).

---

### Wave 1 — Tarea 3.1: GitHub Service

**Qué es:** una clase que encapsula toda la comunicación con la API pública de GitHub, para que el resto del backend no tenga que saber los detalles de esas peticiones.

**Qué hace concretamente**, método por método:
- `validate_repo`: confirma que el repo existe y es público.
- `get_tree`: trae la estructura de carpetas/archivos (hasta 3 niveles).
- `get_file_content`: trae el contenido de un archivo puntual, decodificado.
- `get_default_branch`: averigua si la rama principal se llama `main`, `master` u otra cosa.
- `get_last_commit`: usa el resultado anterior para pedir el último commit de esa rama, con su diff.

**Conceptos nuevos:**
- **API REST:** una forma estándar de exponer funcionalidad por HTTP, donde cada "recurso" (un repo, un archivo, un commit) tiene una URL propia y se accede con verbos como GET, POST.
- **Base64:** GitHub devuelve el contenido de los archivos codificado en Base64 (una forma de representar datos binarios como texto). Hay que decodificarlo para obtener el código real.
- **Diff:** la representación de "qué cambió" entre dos versiones de un archivo — qué líneas se agregaron, cuáles se borraron.
- **Rate limiting:** un límite de cuántas peticiones se pueden hacer en un período de tiempo. GitHub devuelve cabeceras (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) que dicen cuántas peticiones quedan y cuándo se resetea el contador.
- **PAT (Personal Access Token):** una credencial que identifica al backend ante GitHub (no al usuario), usada para subir el límite de peticiones permitidas.

**Cómo probar que funciona:** un script suelto que llame a cada método contra un repo público real (por ejemplo, uno de prueba del propio equipo) y muestre el resultado por consola.

---

### Wave 1 — Tarea 4.1: Servicio de base de datos

**Qué es:** la capa que traduce entre el código Python y las tablas de Supabase — funciones como "crear proyecto", "guardar tickets", "actualizar estado de un ticket".

**Qué hace concretamente:** usa el cliente oficial de Supabase para Python para hacer INSERT, SELECT y UPDATE sobre las 3 tablas, envolviendo cada operación en manejo de errores que nunca expone detalles internos de la base de datos al usuario final.

**Conceptos nuevos:**
- **CRUD:** el acrónimo de las 4 operaciones básicas sobre datos: Create, Read, Update, Delete.
- **Cliente de base de datos:** una librería que traduce llamadas de Python (`.insert()`, `.select()`) en las peticiones que Supabase entiende, sin escribir SQL a mano en cada lugar.
- **Manejo de excepciones (try/except):** una forma de "atajar" errores antes de que rompan el programa, y decidir qué hacer (acá: loguear el detalle real para debug, pero devolver un mensaje genérico al usuario).

**Cómo probar que funciona:** llamar `create_project(...)` con datos de prueba y verificar en el Table Editor de Supabase que la fila apareció correctamente.

---

### Wave 1 — Tarea 5.1: Modelos Pydantic

**Qué es:** Pydantic es una librería que define la "forma" exacta que debe tener un dato — qué campos tiene, de qué tipo, con qué límites — y valida automáticamente cualquier dato que entre o salga del sistema.

**Qué hace concretamente:** define las clases `ProjectCreate`, `TicketResponse`, `EvaluationResponse`, etc., cada una con sus restricciones (largo máximo de texto, valores permitidos, rangos numéricos).

**⚠️ Punto de coordinación:** dos de estos modelos (`CodeReviewResult` y `TicketData`) los usa también el Módulo de Análisis Inteligente. Conviene definirlos juntos, en una llamada corta de 10-15 minutos el Día 0, para que ambos módulos trabajen sobre la misma definición desde el principio.

**Conceptos nuevos:**
- **Validación de datos:** confirmar que un dato cumple ciertas reglas antes de usarlo (por ejemplo, que un email tenga arroba, o que un número esté en cierto rango).
- **Enum (enumeración):** un tipo de dato que solo puede tomar un valor de una lista fija predefinida (acá: `prioridad` solo puede ser alta/media/baja, nunca otro texto).

**Cómo probar que funciona:** intentar crear una instancia con datos inválidos (por ejemplo, `Prioridad="urgente"`) y confirmar que Pydantic lanza un error automáticamente, sin código adicional.

---

### Wave 3 — Tareas 7.1, 7.2, 7.3: Los 6 endpoints de la API

Acá es donde todo se conecta: cada endpoint recibe una petición del frontend, orquesta las llamadas necesarias (a GitHub, a la IA, a Supabase) y devuelve una respuesta.

**Conceptos nuevos generales:**
- **Endpoint:** una URL específica del backend que responde a un tipo de petición (por ejemplo, `POST /api/projects`). Cada endpoint hace una cosa concreta.
- **Router:** en FastAPI, una forma de agrupar endpoints relacionados en un archivo separado (por ejemplo, todos los de `tickets` en `tickets.py`), en vez de tener todo en `main.py`.
- **Orquestar:** llamar a varias funciones/servicios en el orden correcto y combinar sus resultados. Es lo que distingue a este módulo del Módulo de Análisis Inteligente: acá no se decide *qué* preguntarle a la IA, solo *cuándo* llamarla y qué hacer con la respuesta.

**Detalle por endpoint:**

| Endpoint | Qué orquesta |
|---|---|
| `POST /api/projects/validate-repo` | Valida formato de URL → llama `github_service.validate_repo()` |
| `POST /api/projects` | Crea proyecto en DB → trae archivos de GitHub → llama `code_reviewer` → llama `ticket_generator` → guarda tickets en DB |
| `GET /api/projects/{id}/tickets` | Lee tickets de DB y los devuelve |
| `POST /api/tickets/{id}/verify` | Obtiene rama por defecto → obtiene último commit → compara archivos cambiados vs. archivos del proyecto → actualiza estado del ticket |
| `POST /api/interviews/start` | Valida que el ticket esté en `in_review` → llama `tech_lead` → devuelve preguntas |
| `POST /api/interviews/evaluate` → llama `evaluator` → guarda la review en DB → actualiza estado del ticket (`done` o vuelve a `in_review`) |

**Cómo probar que funciona:** usar la interfaz Swagger (`/docs`) que genera FastAPI automáticamente, para mandar peticiones de prueba sin necesitar el frontend todavía.

---

## 3. Perfil Frontend (Carolina) (React)

Construye todo lo que el usuario ve y toca. Consume los endpoints que arma el Módulo de Plataforma.

### Wave 0 — Tarea 1.2: Setup de React + Tailwind

**Qué es:** React es una librería para construir interfaces dividiéndolas en "componentes" reutilizables. Tailwind es una forma de aplicar estilos visuales escribiendo clases directamente en el HTML, sin escribir CSS separado.

**Conceptos nuevos:**
- **Componente:** un bloque de UI independiente y reutilizable (un botón, una tarjeta, un formulario) que se combina con otros para armar la pantalla completa.
- **Vite:** la herramienta que arma y sirve el proyecto de React durante el desarrollo (más rápida que alternativas más viejas como Create React App).
- **Utility classes (Tailwind):** en vez de escribir `.mi-boton { background: blue; padding: 8px }` en un archivo CSS aparte, se escribe directamente `<button className="bg-blue-500 p-2">` en el componente.

---

### Wave 4 — Tarea 9.1: RepoInput

**Qué hace concretamente:** un campo de texto controlado por React (su valor vive en el estado del componente), que valida el formato de la URL en el propio navegador antes de mandarla al backend, y muestra mensajes de error sin borrar lo que el usuario escribió.

**Conceptos nuevos:**
- **Estado (state):** un valor que React "recuerda" y que, al cambiar, hace que el componente se vuelva a dibujar automáticamente. Se maneja con el hook `useState`.
- **Hook:** una función especial de React (siempre empiezan con `use`) que permite usar funcionalidades como estado o efectos secundarios dentro de un componente.
- **Validación client-side:** revisar el formato de un dato en el navegador, antes de gastar una petición al servidor, para dar feedback más rápido al usuario.

---

### Wave 4 — Tarea 9.2: FileSelector

**Qué hace concretamente:** muestra la estructura de carpetas como un árbol desplegable, permite marcar checkboxes (carpeta completa o archivos sueltos), cuenta cuántos están seleccionados, y deshabilita el botón de continuar si son 0 o más de 50.

**Conceptos nuevos:**
- **Renderizado recursivo:** dibujar un componente que se llama a sí mismo para representar estructuras anidadas (una carpeta puede tener subcarpetas, que tienen más subcarpetas).
- **Estado derivado:** un valor calculado a partir de otro estado (acá, el contador de seleccionados se calcula a partir de la lista de archivos marcados, no se guarda por separado).

---

### Wave 5 — Tarea 9.3: Dashboard / Kanban

**Qué hace concretamente:** pide la lista de tickets al backend y los distribuye en 3 columnas según su campo `estado`. Vuelve a pedir los datos después de cada acción que puede cambiar un estado (verificar, terminar entrevista) — sin usar un intervalo automático (polling), como quedó definido en el ajuste del spec.

**Conceptos nuevos:**
- **Fetch de datos:** la acción de pedirle datos a una API desde el navegador, típicamente con la función `fetch()` o una librería como `axios`.
- **Effect (useEffect):** un hook que ejecuta código cuando el componente aparece en pantalla o cuando cierto valor cambia — se usa para disparar el pedido de datos al backend.

---

### Wave 5 — Tarea 9.4: InterviewModeSelector *(sugerida para Infra)*

**Qué hace concretamente:** dos botones ("Chat" / "Llamada"). Antes de mostrarlos, revisa si el navegador soporta la Web Speech API (`window.SpeechRecognition` o su versión con prefijo); si no, deshabilita "Llamada" con una explicación.

**Conceptos nuevos:**
- **Feature detection:** revisar si el navegador soporta una funcionalidad antes de usarla (`if ('SpeechRecognition' in window)`), en vez de asumir que sí y que falle después.
- Es, en esencia, un componente con dos botones y un `if`. Buen punto de entrada a React.

---

### Wave 6 — Tarea 9.5: ChatInterface

**Qué hace concretamente:** muestra las preguntas del Tech Lead como mensajes tipo burbuja, con un campo de texto por pregunta (máx. 2000 caracteres), y un único botón para enviar todas las respuestas juntas.

---

### Wave 6 — Tarea 9.6: VoiceInterface

**Qué hace concretamente:** usa `SpeechRecognition` para transcribir lo que dice el usuario a texto en tiempo real, y `SpeechSynthesis` para "leer en voz alta" las preguntas del Tech Lead. Todo el audio se procesa en el navegador — nunca se manda audio al backend, solo el texto ya transcripto.

**Conceptos nuevos:**
- **Web Speech API:** una API nativa del navegador (no requiere librerías externas) con dos partes: `SpeechRecognition` (voz → texto) y `SpeechSynthesis` (texto → voz).
- **Evento asíncrono:** `SpeechRecognition` no devuelve el texto de inmediato, sino que dispara eventos (`onresult`, `onerror`) a medida que va reconociendo lo que se dice.
- **Permiso de micrófono:** el navegador pide autorización al usuario antes de poder escuchar el micrófono; el código debe manejar el caso en que la persona lo deniegue.

---

### Wave 6 — Tarea 9.7: FeedbackDisplay *(sugerida para Infra)*

**Qué hace concretamente:** recibe el feedback del Evaluator y lo muestra con un color/ícono distinto según si `aprobado` es `true` o `false`. Es básicamente un `if` con dos estilos.

---

### Wave 7 — Tarea 11.1: Routing

**Qué hace concretamente:** configura React Router para que la URL del navegador cambie según la pantalla (`/`, `/select`, `/dashboard`, `/interview/:ticketId`), y pasa la información necesaria (id de proyecto, id de ticket) de una pantalla a la siguiente.

**Conceptos nuevos:**
- **SPA (Single Page Application):** una aplicación que carga una sola página HTML y cambia lo que se ve mediante JavaScript, sin recargar el navegador cada vez.
- **React Router:** la librería estándar para manejar distintas "rutas" (URLs) dentro de una SPA.

---

## 4. Perfil Infraestructura + Documentación (Abner) (+ apoyo en Frontend)

### Despliegue y configuración (Día 0-1)

**Qué hace concretamente:**
- Sube el frontend a **Vercel**: se conecta el repositorio de GitHub, Vercel detecta que es un proyecto Vite/React y lo despliega automáticamente en cada push.
- Sube el backend a **Render**: se configura como "Web Service", apuntando al repo y especificando el comando de arranque (`uvicorn app.main:app`).
- Configura las **variables de entorno** en ambas plataformas (paneles web, sin tocar código): las API keys de Gemini/Groq, la URL y key de Supabase, el token de GitHub.

**Conceptos nuevos:**
- **Deploy / Despliegue:** el proceso de poner una aplicación a correr en un servidor accesible desde internet, en vez de solo en la computadora de quien la programó.
- **Variables de entorno en producción:** cada plataforma de hosting (Vercel, Render) tiene un panel donde se cargan estos valores sin que queden expuestos en el código del repositorio.

**Cómo probar que funciona:** entrar a la URL pública que da Vercel/Render y confirmar que carga, aunque todavía no tenga todas las funcionalidades conectadas.

### Apoyo en Frontend: tareas 9.4 y 9.7

Ver el detalle en la sección de Frontend más arriba — son las dos piezas más chicas y aisladas, buen punto de entrada.

### QA manual (Día 6)

**Qué hace concretamente:** recorre el flujo completo como si fuera un usuario nuevo, usando como checklist las 18 "Correctness Properties" que quedaron documentadas en el `design.md` (por ejemplo: ¿el sistema realmente rechaza una URL sin `https://github.com/`? ¿un archivo de más de 1MB da el mensaje correcto?).

**Conceptos nuevos:**
- **QA (Quality Assurance) manual:** probar la aplicación a mano, siguiendo una lista de casos, en vez de tests automatizados.
- **Repo de demo controlado:** un repositorio de prueba preparado de antemano, donde el equipo ya sabe qué "errores" tiene el código, para que la IA los detecte de forma predecible durante la presentación en vivo.

### Documentación y presentación (todo el trayecto)

- README del proyecto.
- Mantener actualizados los specs de Kiro a medida que el equipo hace ajustes.
- Landing page: el contenido y textos (la integración técnica final la conecta el Frontend).
- Guion del pitch y material visual para el Demo Day.

---

## Resumen visual del reparto por waves

| Wave | Análisis IA | Plataforma | Frontend | Infra |
|---|---|---|---|---|
| 0 | — | 1.1, 1.3 | 1.2 | Setup de despliegues |
| 1 | 2.1 | 3.1, 4.1, 5.1 | — | — |
| 2 | 2.2–2.7 | 3.2* | — | — |
| 3 | 2.8* | 7.1, 7.2, 7.3 | — | — |
| 4 | — | 7.4*, 7.5* | 9.1, 9.2 | — |
| 5 | — | — | 9.3 | **9.4** |
| 6 | — | — | 9.5, 9.6 | **9.7** |
| 7 | — | — | 11.1 | Apoyo en 11.2 |
| Día 6 | — | — | — | QA manual + repo de demo |

*(las tareas con `*` son opcionales, se hacen si el tiempo lo permite)*
