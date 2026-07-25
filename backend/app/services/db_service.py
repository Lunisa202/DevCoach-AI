"""
DB Service — Capa CRUD para comunicación con Supabase.

LÓGICA DE NEGOCIO:
    Este servicio traduce las operaciones del backend (crear proyecto, guardar tickets,
    actualizar estados) en peticiones a las tablas de Supabase. Es el ÚNICO lugar donde
    se interactúa con la base de datos — los endpoints nunca hablan directo con Supabase.

    Tablas que maneja:
    - projects: almacena los proyectos analizados (repo_url + archivos seleccionados)
    - tickets: los 3 tickets generados por la IA para cada proyecto
    - reviews: las evaluaciones de las entrevistas (preguntas, respuestas, feedback)

LÓGICA DE PROGRAMACIÓN:
    - Usa el cliente oficial `supabase-py` que genera peticiones REST automáticamente.
    - Cada método envuelve la operación en try/except para NUNCA exponer errores SQL al usuario.
    - Los errores se loguean internamente pero al exterior se lanza un DBServiceError genérico.
    - Usa UUID como tipo de ID (generados automáticamente por Supabase con gen_random_uuid()).

REGLA DE ORO:
    NUNCA devolver str(exception) al usuario — puede contener SQL, nombres de tabla,
    o datos internos. Solo loguear y lanzar mensaje genérico.

USO DESDE OTROS ARCHIVOS:
    from app.services.db_service import DBService

    db = DBService(url="https://xxx.supabase.co", key="anon-key")
    project = await db.create_project("https://github.com/...", ["src/main.py"])
    tickets = await db.create_tickets(project_id, [TicketData(...), ...])
"""

import logging
from uuid import UUID

from supabase import create_client, Client

from app.models.ticket import TicketData, EstadoTicket

# Logger para errores internos (va a consola/logs del servidor, nunca al usuario)
logger = logging.getLogger(__name__)


# ============================================================
# EXCEPCIONES PERSONALIZADAS
# ============================================================


class DBServiceError(Exception):
    """Error genérico de base de datos. Mensaje seguro para el usuario."""
    pass


class RecordNotFoundError(DBServiceError):
    """El registro solicitado no existe."""
    pass


# ============================================================
# SERVICIO PRINCIPAL
# ============================================================


class DBService:
    """
    Capa de abstracción sobre Supabase para operaciones CRUD.

    PARÁMETROS:
        url (str): URL del proyecto Supabase (ej: https://abc123.supabase.co)
        key (str): Anon key de Supabase (la pública, no la service_role)

    NOTAS:
        - Supabase genera los IDs automáticamente (UUID v4).
        - Los timestamps se generan con NOW() en la DB.
        - Las restricciones de la DB (CHECK, NOT NULL) son la última línea de defensa;
          Pydantic valida antes, pero si algo se escapa, la DB lo frena.
    """

    def __init__(self, url: str, key: str):
        """
        Crea el cliente de Supabase.
        
        El cliente traduce operaciones como .insert() o .select()
        en peticiones HTTP a la API REST auto-generada de Supabase (PostgREST).
        """
        self._client: Client = create_client(url, key)

    # ---------------------------------------------------------------
    # PROJECTS
    # ---------------------------------------------------------------

    async def create_project(self, repo_url: str, archivos_seleccionados: list[str], user_id: str) -> dict:
        """
        Crea un nuevo proyecto en la DB.

        LÓGICA DE NEGOCIO:
            Cuando el usuario elige un repo y selecciona archivos, se crea un
            "proyecto" que agrupa ese análisis. Los tickets se asocian a este proyecto.

        PARÁMETROS:
            repo_url: URL del repositorio (ya validada por el endpoint)
            archivos_seleccionados: lista de rutas de archivos elegidos por el usuario
            user_id: ID del usuario autenticado (extraído del JWT, nunca del body)

        RETORNA:
            Diccionario con los datos del proyecto creado (incluye id y fecha_analisis
            generados por la DB).
        """
        try:
            result = (
                self._client.table("projects")
                .insert({
                    "repo_url": repo_url,
                    "archivos_seleccionados": archivos_seleccionados,
                    "user_id": user_id,
                })
                .execute()
            )

            if not result.data:
                raise DBServiceError("No se pudo crear el proyecto")

            return result.data[0]

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error creando proyecto: {e}")
            raise DBServiceError("No se pudo crear el proyecto")

    async def get_project(self, project_id: UUID) -> dict:
        """
        Obtiene un proyecto por su ID.

        RETORNA:
            Diccionario con los datos del proyecto.

        LANZA:
            RecordNotFoundError si no existe.
        """
        try:
            result = (
                self._client.table("projects")
                .select("*")
                .eq("id", str(project_id))
                .execute()
            )

            if not result.data:
                raise RecordNotFoundError(f"Proyecto no encontrado")

            return result.data[0]

        except (DBServiceError, RecordNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error obteniendo proyecto {project_id}: {e}")
            raise DBServiceError("No se pudo obtener el proyecto")

    # ---------------------------------------------------------------
    # TICKETS
    # ---------------------------------------------------------------

    async def create_tickets(self, project_id: UUID, tickets: list[TicketData]) -> list[dict]:
        """
        Guarda los tickets generados por la IA en la DB.

        LÓGICA DE NEGOCIO:
            Después de que el Code_Reviewer y Ticket_Generator procesan el código,
            se generan exactamente 3 tickets. Este método los guarda asociados al
            proyecto, con estado inicial "to_do".

        PARÁMETROS:
            project_id: UUID del proyecto al que pertenecen
            tickets: lista de TicketData (validados por Pydantic, vienen de la IA)

        RETORNA:
            Lista de diccionarios con los tickets creados (incluyen id y estado).

        NOTA:
            El campo `tiempo_estimado` en la DB es TEXT (ej: "2h", "45min"),
            pero el TicketData tiene `tiempo_estimado_minutos` como INT.
            Hacemos la conversión aquí: 120 min → "2h", 45 min → "45min".
        """
        try:
            rows = [
                {
                    "project_id": str(project_id),
                    "titulo": ticket.titulo,
                    "descripcion": ticket.descripcion,
                    "prioridad": ticket.prioridad.value,      # Enum → string
                    "dificultad": ticket.dificultad.value,    # Enum → string (con acento)
                    "tiempo_estimado": self._format_time(ticket.tiempo_estimado_minutos),
                    "estado": EstadoTicket.TO_DO.value,       # Siempre empieza en to_do
                }
                for ticket in tickets
            ]

            result = (
                self._client.table("tickets")
                .insert(rows)
                .execute()
            )

            if not result.data:
                raise DBServiceError("No se pudieron crear los tickets")

            return result.data

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error creando tickets para proyecto {project_id}: {e}")
            raise DBServiceError("No se pudieron crear los tickets")

    async def get_tickets_by_project(self, project_id: UUID) -> list[dict]:
        """
        Obtiene todos los tickets de un proyecto.

        LÓGICA DE NEGOCIO:
            El frontend (Dashboard/Kanban de Carolina) pide la lista de tickets
            para distribuirlos en las 3 columnas según su estado.

        RETORNA:
            Lista de diccionarios con los datos de cada ticket.
        """
        try:
            result = (
                self._client.table("tickets")
                .select("*")
                .eq("project_id", str(project_id))
                .execute()
            )

            return result.data or []

        except Exception as e:
            logger.error(f"Error obteniendo tickets del proyecto {project_id}: {e}")
            raise DBServiceError("No se pudieron obtener los tickets")

    async def get_ticket(self, ticket_id: UUID) -> dict:
        """
        Obtiene un ticket por su ID.

        LANZA:
            RecordNotFoundError si no existe.
        """
        try:
            result = (
                self._client.table("tickets")
                .select("*")
                .eq("id", str(ticket_id))
                .execute()
            )

            if not result.data:
                raise RecordNotFoundError("Ticket no encontrado")

            return result.data[0]

        except (DBServiceError, RecordNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error obteniendo ticket {ticket_id}: {e}")
            raise DBServiceError("No se pudo obtener el ticket")

    async def update_ticket_state(self, ticket_id: UUID, new_state: EstadoTicket) -> dict:
        """
        Actualiza el estado de un ticket (to_do → in_review → done).

        LÓGICA DE NEGOCIO:
            Los tickets pasan por 3 estados:
            - to_do: recién creado, el usuario aún no ha hecho commit
            - in_review: el usuario hizo commit y se verificó que tocó archivos relevantes
            - done: pasó la entrevista (el evaluator aprobó sus respuestas)

            También puede volver de in_review → to_do si el commit no tiene
            cambios relevantes, o mantenerse en in_review si no aprueba la entrevista.

        RETORNA:
            Diccionario con el ticket actualizado.
        """
        try:
            result = (
                self._client.table("tickets")
                .update({"estado": new_state.value})
                .eq("id", str(ticket_id))
                .execute()
            )

            if not result.data:
                raise RecordNotFoundError("Ticket no encontrado")

            return result.data[0]

        except (DBServiceError, RecordNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error actualizando estado del ticket {ticket_id}: {e}")
            raise DBServiceError("No se pudo actualizar el ticket")

    # ---------------------------------------------------------------
    # REVIEWS
    # ---------------------------------------------------------------

    async def create_review(
        self,
        ticket_id: UUID,
        preguntas: list[str],
        respuestas: str,
        feedback: str,
        aprobado: bool,
        calificacion: int | None = None,
        aspectos_evaluados: list[dict] | None = None,
        conceptos_a_mejorar: list[str] | None = None,
    ) -> dict:
        """
        Guarda una review (resultado de la entrevista) en la DB.

        PARÁMETROS:
            ticket_id: UUID del ticket evaluado
            preguntas: las 2-3 preguntas que generó el Tech_Lead
            respuestas: texto con las respuestas del usuario (concatenadas)
            feedback: texto del Evaluator explicando su decisión
            aprobado: True si el usuario demostró comprensión, False si no
            calificacion: puntaje 0-100 (suma de 5 dimensiones)
            aspectos_evaluados: lista de {dimension, puntaje, comentario}
            conceptos_a_mejorar: conceptos que el usuario debería estudiar

        RETORNA:
            Diccionario con la review creada.
        """
        try:
            row = {
                "ticket_id": str(ticket_id),
                "preguntas_generadas": preguntas,
                "respuesta_usuario": respuestas,
                "feedback_evaluator": feedback,
                "aprobado": aprobado,
            }

            if calificacion is not None:
                row["calificacion"] = calificacion
            if aspectos_evaluados is not None:
                import json
                row["aspectos_evaluados"] = json.dumps(aspectos_evaluados)
            if conceptos_a_mejorar is not None:
                row["conceptos_a_mejorar"] = conceptos_a_mejorar

            result = (
                self._client.table("reviews")
                .insert(row)
                .execute()
            )

            if not result.data:
                raise DBServiceError("No se pudo guardar la review")

            return result.data[0]

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error creando review para ticket {ticket_id}: {e}")
            raise DBServiceError("No se pudo guardar la review")

    async def get_reviews_by_ticket(self, ticket_id: UUID) -> list[dict]:
        """
        Obtiene todas las reviews de un ticket (historial de intentos).

        RETORNA:
            Lista de reviews ordenadas por fecha (más reciente primero).
        """
        try:
            result = (
                self._client.table("reviews")
                .select("*")
                .eq("ticket_id", str(ticket_id))
                .order("id", desc=True)
                .execute()
            )

            return result.data or []

        except Exception as e:
            logger.error(f"Error obteniendo reviews del ticket {ticket_id}: {e}")
            raise DBServiceError("No se pudieron obtener las reviews")

    # ---------------------------------------------------------------
    # HELPERS PRIVADOS
    # ---------------------------------------------------------------

    @staticmethod
    def _format_time(minutes: int) -> str:
        """
        Convierte minutos a un formato legible para la DB y el frontend.

        Ejemplos:
            60  → "1h"
            90  → "1h 30min"
            45  → "45min"
            120 → "2h"
            150 → "2h 30min"

        NOTA: La DB espera TEXT de máximo 50 chars (CHECK constraint).
        """
        if minutes < 60:
            return f"{minutes}min"

        hours = minutes // 60
        remaining = minutes % 60

        if remaining == 0:
            return f"{hours}h"

        return f"{hours}h {remaining}min"

    # ---------------------------------------------------------------
    # PROJECTS — HISTORIAL
    # ---------------------------------------------------------------

    async def get_projects_by_user(self, user_id: str) -> list[dict]:
        """
        Lista todos los proyectos de un usuario, ordenados por fecha descendente.
        Incluye tickets_total y tickets_done para mostrar progreso en el sidebar.
        """
        try:
            result = (
                self._client.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .order("fecha_analisis", desc=True)
                .execute()
            )

            projects = result.data or []
            if not projects:
                return []

            # Fetch ticket counts per project
            project_ids = [p["id"] for p in projects]
            tickets_res = (
                self._client.table("tickets")
                .select("project_id, estado")
                .in_("project_id", project_ids)
                .execute()
            )
            tickets = tickets_res.data or []

            # Aggregate counts
            counts: dict[str, dict[str, int]] = {}
            for t in tickets:
                pid = t.get("project_id")
                if not pid:
                    continue
                if pid not in counts:
                    counts[pid] = {"total": 0, "done": 0}
                counts[pid]["total"] += 1
                if t.get("estado") == "done":
                    counts[pid]["done"] += 1

            # Attach to projects
            for p in projects:
                c = counts.get(p["id"], {"total": 0, "done": 0})
                p["tickets_total"] = c["total"]
                p["tickets_done"] = c["done"]

            return projects

        except Exception as e:
            logger.error(f"Error obteniendo proyectos del usuario {user_id}: {e}")
            raise DBServiceError("No se pudieron obtener los proyectos")

    async def delete_project(self, project_id: str, user_id: str) -> bool:
        """
        Elimina un proyecto verificando que pertenezca al usuario.

        SEGURIDAD: un usuario solo puede eliminar sus propios proyectos.
        El CASCADE de la FK elimina tickets y reviews automáticamente.

        RETORNA:
            True si se eliminó, False si no existía.

        LANZA:
            DBServiceError si el proyecto no pertenece al usuario.
        """
        try:
            # Verificar que el proyecto existe y pertenece al usuario
            check = (
                self._client.table("projects")
                .select("id, user_id")
                .eq("id", project_id)
                .execute()
            )

            if not check.data:
                return False

            if check.data[0]["user_id"] != user_id:
                raise DBServiceError("El proyecto no pertenece al usuario")

            # Eliminar (CASCADE borra tickets y reviews)
            self._client.table("projects").delete().eq("id", project_id).execute()
            return True

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error eliminando proyecto {project_id}: {e}")
            raise DBServiceError("No se pudo eliminar el proyecto")

    # ---------------------------------------------------------------
    # USERS
    # ---------------------------------------------------------------

    async def create_user(self, full_name: str, email: str, hashed_password: str) -> dict:
        """
        Crea un nuevo usuario en la DB.

        PARÁMETROS:
            full_name: nombre completo del usuario
            email: email único (la DB tiene UNIQUE constraint)
            hashed_password: bcrypt hash — NUNCA texto claro

        RETORNA:
            Diccionario con los datos del usuario creado (sin password).

        LANZA:
            DBServiceError con mensaje "Email ya registrado" si el email ya existe.
        """
        try:
            result = (
                self._client.table("users")
                .insert({
                    "full_name": full_name,
                    "email": email,
                    "password": hashed_password,
                })
                .execute()
            )

            if not result.data:
                raise DBServiceError("No se pudo crear el usuario")

            user = result.data[0]
            # Nunca devolver el hash de la contraseña
            user.pop("password", None)
            return user

        except DBServiceError:
            raise
        except Exception as e:
            error_str = str(e).lower()
            if "unique" in error_str or "duplicate" in error_str or "23505" in error_str:
                raise DBServiceError("Email ya registrado")
            logger.error(f"Error creando usuario: {e}")
            raise DBServiceError("No se pudo crear el usuario")

    async def get_user_by_email(self, email: str) -> dict | None:
        """
        Busca un usuario por email. Incluye el hash de contraseña (para verificación).

        RETORNA:
            Diccionario con todos los campos del usuario (incluye password hash),
            o None si no existe.

        NOTA:
            Este método incluye el password para que auth_service pueda verificarlo.
            NUNCA devolver este dict directamente al frontend — usar UserResponse.
        """
        try:
            result = (
                self._client.table("users")
                .select("*")
                .eq("email", email)
                .execute()
            )

            if not result.data:
                return None

            return result.data[0]

        except Exception as e:
            logger.error(f"Error buscando usuario por email: {e}")
            raise DBServiceError("No se pudo completar la operación")

    async def get_user_by_id(self, user_id: str) -> dict:
        """
        Obtiene un usuario por su ID. No incluye el hash de contraseña.

        Usado por get_current_user para validar el token JWT y por el
        frontend para hidratar el alias del usuario en la app.

        LANZA:
            DBServiceError si no existe o hay error de DB.
        """
        try:
            result = (
                self._client.table("users")
                .select("id, full_name, email, created_at, alias, avatar_url")
                .eq("id", user_id)
                .execute()
            )

            if not result.data:
                raise DBServiceError("Usuario no encontrado")

            return result.data[0]

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error obteniendo usuario {user_id}: {e}")
            raise DBServiceError("No se pudo obtener el usuario")

    # ---------------------------------------------------------------
    # USER SETTINGS (profile, password, API key)
    # ---------------------------------------------------------------

    async def update_user_profile(self, user_id: str, full_name: str) -> dict:
        """Update user's full_name. Returns updated user data."""
        try:
            result = (
                self._client.table("users")
                .update({"full_name": full_name})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
            return result.data[0]
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error updating profile for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar el perfil")

    async def update_user_password(self, user_id: str, hashed_password: str) -> None:
        """Update user's password hash."""
        try:
            result = (
                self._client.table("users")
                .update({"password": hashed_password})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error updating password for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar la contraseña")

    async def user_has_api_key(self, user_id: str) -> bool:
        """Check if user has a personal API key stored."""
        try:
            result = (
                self._client.table("users")
                .select("gemini_api_key")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return False
            return bool(result.data[0].get("gemini_api_key"))
        except Exception:
            return False

    async def save_user_api_key(self, user_id: str, api_key: str) -> None:
        """Save user's personal Gemini API key."""
        try:
            result = (
                self._client.table("users")
                .update({"gemini_api_key": api_key})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error saving API key for {user_id}: {e}")
            raise DBServiceError("No se pudo guardar la API key")

    async def delete_user_api_key(self, user_id: str) -> None:
        """Remove user's personal API key."""
        try:
            result = (
                self._client.table("users")
                .update({"gemini_api_key": None})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error deleting API key for {user_id}: {e}")
            raise DBServiceError("No se pudo eliminar la API key")

    async def get_user_api_key(self, user_id: str) -> str | None:
        """Get user's personal API key, or None if not set."""
        try:
            result = (
                self._client.table("users")
                .select("gemini_api_key")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return None
            return result.data[0].get("gemini_api_key")
        except Exception:
            return None

    # ---------------------------------------------------------------
    # RANKING / LEADERBOARD
    # ---------------------------------------------------------------

    # Etiqueta usada como Display_Name cuando el usuario no tiene alias ni
    # full_name utilizables. Coherente con Requirement 5.6.
    _ANON_DISPLAY_NAME = "Usuario anónimo"

    async def update_user_alias(self, user_id: str, alias: str | None) -> dict:
        """
        Actualiza el alias público de un usuario.

        VALIDACIÓN:
            - alias == None       → limpia el alias (vuelve al full_name).
            - alias no vacío tras trim y con 1..30 chars → se guarda ya trimeado.
            - alias vacío tras trim o > 30 chars → ValueError (el endpoint lo
              traduce a 422 y NO se persiste nada).

        La misma validación existe como CHECK en la DB (migración 005) como
        última línea de defensa.

        RETORNA:
            Diccionario con el usuario actualizado (sin password).
        """
        # None se acepta explícitamente para "quitar alias".
        value: str | None
        if alias is None:
            value = None
        else:
            trimmed = alias.strip()
            if len(trimmed) < 1 or len(trimmed) > 30:
                raise ValueError("Alias must be 1..30 chars after trim")
            value = trimmed

        try:
            result = (
                self._client.table("users")
                .update({"alias": value})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
            user = result.data[0]
            user.pop("password", None)
            return user
        except (DBServiceError, ValueError):
            raise
        except Exception as e:
            logger.error(f"Error updating alias for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar el alias")

    def _display_name(self, user_row: dict) -> str:
        """
        Resuelve el Display_Name del usuario según Requirement 5:
        alias válido > full_name > 'Usuario anónimo'.
        """
        alias = (user_row.get("alias") or "").strip()
        if 1 <= len(alias) <= 30:
            return alias
        full_name = (user_row.get("full_name") or "").strip()
        if full_name:
            return full_name
        return self._ANON_DISPLAY_NAME

    async def get_leaderboard(self) -> list[dict]:
        """
        Calcula el leaderboard completo de todos los usuarios que tengan al
        menos un proyecto registrado (Requirement 1.1).

        LÓGICA:
            1. Trae todos los users (id, full_name, alias, created_at).
            2. Trae todos los projects (para saber qué users tienen actividad).
            3. Trae tickets + reviews y agrega por user_id:
                 - score = Σ calificacion de reviews aprobadas (NULL → 0)
                 - approved_reviews_count
                 - completed_tickets_count
            4. Devuelve UNA entrada por usuario con proyectos, ordenada por:
                 score DESC → approved_reviews DESC → user.created_at ASC → user.id ASC
               (Requirements 2.1, 2.2, 2.3, 2.5, 4.4)
            5. Asigna position 1-based consecutiva (Requirement 2.4).

        RETORNA:
            Lista de dicts, cada uno con:
              - user_id, display_name, score, approved_reviews_count,
                completed_tickets_count, position

            Vacía si no hay usuarios con proyectos (Requirements 2.6, 4.5).

        LANZA:
            DBServiceError con mensaje genérico si falla la agregación
            (Requirement 4.6).
        """
        try:
            # 1) Usuarios
            users_res = (
                self._client.table("users")
                .select("id, full_name, alias, created_at")
                .execute()
            )
            users = users_res.data or []
            if not users:
                return []

            # 2) Proyectos — mapa user_id → set(project_id)
            projects_res = (
                self._client.table("projects")
                .select("id, user_id")
                .execute()
            )
            projects = projects_res.data or []
            user_projects: dict[str, set[str]] = {}
            for p in projects:
                uid = p.get("user_id")
                pid = p.get("id")
                if uid and pid:
                    user_projects.setdefault(uid, set()).add(pid)

            # 3) Tickets — mapa ticket_id → project_id, y proyecto → tickets
            tickets_res = (
                self._client.table("tickets")
                .select("id, project_id, estado")
                .execute()
            )
            tickets = tickets_res.data or []
            ticket_project: dict[str, str] = {}
            for t in tickets:
                tid = t.get("id")
                pid = t.get("project_id")
                if tid and pid:
                    ticket_project[tid] = pid

            # project_id → user_id
            project_user: dict[str, str] = {p["id"]: p["user_id"] for p in projects if p.get("id") and p.get("user_id")}

            # 4) Reviews — agregar por user_id
            reviews_res = (
                self._client.table("reviews")
                .select("ticket_id, aprobado, calificacion")
                .execute()
            )
            reviews = reviews_res.data or []

            scores: dict[str, int] = {}
            approved_counts: dict[str, int] = {}
            for r in reviews:
                tid = r.get("ticket_id")
                pid = ticket_project.get(tid)
                uid = project_user.get(pid) if pid else None
                if not uid:
                    continue
                if r.get("aprobado"):
                    cal = r.get("calificacion")
                    score_delta = int(cal) if cal is not None else 0
                    scores[uid] = scores.get(uid, 0) + score_delta
                    approved_counts[uid] = approved_counts.get(uid, 0) + 1

            # completed tickets por user
            completed_counts: dict[str, int] = {}
            for t in tickets:
                if t.get("estado") != "done":
                    continue
                pid = t.get("project_id")
                uid = project_user.get(pid) if pid else None
                if uid:
                    completed_counts[uid] = completed_counts.get(uid, 0) + 1

            # 5) Construir entries solo para users con al menos un proyecto
            entries = []
            for u in users:
                uid = u["id"]
                if uid not in user_projects:
                    continue
                entries.append({
                    "user_id": uid,
                    "display_name": self._display_name(u),
                    "score": scores.get(uid, 0),
                    "approved_reviews_count": approved_counts.get(uid, 0),
                    "completed_tickets_count": completed_counts.get(uid, 0),
                    # Campos auxiliares para desempate determinista:
                    "_created_at": u.get("created_at") or "",
                })

            # 6) Ordenamiento determinista (Req 2.1-2.5, 4.4)
            entries.sort(
                key=lambda e: (
                    -e["score"],
                    -e["approved_reviews_count"],
                    e["_created_at"],
                    e["user_id"],
                )
            )

            # 7) Asignar position 1-based y limpiar campos internos
            for i, e in enumerate(entries, start=1):
                e["position"] = i
                e.pop("_created_at", None)

            return entries

        except Exception as e:
            logger.error(f"Error building leaderboard: {e}")
            raise DBServiceError("No se pudo generar el ranking")

    # ---------------------------------------------------------------
    # USER AVATAR
    # ---------------------------------------------------------------

    async def update_user_avatar(self, user_id: str, avatar_url: str) -> dict:
        """Update user's avatar URL. Returns updated user data."""
        try:
            result = (
                self._client.table("users")
                .update({"avatar_url": avatar_url})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
            return result.data[0]
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error updating avatar for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar el avatar")

    async def delete_user_avatar(self, user_id: str) -> None:
        """Remove user's avatar URL (set to NULL)."""
        try:
            result = (
                self._client.table("users")
                .update({"avatar_url": None})
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error deleting avatar for {user_id}: {e}")
            raise DBServiceError("No se pudo eliminar el avatar")

    # ---------------------------------------------------------------
    # XP, LEVEL & STREAK
    # ---------------------------------------------------------------

    # Level thresholds: level N requires XP_THRESHOLDS[N-1] total XP
    _XP_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4500, 5700]

    @staticmethod
    def calculate_level(xp: int) -> int:
        """Calculate level from total XP using the threshold curve."""
        level = 1
        for i, threshold in enumerate(DBService._XP_THRESHOLDS):
            if xp >= threshold:
                level = i + 1
            else:
                break
        return level

    @staticmethod
    def xp_for_next_level(xp: int, current_level: int) -> int:
        """Return XP needed to reach next level. 0 if max level."""
        if current_level >= len(DBService._XP_THRESHOLDS):
            return 0
        return DBService._XP_THRESHOLDS[current_level] - xp

    @staticmethod
    def xp_progress_in_level(xp: int, current_level: int) -> tuple[int, int]:
        """Return (current_xp_in_level, total_xp_needed_for_level)."""
        if current_level <= 1:
            start = 0
        else:
            start = DBService._XP_THRESHOLDS[current_level - 1]

        if current_level >= len(DBService._XP_THRESHOLDS):
            return (0, 1)  # max level

        end = DBService._XP_THRESHOLDS[current_level]
        return (xp - start, end - start)

    async def award_xp_and_update_streak(self, user_id: str, xp_earned: int) -> dict:
        """
        Awards XP to a user, recalculates level, and updates streak.
        Called when a review is approved.

        Returns updated user data with xp, level, current_streak.
        """
        from datetime import date, timedelta

        try:
            # Get current user data
            user_res = (
                self._client.table("users")
                .select("xp, level, current_streak, last_active_date")
                .eq("id", user_id)
                .execute()
            )
            if not user_res.data:
                raise DBServiceError("Usuario no encontrado")

            user = user_res.data[0]
            current_xp = user.get("xp") or 0
            current_streak = user.get("current_streak") or 0
            last_active = user.get("last_active_date")

            # Calculate new XP and level
            new_xp = current_xp + xp_earned
            new_level = self.calculate_level(new_xp)

            # Calculate streak
            today = date.today()
            if last_active:
                # Parse date string from DB
                if isinstance(last_active, str):
                    last_active_date = date.fromisoformat(last_active)
                else:
                    last_active_date = last_active

                if last_active_date == today:
                    # Already active today, don't change streak
                    new_streak = current_streak
                elif last_active_date == today - timedelta(days=1):
                    # Yesterday — increment streak
                    new_streak = current_streak + 1
                else:
                    # More than 1 day gap — reset to 1
                    new_streak = 1
            else:
                # First activity ever
                new_streak = 1

            # Update in DB
            result = (
                self._client.table("users")
                .update({
                    "xp": new_xp,
                    "level": new_level,
                    "current_streak": new_streak,
                    "last_active_date": today.isoformat(),
                })
                .eq("id", user_id)
                .execute()
            )

            if not result.data:
                raise DBServiceError("No se pudo actualizar XP/streak")

            return result.data[0]

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error awarding XP for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar XP/streak")

    async def get_user_xp_data(self, user_id: str) -> dict:
        """Get user's XP, level, and streak data."""
        try:
            result = (
                self._client.table("users")
                .select("xp, level, current_streak, last_active_date")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return {"xp": 0, "level": 1, "current_streak": 0, "last_active_date": None}
            return result.data[0]
        except Exception:
            return {"xp": 0, "level": 1, "current_streak": 0, "last_active_date": None}

    # ---------------------------------------------------------------
    # ACHIEVEMENTS / BADGES
    # ---------------------------------------------------------------

    async def get_all_achievements(self) -> list[dict]:
        """Get the full achievement catalog ordered by sort_order."""
        try:
            result = (
                self._client.table("achievements")
                .select("*")
                .order("sort_order")
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching achievements catalog: {e}")
            return []

    async def get_user_achievements(self, user_id: str) -> list[dict]:
        """Get achievements unlocked by a specific user."""
        try:
            result = (
                self._client.table("user_achievements")
                .select("achievement_id, unlocked_at")
                .eq("user_id", user_id)
                .order("unlocked_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching user achievements for {user_id}: {e}")
            return []

    async def unlock_achievement(self, user_id: str, achievement_id: str) -> bool:
        """Unlock an achievement for a user. Returns True if newly unlocked, False if already had it."""
        try:
            # Check if already unlocked
            check = (
                self._client.table("user_achievements")
                .select("id")
                .eq("user_id", user_id)
                .eq("achievement_id", achievement_id)
                .execute()
            )
            if check.data:
                return False  # Already unlocked

            # Unlock it
            self._client.table("user_achievements").insert({
                "user_id": user_id,
                "achievement_id": achievement_id,
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error unlocking achievement {achievement_id} for {user_id}: {e}")
            return False

    async def evaluate_achievements(self, user_id: str) -> list[str]:
        """
        Evaluate all achievement conditions for a user and unlock any newly earned ones.
        Returns a list of achievement_ids that were NEWLY unlocked in this call.
        
        Called after approving a review / awarding XP.
        """
        newly_unlocked: list[str] = []

        try:
            # Get user data
            user_res = (
                self._client.table("users")
                .select("xp, level, current_streak")
                .eq("id", user_id)
                .execute()
            )
            if not user_res.data:
                return []
            user = user_res.data[0]

            # Get already unlocked
            existing = await self.get_user_achievements(user_id)
            unlocked_ids = {a["achievement_id"] for a in existing}

            # Get user's project count
            projects_res = (
                self._client.table("projects")
                .select("id")
                .eq("user_id", user_id)
                .execute()
            )
            project_count = len(projects_res.data or [])

            # Get completed tickets count
            project_ids = [p["id"] for p in (projects_res.data or [])]
            completed_tickets = 0
            if project_ids:
                tickets_res = (
                    self._client.table("tickets")
                    .select("id, estado")
                    .in_("project_id", project_ids)
                    .execute()
                )
                completed_tickets = sum(1 for t in (tickets_res.data or []) if t.get("estado") == "done")

            # Get approved reviews count and max calificacion
            approved_count = 0
            max_score = 0
            if project_ids:
                tickets_res_full = (
                    self._client.table("tickets")
                    .select("id")
                    .in_("project_id", project_ids)
                    .execute()
                )
                ticket_ids = [t["id"] for t in (tickets_res_full.data or [])]
                if ticket_ids:
                    reviews_res = (
                        self._client.table("reviews")
                        .select("aprobado, calificacion")
                        .in_("ticket_id", ticket_ids)
                        .execute()
                    )
                    for r in (reviews_res.data or []):
                        if r.get("aprobado"):
                            approved_count += 1
                            cal = r.get("calificacion") or 0
                            if cal > max_score:
                                max_score = cal

            # --- Evaluate each achievement ---

            # first_blood: at least 1 approved review
            if "first_blood" not in unlocked_ids and approved_count >= 1:
                if await self.unlock_achievement(user_id, "first_blood"):
                    newly_unlocked.append("first_blood")

            # streak_3: current_streak >= 3
            if "streak_3" not in unlocked_ids and (user.get("current_streak") or 0) >= 3:
                if await self.unlock_achievement(user_id, "streak_3"):
                    newly_unlocked.append("streak_3")

            # streak_7: current_streak >= 7
            if "streak_7" not in unlocked_ids and (user.get("current_streak") or 0) >= 7:
                if await self.unlock_achievement(user_id, "streak_7"):
                    newly_unlocked.append("streak_7")

            # perfect_score: max calificacion == 100
            if "perfect_score" not in unlocked_ids and max_score >= 100:
                if await self.unlock_achievement(user_id, "perfect_score"):
                    newly_unlocked.append("perfect_score")

            # veteran: 10+ completed tickets
            if "veteran" not in unlocked_ids and completed_tickets >= 10:
                if await self.unlock_achievement(user_id, "veteran"):
                    newly_unlocked.append("veteran")

            # explorer: 5+ projects
            if "explorer" not in unlocked_ids and project_count >= 5:
                if await self.unlock_achievement(user_id, "explorer"):
                    newly_unlocked.append("explorer")

            # master: level >= 5
            if "master" not in unlocked_ids and (user.get("level") or 1) >= 5:
                if await self.unlock_achievement(user_id, "master"):
                    newly_unlocked.append("master")

            # legend: xp >= 1000
            if "legend" not in unlocked_ids and (user.get("xp") or 0) >= 1000:
                if await self.unlock_achievement(user_id, "legend"):
                    newly_unlocked.append("legend")

        except Exception as e:
            logger.error(f"Error evaluating achievements for {user_id}: {e}")

        return newly_unlocked

    # ---------------------------------------------------------------
    # PUBLIC PROFILES
    # ---------------------------------------------------------------

    async def update_user_profile_info(
        self, user_id: str, bio: str | None, linkedin_url: str | None, github_username: str | None
    ) -> dict:
        """Update user's bio and social links."""
        try:
            result = (
                self._client.table("users")
                .update({
                    "bio": bio,
                    "linkedin_url": linkedin_url,
                    "github_username": github_username,
                })
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                raise DBServiceError("Usuario no encontrado")
            user = result.data[0]
            user.pop("password", None)
            user.pop("gemini_api_key", None)
            return user
        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error updating profile info for {user_id}: {e}")
            raise DBServiceError("No se pudo actualizar el perfil")

    async def get_public_profile(self, user_id: str) -> dict:
        """
        Get a user's public profile — never includes email, password, or API keys.
        Includes: display name, avatar, bio, social links, level, XP, streak,
        achievements, and basic stats.
        """
        try:
            # User data
            user_res = (
                self._client.table("users")
                .select("id, full_name, alias, avatar_url, bio, linkedin_url, github_username, xp, level, current_streak, created_at")
                .eq("id", user_id)
                .execute()
            )
            if not user_res.data:
                raise DBServiceError("Usuario no encontrado")
            user = user_res.data[0]

            # Display name
            display_name = self._display_name(user)

            # Projects count
            projects_res = (
                self._client.table("projects")
                .select("id")
                .eq("user_id", user_id)
                .execute()
            )
            project_count = len(projects_res.data or [])

            # Completed tickets
            project_ids = [p["id"] for p in (projects_res.data or [])]
            completed_tickets = 0
            total_tickets = 0
            if project_ids:
                tickets_res = (
                    self._client.table("tickets")
                    .select("id, estado")
                    .in_("project_id", project_ids)
                    .execute()
                )
                total_tickets = len(tickets_res.data or [])
                completed_tickets = sum(1 for t in (tickets_res.data or []) if t.get("estado") == "done")

            # Approved reviews + avg score
            approved_count = 0
            avg_score = None
            if project_ids:
                ticket_ids = [t["id"] for t in (tickets_res.data or [])] if project_ids else []
                if ticket_ids:
                    reviews_res = (
                        self._client.table("reviews")
                        .select("aprobado, calificacion")
                        .in_("ticket_id", ticket_ids)
                        .execute()
                    )
                    scores = []
                    for r in (reviews_res.data or []):
                        if r.get("aprobado"):
                            approved_count += 1
                            if r.get("calificacion") is not None:
                                scores.append(r["calificacion"])
                    if scores:
                        avg_score = round(sum(scores) / len(scores), 1)

            # Achievements
            achievements = await self.get_user_achievements(user_id)
            all_achievements = await self.get_all_achievements()
            achievement_details = []
            unlocked_ids = {a["achievement_id"] for a in achievements}
            for ach in all_achievements:
                if ach["id"] in unlocked_ids:
                    achievement_details.append({
                        "id": ach["id"],
                        "title": ach["title"],
                        "icon": ach["icon"],
                    })

            return {
                "id": user["id"],
                "display_name": display_name,
                "avatar_url": user.get("avatar_url"),
                "bio": user.get("bio"),
                "linkedin_url": user.get("linkedin_url"),
                "github_username": user.get("github_username"),
                "level": user.get("level", 1),
                "xp": user.get("xp", 0),
                "current_streak": user.get("current_streak", 0),
                "member_since": user.get("created_at"),
                "stats": {
                    "projects": project_count,
                    "tickets_completed": completed_tickets,
                    "tickets_total": total_tickets,
                    "approved_reviews": approved_count,
                    "avg_score": avg_score,
                },
                "achievements": achievement_details,
                "is_own_profile": False,  # Overridden in the API layer
            }

        except DBServiceError:
            raise
        except Exception as e:
            logger.error(f"Error getting public profile for {user_id}: {e}")
            raise DBServiceError("No se pudo obtener el perfil")

    # ---------------------------------------------------------------
    # SKILL RADAR
    # ---------------------------------------------------------------

    async def get_user_skill_radar(self, user_id: str) -> list[dict]:
        """
        Calculate averaged skill scores from all approved reviews for a user.
        Returns a list of {dimension, score, max_score} for radar chart rendering.

        The 5 evaluation dimensions are:
        - Comprensión del problema
        - Justificación técnica
        - Conocimiento de alternativas
        - Conciencia de limitaciones
        - Claridad de comunicación
        """
        import json

        try:
            # Get all projects for this user
            projects_res = (
                self._client.table("projects")
                .select("id")
                .eq("user_id", user_id)
                .execute()
            )
            project_ids = [p["id"] for p in (projects_res.data or [])]
            if not project_ids:
                return []

            # Get all tickets
            tickets_res = (
                self._client.table("tickets")
                .select("id")
                .in_("project_id", project_ids)
                .execute()
            )
            ticket_ids = [t["id"] for t in (tickets_res.data or [])]
            if not ticket_ids:
                return []

            # Get all approved reviews with aspectos_evaluados
            reviews_res = (
                self._client.table("reviews")
                .select("aspectos_evaluados, aprobado")
                .in_("ticket_id", ticket_ids)
                .execute()
            )

            # Aggregate scores by dimension
            dimension_scores: dict[str, list[int]] = {}
            for r in (reviews_res.data or []):
                aspectos = r.get("aspectos_evaluados")
                if not aspectos:
                    continue
                # aspectos can be a JSON string or already parsed
                if isinstance(aspectos, str):
                    try:
                        aspectos = json.loads(aspectos)
                    except (json.JSONDecodeError, TypeError):
                        continue
                if not isinstance(aspectos, list):
                    continue

                for aspecto in aspectos:
                    dim = aspecto.get("dimension", "").strip()
                    puntaje = aspecto.get("puntaje")
                    if dim and puntaje is not None:
                        if dim not in dimension_scores:
                            dimension_scores[dim] = []
                        dimension_scores[dim].append(int(puntaje))

            if not dimension_scores:
                return []

            # Calculate averages
            result = []
            for dim, scores in dimension_scores.items():
                avg = round(sum(scores) / len(scores), 1)
                result.append({
                    "dimension": dim,
                    "score": avg,
                    "max_score": 20,
                    "count": len(scores),
                })

            return result

        except Exception as e:
            logger.error(f"Error calculating skill radar for {user_id}: {e}")
            return []
