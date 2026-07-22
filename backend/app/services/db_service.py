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

    async def create_project(self, repo_url: str, archivos_seleccionados: list[str]) -> dict:
        """
        Crea un nuevo proyecto en la DB.

        LÓGICA DE NEGOCIO:
            Cuando el usuario elige un repo y selecciona archivos, se crea un
            "proyecto" que agrupa ese análisis. Los tickets se asocian a este proyecto.

        PARÁMETROS:
            repo_url: URL del repositorio (ya validada por el endpoint)
            archivos_seleccionados: lista de rutas de archivos elegidos por el usuario

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
    ) -> dict:
        """
        Guarda una review (resultado de la entrevista) en la DB.

        LÓGICA DE NEGOCIO:
            Después de que el Evaluator califica las respuestas del usuario,
            guardamos todo el registro: las preguntas que se hicieron, lo que
            respondió el usuario, el feedback de la IA, y si fue aprobado o no.

            Esto permite:
            - Historial de intentos (un ticket puede tener varias reviews si no aprueba)
            - Transparencia (el usuario ve el feedback detallado)

        PARÁMETROS:
            ticket_id: UUID del ticket evaluado
            preguntas: las 2-3 preguntas que generó el Tech_Lead
            respuestas: texto con las respuestas del usuario (concatenadas)
            feedback: texto del Evaluator explicando su decisión
            aprobado: True si el usuario demostró comprensión, False si no

        RETORNA:
            Diccionario con la review creada.
        """
        try:
            result = (
                self._client.table("reviews")
                .insert({
                    "ticket_id": str(ticket_id),
                    "preguntas_generadas": preguntas,
                    "respuesta_usuario": respuestas,
                    "feedback_evaluator": feedback,
                    "aprobado": aprobado,
                })
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
