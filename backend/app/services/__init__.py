"""
DevCoach AI — Services

Servicios auxiliares que el backend usa para comunicarse con APIs externas y la DB.
"""

from app.services.db_service import DBService, DBServiceError, RecordNotFoundError

__all__ = [
    "DBService",
    "DBServiceError",
    "RecordNotFoundError",
]
