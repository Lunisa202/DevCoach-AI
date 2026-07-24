# Requirements Document

## Introduction

Esta feature añade un **ranking/leaderboard** a DevCoach AI para aumentar la interactividad y la gamificación de la plataforma. Hoy el sistema evalúa a cada usuario de forma aislada (endpoint `GET /api/stats` agrega datos por usuario), pero no existe ninguna vista comparativa entre usuarios.

El leaderboard calcula un puntaje por usuario a partir de su actividad existente (calificaciones de reviews, reviews aprobadas y tickets completados), ordena a todos los usuarios de mayor a menor puntaje, y expone el resultado mediante un nuevo endpoint backend (`GET /api/ranking`). El frontend añade una nueva página accesible desde el sidebar que muestra el Top N de usuarios y la posición del usuario autenticado.

La feature respeta las restricciones arquitectónicas del proyecto: toda interacción con la base de datos ocurre exclusivamente en `db_service.py` (capa DB única), el acceso está protegido por JWT (`get_current_user`), y la privacidad se maneja mediante un alias opcional que sustituye al nombre real cuando el usuario lo configura.

El alcance de esta fase se limita a un ranking **global/histórico** (sin filtros por periodo), dejando la periodicidad por rango de fechas como mejora futura fuera de alcance.

## Glossary

- **Ranking_Service**: Componente backend (métodos nuevos en `db_service.py`) responsable de agregar datos cross-user y calcular el ordenamiento del leaderboard.
- **Ranking_Endpoint**: Endpoint HTTP `GET /api/ranking` que expone el leaderboard al frontend.
- **Ranking_Page**: Nueva página/vista del frontend que muestra el leaderboard, accesible desde el sidebar.
- **Ranking_Score**: Puntaje numérico calculado por usuario usado para ordenar el leaderboard.
- **Ranking_Entry**: Registro individual del leaderboard correspondiente a un usuario, compuesto por posición, nombre a mostrar, puntaje y métricas de apoyo.
- **Leaderboard**: Lista ordenada de Ranking_Entry de mayor a menor Ranking_Score.
- **Top_N**: Subconjunto de las primeras N posiciones del Leaderboard, con N = 10 por defecto.
- **Display_Name**: Nombre mostrado públicamente para un usuario en el Leaderboard; es el alias del usuario si está configurado, o su `full_name` en caso contrario.
- **Alias**: Cadena opcional configurada por el usuario para mostrarse en el Leaderboard en lugar de su nombre real.
- **Current_User**: Usuario autenticado que realiza la petición, identificado por el JWT.
- **Identificador_Usuario**: Identificador único del usuario (clave primaria del registro en la tabla `users`), usado como criterio de desempate final determinista.
- **Approved_Review**: Registro de la tabla `reviews` cuyo campo `aprobado` es verdadero.
- **Completed_Ticket**: Ticket cuyo campo `estado` es `done`.
- **Calificacion**: Puntaje entero de 0 a 100 asignado por el Evaluator a una review.

## Requirements

### Requirement 1: Cálculo del puntaje de ranking por usuario

**User Story:** Como usuario de DevCoach AI, quiero que mi actividad de aprendizaje se traduzca en un puntaje comparable, para poder medir mi progreso frente a otros usuarios.

#### Acceptance Criteria

1. THE Ranking_Service SHALL calcular por cada usuario que tenga al menos un proyecto registrado un Ranking_Score entero mayor o igual que 0, derivado de la Calificacion entera de 0 a 100 de cada review.
2. THE Ranking_Service SHALL calcular el Ranking_Score entero mayor o igual que 0 de un usuario como la suma de la Calificacion de todas sus Approved_Review.
3. IF un usuario no tiene ninguna Approved_Review, THEN THE Ranking_Service SHALL asignar a ese usuario un Ranking_Score de 0.
4. IF una Approved_Review tiene el campo `calificacion` en nulo, THEN THE Ranking_Service SHALL tratar esa Calificacion como 0 en el cálculo del Ranking_Score.
5. THE Ranking_Service SHALL calcular, como métrica de apoyo, el conteo entero mayor o igual que 0 de Approved_Review de cada usuario.
6. THE Ranking_Service SHALL calcular, como métrica de apoyo, el conteo entero mayor o igual que 0 de Completed_Ticket de cada usuario.

### Requirement 2: Ordenamiento y posición en el leaderboard

**User Story:** Como usuario, quiero ver una lista ordenada de usuarios por puntaje, para saber quién lidera y en qué posición estoy.

#### Acceptance Criteria

1. WHEN THE Ranking_Service genera o actualiza el Leaderboard, THE Ranking_Service SHALL ordenar las Ranking_Entry por Ranking_Score de forma descendente.
2. WHEN dos o más usuarios tienen el mismo Ranking_Score, THE Ranking_Service SHALL desempatar ordenando por conteo de Approved_Review de forma descendente.
3. WHEN dos o más usuarios tienen el mismo Ranking_Score y el mismo conteo de Approved_Review, THE Ranking_Service SHALL desempatar ordenando por `created_at` del usuario de forma ascendente.
4. THE Ranking_Service SHALL asignar a cada Ranking_Entry una posición entera única y consecutiva que inicia en 1 para el usuario con mayor Ranking_Score.
5. WHEN dos o más usuarios tienen el mismo Ranking_Score, el mismo conteo de Approved_Review y el mismo `created_at`, THE Ranking_Service SHALL desempatar ordenando por el identificador único del usuario de forma ascendente, de modo que el orden y las posiciones asignadas sean idénticos en cada generación del Leaderboard con los mismos datos.
6. WHEN THE Ranking_Service genera el Leaderboard y no existe ningún usuario, THE Ranking_Service SHALL producir un Leaderboard vacío sin Ranking_Entry ni posiciones asignadas.

### Requirement 3: Endpoint de ranking

**User Story:** Como desarrollador del frontend, quiero un endpoint autenticado que devuelva el leaderboard, para poder renderizar la vista de ranking.

#### Acceptance Criteria

1. WHEN el Current_User envía una petición autenticada a `GET /api/ranking`, THE Ranking_Endpoint SHALL responder con el Top_N del Leaderboard ordenado por Ranking_Score de forma descendente y con la Ranking_Entry del Current_User.
2. IF una petición a `GET /api/ranking` no incluye un JWT válido, THEN THE Ranking_Endpoint SHALL responder con el código de estado HTTP 401.
3. WHEN el Current_User está presente en el Top_N, THE Ranking_Endpoint SHALL incluir la Ranking_Entry del Current_User marcada con su posición absoluta 1-based dentro del Leaderboard completo, sin duplicar registros adicionales.
4. WHEN el Current_User no está presente en el Top_N, THE Ranking_Endpoint SHALL incluir de forma separada la posición absoluta 1-based del Current_User dentro del Leaderboard completo y su Ranking_Score.
5. THE Ranking_Endpoint SHALL aceptar un parámetro de consulta `limit` entero que define el tamaño del Top_N con un valor por defecto de 10.
6. IF el parámetro `limit` recibido no es un entero, es menor que 1 o mayor que 100, THEN THE Ranking_Endpoint SHALL responder con el código de estado HTTP 422.
7. WHERE no existe ningún usuario con proyectos registrados, THE Ranking_Endpoint SHALL responder con un Leaderboard vacío, con posición nula y con Ranking_Score nulo para el Current_User.
8. IF ocurre un error al agregar los datos del ranking, THEN THE Ranking_Endpoint SHALL responder con el código de estado HTTP 500 y un mensaje genérico sin exponer detalles internos de la base de datos.
9. WHEN dos o más usuarios del Top_N tienen el mismo Ranking_Score, THE Ranking_Endpoint SHALL presentarlos en un orden determinista idéntico entre peticiones aplicando los mismos criterios de desempate del Ranking_Service.

### Requirement 4: Agregación de datos cross-user en la capa DB

**User Story:** Como responsable de la arquitectura, quiero que la agregación cross-user se realice únicamente en la capa de base de datos, para mantener la regla de que `db_service` es el único punto de acceso a la base de datos.

#### Acceptance Criteria

1. THE Ranking_Service SHALL residir en `db_service.py` como uno o más métodos nuevos de la clase `DBService`.
2. THE Ranking_Service SHALL calcular el Ranking_Score de cada usuario agregando exclusivamente los registros que pertenecen a ese usuario en las tablas `users`, `projects`, `tickets` y `reviews`, produciendo exactamente una entrada de Leaderboard por usuario.
3. WHEN el Ranking_Endpoint solicita datos del Leaderboard, THE Ranking_Endpoint SHALL obtenerlos exclusivamente a través del Ranking_Service, sin consultar directamente las tablas `users`, `projects`, `tickets` o `reviews`.
4. THE Ranking_Service SHALL devolver las entradas del Leaderboard ordenadas por Ranking_Score de forma descendente y, ante empates de Ranking_Score, ordenadas de forma determinista por identificador de usuario ascendente.
5. WHEN no existe ningún usuario con datos agregables, THE Ranking_Service SHALL devolver un Leaderboard vacío sin lanzar error.
6. IF el Ranking_Service encuentra un error de base de datos durante la agregación, THEN THE Ranking_Service SHALL registrar el error internamente, no modificar ningún dato de las tablas consultadas, y lanzar un `DBServiceError` con un mensaje genérico que no exponga detalles internos de la consulta.

### Requirement 5: Privacidad mediante alias

**User Story:** Como usuario preocupado por mi privacidad, quiero poder mostrarme con un alias en el ranking, para no exponer mi nombre real a otros usuarios.

#### Acceptance Criteria

1. WHERE un usuario tiene un Alias configurado como una cadena de 1 a 30 caracteres tras recortar los espacios inicial y final, THE Ranking_Service SHALL usar ese Alias como Display_Name en su Ranking_Entry.
2. WHERE un usuario no tiene un Alias configurado como una cadena de 1 a 30 caracteres tras recortar los espacios inicial y final, THE Ranking_Service SHALL usar el `full_name` del usuario como Display_Name en su Ranking_Entry.
3. THE Ranking_Endpoint SHALL incluir en cada Ranking_Entry únicamente el Display_Name, el Ranking_Score, la posición y las métricas de apoyo, excluyendo el email y cualquier otro dato personal.
4. WHEN el Current_User envía una petición autenticada para actualizar su Alias, THE Ranking_Service SHALL persistir el Alias asociado al Current_User.
5. IF un Alias enviado está vacío, contiene únicamente espacios o excede 30 caracteres tras recortar los espacios inicial y final, THEN THE Ranking_Endpoint SHALL responder con el código de estado HTTP 422 y conservar el Alias previo del Current_User.
6. WHERE un usuario no tiene un Alias configurado ni un `full_name`, THE Ranking_Service SHALL usar un Display_Name genérico anónimo en su Ranking_Entry.
7. IF una petición no autenticada intenta actualizar un Alias, THEN THE Ranking_Endpoint SHALL responder con el código de estado HTTP 401 sin persistir ningún cambio.

### Requirement 6: Vista de ranking en el frontend

**User Story:** Como usuario, quiero ver el leaderboard en una página dedicada dentro de la aplicación, para consultar mi posición y la de los demás de forma visual.

#### Acceptance Criteria

1. THE Ranking_Page SHALL mostrar los primeros Top_N (10) Ranking_Entry del Leaderboard ordenados de forma descendente por Ranking_Score, presentando para cada Ranking_Entry su posición (numerada de 1 a Top_N), su Display_Name y su Ranking_Score.
2. WHEN el Current_User abre la Ranking_Page, THE Ranking_Page SHALL solicitar los datos del Leaderboard al Ranking_Endpoint mediante el cliente axios autenticado con un tiempo máximo de espera de 10 segundos.
3. WHILE el Current_User aparece dentro del Top_N mostrado, THE Ranking_Page SHALL resaltar la Ranking_Entry del Current_User con un estilo visual diferenciado del resto de Ranking_Entry.
4. WHEN el Current_User no aparece dentro del Top_N, THE Ranking_Page SHALL mostrar la posición y el Ranking_Score del Current_User en una sección diferenciada del listado del Top_N.
5. WHILE la petición al Ranking_Endpoint está en curso, THE Ranking_Page SHALL mostrar un indicador de carga y ocultar el listado del Leaderboard hasta que la petición finalice.
6. IF la petición al Ranking_Endpoint falla o excede los 10 segundos de espera, THEN THE Ranking_Page SHALL mostrar un mensaje de error que indique que no se pudo cargar el ranking y ofrecer una acción visible para reintentar la petición.
7. IF el Leaderboard no contiene ninguna Ranking_Entry, THEN THE Ranking_Page SHALL mostrar un mensaje que indique que aún no hay usuarios en el ranking.

### Requirement 7: Acceso al ranking desde el sidebar

**User Story:** Como usuario, quiero acceder al ranking desde el menú lateral, para llegar a la vista con un solo clic desde cualquier pantalla protegida.

#### Acceptance Criteria

1. WHILE el Current_User está autenticado y visualiza cualquier pantalla protegida, THE Sidebar SHALL mostrar de forma persistente un único elemento de navegación etiquetado de forma visible que identifica y da acceso a la Ranking_Page.
2. WHEN el Current_User selecciona el elemento de navegación del ranking, THE Sidebar SHALL navegar a la ruta de la Ranking_Page en 1 segundo o menos.
3. WHILE la Ranking_Page es la ruta activa, THE Sidebar SHALL resaltar el elemento de navegación del ranking como seleccionado mediante un indicador visual distinto del estado no seleccionado.
4. THE Ranking_Page SHALL estar registrada como una ruta protegida dentro del `AppLayout` que requiere autenticación.
5. IF un usuario no autenticado intenta acceder a la ruta de la Ranking_Page, THEN THE AppLayout SHALL redirigir a la pantalla de autenticación sin renderizar el contenido de la Ranking_Page.
