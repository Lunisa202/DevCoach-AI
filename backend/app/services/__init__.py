"""
DevCoach AI — Services

Servicios auxiliares que el backend usa para comunicarse con APIs externas y la DB.
"""

from app.services.github_service import GitHubService

__all__ = [
    "GitHubService",
]
