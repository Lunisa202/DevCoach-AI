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

        Usado por el sidebar del frontend para mostrar el historial.
        """
        try:
            result = (
                self._client.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .order("fecha_analisis", desc=True)
                .execute()
            )

            return result.data or []

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
                .select("id, full_name, email, created_at, alias")
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
