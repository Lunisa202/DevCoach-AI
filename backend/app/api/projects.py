"""
API Router — Projects endpoints.

LÓGICA DE NEGOCIO:
    Este archivo maneja los endpoints relacionados con "proyectos":
    - validate-repo: confirma que una URL de GitHub es un repo público válido
    - create project: (TODO) orquesta todo el pipeline de análisis

LÓGICA DE PROGRAMACIÓN:
    - Usa FastAPI Router para agrupar estos endpoints bajo el prefijo /api/projects
    - Importa GitHubService para la comunicación con GitHub
    - Importa modelos Pydantic para validar request/response automáticamente
    - Maneja excepciones del GitHubService y las traduce a respuestas HTTP apropiadas
"""

import re
import logging

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.project import ValidateRepoRequest, ValidateRepoResponse
from app.services.github_service import (
    GitHubService,
    RepoNotFoundError,
    GitHubTimeoutError,
    RateLimitExceededError,
    GitHubServiceError,
)

logger = logging.getLogger(__name__)

# Router agrupa estos endpoints — se registra en main.py con prefijo /api/projects
router = APIRouter(prefix="/api/projects", tags=["Projects"])

# ============================================================
# REGEX para validar formato de URL de GitHub
# ============================================================
# Acepta: https://github.com/owner/repo
# Acepta: https://github.com/owner/repo/ (con slash final)
# Rechaza: http://... (solo HTTPS)
# Rechaza: github.com/... (falta https://)
# Rechaza: https://github.com/owner (falta repo)
# ============================================================

GITHUB_REPO_PATTERN = re.compile(
    r"^https://github\.com/([a-zA-Z0-9\-_.]+)/([a-zA-Z0-9\-_.]+)/?$"
)


def parse_github_url(url: str) -> tuple[str, str] | None:
    """
    Extrae owner y repo de una URL de GitHub.

    Ejemplos:
        "https://github.com/Lunisa202/DevCoach-AI" → ("Lunisa202", "DevCoach-AI")
        "https://github.com/owner/repo/"           → ("owner", "repo")
        "http://github.com/owner/repo"             → None (no es HTTPS)
        "https://github.com/solo-owner"            → None (falta repo)

    RETORNA:
        Tupla (owner, repo) si es válida, None si no.
    """
    match = GITHUB_REPO_PATTERN.match(url.strip())
    if not match:
        return None
    return match.group(1), match.group(2)


# ============================================================
# ENDPOINT: POST /api/projects/validate-repo
# ============================================================


@router.post(
    "/validate-repo",
    response_model=ValidateRepoResponse,
    summary="Validar URL de repositorio GitHub",
    responses={
        400: {"description": "Formato de URL inválido"},
        404: {"description": "Repositorio no encontrado o no es público"},
        503: {"description": "No se pudo conectar con GitHub"},
    },
)
async def validate_repo(request: ValidateRepoRequest):
    """
    Valida que una URL de GitHub apunta a un repositorio público existente.

    FLUJO:
    1. Recibe la URL del frontend (componente RepoInput de Carolina).
    2. Valida el FORMATO con regex — si no cumple, responde 400 inmediatamente
       (sin gastar una petición a GitHub).
    3. Si el formato es válido, llama a GitHub API para confirmar que el repo
       existe y es público.
    4. Devuelve owner y repo separados (el frontend los necesita para el siguiente paso).

    CÓDIGOS DE RESPUESTA:
        200: Repo válido → { valid: true, owner: "...", repo: "..." }
        400: Formato de URL no es https://github.com/owner/repo
        404: El repo no existe o es privado
        503: GitHub no respondió en 10 segundos o error de red

    CAROLINA LO LLAMA ASÍ (desde el frontend):
        fetch("/api/projects/validate-repo", {
            method: "POST",
            body: JSON.stringify({ repo_url: "https://github.com/user/repo" })
        })
    """

    # --- Paso 1: Validar formato con regex ---
    parsed = parse_github_url(request.repo_url)

    if parsed is None:
        raise HTTPException(
            status_code=400,
            detail="Formato de URL inválido. Debe ser: https://github.com/owner/repo"
        )

    owner, repo = parsed

    # --- Paso 2: Verificar contra GitHub API ---
    settings = get_settings()
    github = GitHubService(token=settings.GITHUB_TOKEN)

    try:
        await github.validate_repo(owner, repo)
    except RepoNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Repositorio no encontrado o no es público"
        )
    except GitHubTimeoutError:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con GitHub. Intenta de nuevo en unos segundos."
        )
    except RateLimitExceededError:
        raise HTTPException(
            status_code=503,
            detail="Se excedió el límite de peticiones a GitHub. Intenta en unos minutos."
        )
    except GitHubServiceError as e:
        # Error genérico de GitHub — loguear pero no exponer detalles
        logger.error(f"GitHub service error in validate-repo: {e}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con GitHub"
        )

    # --- Paso 3: Éxito — devolver owner y repo ---
    return ValidateRepoResponse(valid=True, owner=owner, repo=repo)
