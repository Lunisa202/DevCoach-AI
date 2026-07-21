# Requirements Document

## Introduction

DevCoach AI es una plataforma que convierte una carpeta del repositorio GitHub de un usuario en un plan de mejora de 3 tickets. La IA analiza el código, genera tickets de mejora, el usuario resuelve uno con un commit real y una entrevista simulada por chat de texto valida que el usuario comprendió el cambio realizado. El sistema está compuesto por 4 agentes de IA (prompts especializados) y opera exclusivamente sobre repositorios públicos sin autenticación de usuario.

## Glossary

- **Sistema**: La aplicación DevCoach AI compuesta por frontend (React), backend (FastAPI) y base de datos (Supabase).
- **Code_Reviewer**: Agente de IA que analiza archivos de código y produce un JSON con fortalezas y debilidades detectadas.
- **Ticket_Generator**: Agente de IA que recibe la salida del Code_Reviewer y genera 3 tickets de mejora.
- **Tech_Lead**: Agente de IA que genera preguntas de seguimiento tipo entrevista técnica basándose en un ticket y el código modificado.
- **Evaluator**: Agente de IA que analiza las respuestas del usuario a las preguntas del Tech_Lead y emite feedback con aprobación o rechazo.
- **Dashboard**: Interfaz visual tipo kanban con tres columnas (to_do, in_review, done) que muestra el estado de los tickets.
- **Proyecto**: Registro que asocia una URL de repositorio público con una selección de carpeta/archivos y su fecha de análisis.
- **Ticket**: Unidad de mejora generada por la IA que contiene título, descripción, prioridad, dificultad y tiempo estimado.
- **Review**: Registro de una sesión de entrevista que contiene preguntas generadas, respuesta del usuario, feedback del Evaluator y estado de aprobación.
- **Usuario**: Persona que interactúa con el Sistema para mejorar su código mediante el flujo de análisis, resolución y entrevista.
- **GitHub_API**: API REST pública de GitHub utilizada para leer contenido de repositorios públicos y obtener información de commits.

## Requirements

### Requirement 1: Ingreso de URL del repositorio

**User Story:** As a usuario, I want ingresar la URL de un repositorio público de GitHub, so that el Sistema pueda acceder a su contenido y analizarlo.

#### Acceptance Criteria

1. THE Sistema SHALL presentar un campo de texto con una longitud máxima de 2048 caracteres para que el Usuario ingrese una URL de repositorio GitHub.
2. IF el Usuario envía el campo de URL vacío o compuesto solo por espacios en blanco, THEN THE Sistema SHALL mostrar un mensaje de error indicando que el campo es obligatorio, y SHALL mantener el foco en el campo de texto.
3. WHEN el Usuario envía una URL, THE Sistema SHALL validar que el formato corresponde a un repositorio GitHub público con la estructura `https://github.com/{propietario}/{repositorio}` independientemente de si la URL excede la longitud máxima del campo, antes de realizar la consulta a la GitHub_API.
4. IF la URL enviada no cumple con el formato esperado de repositorio GitHub, THEN THE Sistema SHALL mostrar un mensaje de error indicando que el formato de URL es inválido, y SHALL preservar el texto ingresado en el campo para que el Usuario pueda corregirlo.
5. WHEN la URL cumple el formato esperado, THE Sistema SHALL consultar la GitHub_API para verificar que el repositorio existe y es público, con un tiempo límite de respuesta de 10 segundos.
6. IF la GitHub_API no responde dentro de 10 segundos o no está disponible, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo conectar con GitHub, y SHALL preservar el texto ingresado en el campo.
7. IF la GitHub_API responde que el repositorio no existe o no es accesible públicamente, THEN THE Sistema SHALL mostrar un mensaje de error indicando que el repositorio no fue encontrado o no es público, y SHALL preservar el texto ingresado en el campo.
8. WHEN la GitHub_API confirma que el repositorio existe y es público, THE Sistema SHALL navegar a la pantalla de selección de carpeta/archivos.

### Requirement 2: Selección de carpeta o archivos

**User Story:** As a usuario, I want seleccionar una carpeta específica o un conjunto de archivos del repositorio, so that la IA analice solo el código relevante sin exceder los límites de contexto del LLM.

#### Acceptance Criteria

1. WHEN el Usuario accede a la pantalla de selección, THE Sistema SHALL mostrar la estructura de directorios y archivos del repositorio hasta un máximo de 3 niveles de profundidad, obtenida mediante la GitHub API pública.
2. THE Sistema SHALL permitir al Usuario seleccionar una carpeta completa (incluyendo todos los archivos contenidos en ella y sus subcarpetas) o archivos individuales del repositorio, hasta un máximo combinado de 50 archivos.
3. WHEN el Usuario confirma la selección, THE Sistema SHALL crear un registro de Proyecto en la base de datos con la URL del repositorio, las rutas de los archivos seleccionados y la fecha de análisis.
4. IF el Usuario no selecciona ningún archivo o carpeta, THEN THE Sistema SHALL deshabilitar el botón de confirmación y SHALL mostrar un mensaje visible indicando que se requiere al menos una selección; ambas acciones son obligatorias en conjunto.
5. IF la selección del Usuario excede el límite máximo de 50 archivos, THEN THE Sistema SHALL deshabilitar el botón de confirmación y mostrar un mensaje indicando la cantidad de archivos seleccionados y el límite permitido.
6. IF la consulta a la GitHub API falla o el repositorio no es accesible, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo obtener la estructura del repositorio y permitir al Usuario reintentar la operación.

### Requirement 3: Análisis de código por IA

**User Story:** As a usuario, I want que la IA analice los archivos seleccionados, so that obtener un diagnóstico de fortalezas y debilidades de mi código.

#### Acceptance Criteria

1. WHEN el Usuario confirma la selección de archivos, THE Sistema SHALL mostrar un indicador de progreso y obtener el contenido de los archivos seleccionados mediante la GitHub_API.
2. IF la GitHub_API retorna un error al obtener el contenido de los archivos seleccionados, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudo acceder al contenido del repositorio y SHALL permitir al Usuario reintentar; ambas acciones son obligatorias en conjunto.
3. WHEN el contenido de los archivos es obtenido, THE Code_Reviewer SHALL analizar el código y producir un JSON que contenga una lista de fortalezas y una lista de debilidades detectadas, cada una con una descripción textual.
4. WHEN el Code_Reviewer produce su salida, THE Ticket_Generator SHALL recibir ese JSON y generar exactamente 3 tickets de mejora.
5. THE Ticket_Generator SHALL producir para cada ticket un JSON con los campos: título (máximo 120 caracteres), descripción, prioridad (valores permitidos: "alta", "media", "baja"), dificultad (valores permitidos: "fácil", "media", "difícil") y tiempo estimado en minutos (rango de 15 a 480).
6. WHEN los 3 tickets son generados, THE Sistema SHALL persistir los tickets en la base de datos con estado inicial "to_do" asociados al Proyecto correspondiente.
7. IF el Code_Reviewer o el Ticket_Generator no producen una respuesta válida en un plazo máximo de 60 segundos, THEN THE Sistema SHALL cancelar la operación, mostrar un mensaje de error indicando que el análisis excedió el tiempo límite y permitir al Usuario reintentar.
8. IF el Code_Reviewer o el Ticket_Generator producen un error o una respuesta con formato JSON inválido, THEN THE Sistema SHALL mostrar un mensaje de error al Usuario e indicar que el análisis puede reintentarse mediante un botón de reintento.

### Requirement 4: Visualización de tickets en Dashboard

**User Story:** As a usuario, I want ver los 3 tickets generados en un tablero tipo kanban, so that entender las mejoras propuestas y gestionar su progreso.

#### Acceptance Criteria

1. WHEN los tickets son generados y persistidos, THE Sistema SHALL mostrar el Dashboard con exactamente tres columnas visibles: "to_do", "in_review" y "done", cada una identificada con su nombre como encabezado.
2. THE Dashboard SHALL mostrar cada ticket como una tarjeta que incluya los campos: título (truncado a 80 caracteres con indicador de truncamiento si excede), descripción (truncada a 200 caracteres con indicador de truncamiento si excede), prioridad, dificultad y tiempo estimado en horas.
3. THE Dashboard SHALL ubicar cada ticket en la columna correspondiente a su estado actual según el valor retornado por la API del backend.
4. WHEN el usuario accede al Dashboard, THE Sistema SHALL mostrar los 3 tickets en un tiempo máximo de 3 segundos desde la carga de la vista.
5. IF la API del backend no responde o retorna un error al cargar los tickets, THEN THE Sistema SHALL mostrar un mensaje de error indicando que no se pudieron cargar los tickets y ofrecer una opción para reintentar la carga. WHEN la API responde exitosamente, THE Sistema SHALL mostrar el Dashboard normalmente sin mensaje de error, independientemente de flags internos en la respuesta.
6. WHEN el Usuario completa una acción que puede modificar el estado de un ticket (presionar "Verificar", completar la entrevista o recibir la evaluación), THE Sistema SHALL solicitar el estado actualizado de los tickets inmediatamente después de completarse dicha acción y actualizar la posición de los tickets en sus columnas correspondientes sin recargar la página completa.

### Requirement 5: Verificación de commit del usuario

**User Story:** As a usuario, I want presionar un botón "Verificar" después de hacer un commit con mi solución, so that el Sistema valide que realicé un cambio en el código.

#### Acceptance Criteria

1. THE Dashboard SHALL mostrar un botón "Verificar" asociado a cada ticket en estado "to_do".
2. WHEN el Usuario presiona "Verificar" en un ticket, THE Sistema SHALL cambiar el estado del ticket a "in_review".
3. WHEN el estado cambia a "in_review", THE Sistema SHALL obtener primero el nombre de la rama principal del repositorio (default_branch) mediante la GitHub_API, y SHALL usar ese valor para consultar el último commit de dicha rama.
4. WHEN la GitHub_API retorna exitosamente la información del último commit, THE Sistema SHALL obtener el código antes y después del commit para los archivos cuya ruta coincida con los archivos seleccionados en el Proyecto asociado al ticket.
5. IF el último commit no contiene cambios en al menos uno de los archivos seleccionados en el Proyecto asociado al ticket, THEN THE Sistema SHALL mostrar un mensaje indicando que no se detectaron cambios en los archivos del proyecto y revertir el estado del ticket a "to_do".
6. WHEN el último commit contiene cambios en al menos uno de los archivos seleccionados en el Proyecto asociado al ticket y la verificación de archivos fue exitosa, THE Sistema SHALL proceder a iniciar la entrevista simulada.
7. IF la GitHub_API retorna un error durante la consulta del commit o la obtención del código, THEN THE Sistema SHALL mostrar un mensaje de error indicando que la verificación falló, revertir el estado del ticket a "to_do" y permitir al Usuario reintentar.

### Requirement 6: Entrevista simulada con Tech Lead

**User Story:** As a usuario, I want participar en una entrevista simulada (por chat de texto o por llamada de voz) después de verificar mi commit, so that demostrar que comprendo la decisión de diseño que tomé.

#### Acceptance Criteria

1. WHEN se confirman cambios válidos en el commit, THE Sistema SHALL presentar al Usuario una selección de modo de entrevista ("Chat" o "Llamada") antes de iniciar la interacción con el Tech_Lead.
2. WHEN el Usuario selecciona el modo "Chat", THE Sistema SHALL presentar la interfaz de texto con estética visual de videollamada (avatar del Tech_Lead, indicador de participante Usuario, mensajes en formato de burbuja), manteniendo el intercambio de información exclusivamente en formato texto sin captura ni transmisión de audio o video real.
3. WHEN el Usuario selecciona el modo "Llamada", THE Sistema SHALL utilizar la Web Speech API del navegador (SpeechRecognition) para capturar la voz del Usuario y transcribirla a texto en el cliente, y SHALL utilizar SpeechSynthesis para reproducir en voz las preguntas del Tech_Lead y el feedback del Evaluator, mostrando en simultáneo la transcripción como subtítulo en pantalla.
4. THE Sistema SHALL enviar al backend exclusivamente texto en ambos modos (transcrito por el navegador en el caso de Llamada), sin transmitir audio al servidor en ningún caso.
5. IF el navegador del Usuario no soporta la Web Speech API, THEN THE Sistema SHALL deshabilitar la opción "Llamada", indicar el motivo al Usuario, y ofrecer únicamente el modo "Chat".
6. IF el Usuario selecciona el modo "Llamada" pero no otorga permiso de micrófono, o el permiso falla en cualquier momento durante la entrevista, THEN THE Sistema SHALL notificar al Usuario y SHALL permitir cambiar al modo "Chat" sin perder el progreso de la entrevista (preguntas ya generadas y respuestas ya enviadas).
7. THE Sistema SHALL permitir al Usuario cambiar de modo "Llamada" a "Chat" en cualquier momento durante la entrevista mediante una acción explícita, preservando el estado de la conversación.
8. WHEN el Usuario confirma el modo de entrevista, THE Tech_Lead SHALL recibir la descripción del ticket y el diff del código (antes y después del commit) y generar entre 2 y 3 preguntas de seguimiento en un máximo de 30 segundos.
9. WHEN el Tech_Lead genera las preguntas, THE Sistema SHALL presentarlas al Usuario según el modo activo: texto en modo Chat, o voz (mediante SpeechSynthesis) con subtítulo simultáneo en modo Llamada.
10. THE Sistema SHALL permitir al Usuario responder hasta 2000 caracteres por pregunta en modo Chat, o su equivalente transcrito por voz en modo Llamada, respetando el mismo límite de 2000 caracteres tras la transcripción, y enviar todas las respuestas mediante un único botón de envío.
11. IF el Usuario intenta enviar las respuestas sin haber completado al menos una respuesta para cada pregunta, THEN THE Sistema SHALL indicar al Usuario que todas las preguntas requieren respuesta antes de enviar.
12. WHEN el Usuario envía sus respuestas, THE Sistema SHALL transmitir al Evaluator las preguntas generadas, las respuestas del Usuario (texto en ambos modos), la descripción del ticket y el diff del código.
13. IF el Tech_Lead no logra generar las preguntas dentro del tiempo límite o produce un error, THEN THE Sistema SHALL mostrar un mensaje de error indicando que la entrevista no pudo iniciarse y SHALL permitir al Usuario reintentar únicamente después de que el mensaje de error se haya mostrado exitosamente, independientemente del modo seleccionado.

### Requirement 7: Evaluación de respuestas y aprobación del ticket

**User Story:** As a usuario, I want recibir feedback sobre mis respuestas en la entrevista, so that saber si demostré comprensión del cambio y si el ticket queda aprobado.

#### Acceptance Criteria

1. WHEN el Evaluator recibe las respuestas del Usuario, THE Evaluator SHALL producir un JSON con feedback textual (máximo 3000 caracteres) y un campo de aprobación (booleano) en un plazo máximo de 30 segundos.
2. THE Sistema SHALL mostrar el feedback del Evaluator al Usuario en la interfaz de chat, diferenciando visualmente entre aprobación y rechazo.
3. WHEN el Evaluator aprueba el ticket (campo aprobación es verdadero), THE Sistema SHALL cambiar el estado del ticket a "done" en la base de datos y reflejar el cambio en el Dashboard. THE Sistema SHALL cambiar el estado a "done" únicamente cuando el Evaluator aprueba explícitamente.
4. WHEN el Evaluator rechaza el ticket, THE Sistema SHALL mantener el estado del ticket en "in_review", mostrar las razones del rechazo en el feedback y permitir al Usuario reintentar la verificación con un nuevo commit, independientemente del estado actual del ticket.
5. THE Sistema SHALL persistir la Review en la base de datos con las preguntas generadas, la respuesta del Usuario, el feedback del Evaluator y el estado de aprobación.
6. IF el Evaluator no produce una respuesta dentro del plazo de 30 segundos o genera un error, THEN THE Sistema SHALL mostrar un mensaje de error indicando que la evaluación no pudo completarse y permitir al Usuario reintentar el envío de respuestas.

### Requirement 8: Arquitectura de agentes IA intercambiable

**User Story:** As a desarrollador del equipo, I want que la arquitectura de los agentes de IA permita cambiar de proveedor (Gemini o Groq) sin reescribir la lógica de negocio, so that poder elegir el proveedor óptimo en base a pruebas de latencia.

#### Acceptance Criteria

1. THE Sistema SHALL implementar los 4 agentes de IA (Code_Reviewer, Ticket_Generator, Tech_Lead, Evaluator) como funciones independientes en el directorio /backend/app/ai, donde cada función invoca exclusivamente la interfaz común de proveedor y no importa ni utiliza SDKs específicos de Gemini o Groq directamente.
2. THE Sistema SHALL abstraer la comunicación con el proveedor de IA detrás de una interfaz común que acepte un prompt en formato texto y retorne la respuesta como texto, de modo que las funciones de los agentes no dependan de tipos ni estructuras específicas de ningún proveedor.
3. WHEN se reinicia el backend con un valor diferente en la variable de entorno del proveedor de IA, THE Sistema SHALL utilizar el nuevo proveedor para todas las solicitudes subsiguientes sin requerir modificaciones en las funciones de los agentes ni en los endpoints de la API.
4. THE Sistema SHALL permitir configurar el proveedor de IA mediante una variable de entorno que acepte únicamente los valores "gemini" o "groq" como proveedores válidos.
5. IF la variable de entorno del proveedor de IA contiene un valor distinto de "gemini" o "groq", o no está definida, THEN THE Sistema SHALL impedir el arranque del backend e indicar un error que identifique el valor inválido o ausente.
6. IF el proveedor de IA configurado no responde dentro de 30 segundos, THEN THE Sistema SHALL retornar un error al agente solicitante indicando que el proveedor no está disponible, sin reintentos automáticos.

### Requirement 9: Persistencia de datos en Supabase

**User Story:** As a desarrollador del equipo, I want que los datos de proyectos, tickets y reviews se persistan en Supabase, so that mantener el estado del flujo entre interacciones.

#### Acceptance Criteria

1. THE Sistema SHALL almacenar registros de Proyecto con los campos: id (UUID generado automáticamente), repo_url (texto, máximo 2048 caracteres), archivos_seleccionados (arreglo de rutas relativas al repositorio), y fecha_analisis (timestamp con zona horaria).
2. THE Sistema SHALL almacenar registros de Ticket con los campos: id (UUID), project_id (referencia obligatoria a Proyecto), título (texto, máximo 200 caracteres), descripción (texto, máximo 2000 caracteres), prioridad (valor enumerado: alta, media, baja), dificultad (valor enumerado: alta, media, baja), tiempo_estimado (texto, máximo 50 caracteres), y estado (valor enumerado: to_do, in_review, done con valor por defecto to_do).
3. THE Sistema SHALL almacenar registros de Review con los campos: id (UUID), ticket_id (referencia obligatoria a Ticket), preguntas_generadas (arreglo de textos con entre 2 y 3 elementos), respuesta_usuario (texto, máximo 5000 caracteres), feedback_evaluator (texto, máximo 3000 caracteres), y aprobado (booleano).
4. THE Sistema SHALL utilizar Supabase (PostgreSQL) como única base de datos del proyecto.
5. THE Sistema SHALL garantizar integridad referencial de modo que cada Ticket esté asociado a un Proyecto existente y cada Review esté asociada a un Ticket existente, rechazando operaciones que violen estas relaciones.
6. IF una operación de escritura o lectura a Supabase falla, THEN THE Sistema SHALL retornar un mensaje de error al cliente indicando que la operación de persistencia no pudo completarse, sin exponer detalles internos de la base de datos en la respuesta al cliente; detalles internos podrán registrarse en logs del servidor para fines de depuración.

### Requirement 10: Lectura de repositorios mediante GitHub API pública

**User Story:** As a usuario, I want que el Sistema lea mi repositorio público sin requerir autenticación, so that no tener que configurar tokens ni permisos.

#### Acceptance Criteria

1. THE Sistema SHALL acceder a repositorios públicos de GitHub exclusivamente mediante la API REST pública sin autenticación OAuth.
2. WHEN el Usuario solicita la estructura de un repositorio, THE Sistema SHALL obtener y presentar el listado de directorios y archivos del repositorio mediante la GitHub_API, incluyendo nombre y tipo (archivo o directorio) de cada elemento.
3. WHEN el Usuario solicita el contenido de un archivo individual de tamaño igual o inferior a 1 MB, THE Sistema SHALL obtener y presentar el contenido decodificado del archivo mediante la GitHub_API.
4. WHEN el Usuario solicita información del último commit de un repositorio, THE Sistema SHALL obtener y presentar el SHA, autor, fecha, mensaje y diff del commit mediante la GitHub_API.
5. THE Sistema SHALL autenticar todas las solicitudes a la GitHub_API usando un Personal Access Token configurado mediante variable de entorno del backend, sin exponer ni solicitar dicho token al Usuario en ningún momento.
6. IF la variable de entorno del Personal Access Token de GitHub no está definida al arrancar el backend, THEN THE Sistema SHALL impedir el arranque e indicar un error explícito que identifique la variable ausente, sin bloquear el arranque por problemas de conectividad con la GitHub_API.
7. IF la GitHub_API retorna un error de rate limiting (HTTP 429 o HTTP 403 con cabecera X-RateLimit-Remaining en 0), THEN THE Sistema SHALL informar al Usuario que se alcanzó el límite de 5000 peticiones por hora e indicar el tiempo de espera restante obtenido de la cabecera X-RateLimit-Reset de la respuesta.
8. IF la GitHub_API retorna un error HTTP 404 o HTTP 403 al intentar acceder a un repositorio, THEN THE Sistema SHALL informar al Usuario que el repositorio no existe o no es accesible públicamente, sin revelar cuál de las dos condiciones aplica.
9. IF el Usuario solicita el contenido de un archivo que supera 1 MB de tamaño, THEN THE Sistema SHALL informar al Usuario que el archivo excede el límite de tamaño soportado por la API y no es posible obtener su contenido.
10. IF la GitHub_API no responde dentro de un plazo de 10 segundos, THEN THE Sistema SHALL informar al Usuario que no fue posible conectar con GitHub y sugerir verificar la conectividad o reintentar.

## Fuera de Alcance

Los siguientes elementos están explícitamente excluidos del MVP y no deben implementarse:

- **GitHub Webhooks**: La verificación de commits se realiza bajo demanda mediante consulta puntual a la API pública.
- **Servicios externos de STT/TTS y procesamiento de audio en backend**: El modo "Llamada" utiliza exclusivamente la Web Speech API nativa del navegador (SpeechRecognition y SpeechSynthesis). No se integra ningún servicio externo de STT/TTS de pago (Google Cloud Speech, AWS Polly, etc.). El backend nunca recibe, almacena ni procesa audio; toda la conversión voz↔texto ocurre en el cliente. El audio nunca sale del navegador ni se transmite al servidor.
- **Análisis del repositorio completo**: Solo se analizan los archivos/carpeta seleccionados por el Usuario.
- **OAuth o login de usuarios**: El Sistema opera con repositorios públicos sin autenticación de usuario, con sesión demo única.
- **Más de 3 tickets**: El Ticket_Generator siempre genera exactamente 3 tickets.
- **Gamificación (XP, niveles, contadores de horas)**: No se implementa sistema de recompensas.
- **Verificación formal/matemática**: El Evaluator realiza una comparación razonada, no una prueba formal.
- **Microservicios adicionales**: El backend es un único servicio FastAPI.
