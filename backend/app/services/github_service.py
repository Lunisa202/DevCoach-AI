"""
GitHub Service — Comunicación con la API pública de GitHub.

LÓGICA DE NEGOCIO:
    Este servicio encapsula TODA la comunicación con GitHub. El resto del backend
    (endpoints, pipeline de IA) nunca habla directo con GitHub — siempre pasa por aquí.
    
    Esto permite:
    - Cambiar la forma de hablar con GitHub sin tocar el resto del código.
    - Tener un solo lugar donde manejar errores de red, timeouts y rate limiting.
    - Mockear fácilmente en tests (se reemplaza esta clase por un fake).

LÓGICA DE PROGRAMACIÓN:
    - Usa `httpx.AsyncClient` para hacer peticiones HTTP asíncronas (no bloquean el servidor).
    - Cada método tiene timeout de 10 segundos (si GitHub no responde, cortamos).
    - El token de GitHub se pasa como header `Authorization` para subir el rate limit.
    - Los errores se capturan y se transforman en excepciones propias (`GitHubServiceError`).

USO DESDE OTROS ARCHIVOS:
    from app.services.github_service import GitHubService

    github = GitHubService(token="ghp_...")
    is_valid = await github.validate_repo("owner", "repo")
    tree = await github.get_tree("owner", "repo")
    content = await github.get_file_content("owner", "repo", "src/main.py")
"""

import asyncio
import base64
import logging

import httpx

logger = logging.getLogger(__name__)

# ============================================================
# EXCEPCIONES PERSONALIZADAS
# Permiten que los endpoints distingan entre tipos de error
# sin exponer detalles internos de la API de GitHub.
# ============================================================


class GitHubServiceError(Exception):
    """Error genérico del servicio de GitHub."""
    pass


class RepoNotFoundError(GitHubServiceError):
    """El repositorio no existe o no es público."""
    pass


class GitHubTimeoutError(GitHubServiceError):
    """GitHub no respondió dentro del tiempo límite (10s)."""
    pass


class RateLimitExceededError(GitHubServiceError):
    """Se excedió el límite de peticiones a la API de GitHub."""
    pass


# ============================================================
# SERVICIO PRINCIPAL
# ============================================================


class GitHubService:
    """
    Clase que encapsula la comunicación con la API REST de GitHub.
    
    PARÁMETROS:
        token (str): Personal Access Token de GitHub. Se usa para autenticar
                     las peticiones y subir el rate limit de 60 a 5000 req/hora.
    
    NOTA: Solo funciona con repos PÚBLICOS. No intenta acceder a repos privados.
    """

    # URL base de la API REST v3 de GitHub
    BASE_URL = "https://api.github.com"

    # Timeout global: 25 segundos para dar margen a diffs grandes.
    TIMEOUT = 25.0

    # Reintentos automáticos ante errores transitorios (timeout, 5xx).
    MAX_RETRIES = 3
    RETRY_BACKOFF = 1.5  # segundos base entre reintentos (exponencial)

    def __init__(self, token: str = ""):
        """
        Inicializa el servicio con el token de autenticación.
        
        El token se envía en cada petición como header 'Authorization'.
        Aunque para repos públicos no es estrictamente necesario,
        sin él solo se permiten 60 peticiones/hora (rate limit anónimo).
        Con token se suben a 5000/hora.
        
        Si token está vacío, se omite el header Authorization (funciona
        para repos públicos pero con rate limit bajo).
        """
        self._headers = {
            "Accept": "application/vnd.github.v3+json",  # Pide formato JSON v3
            "X-GitHub-Api-Version": "2022-11-28",        # Versión fija de la API
        }

        # Solo agregar Authorization si hay un token real
        if token:
            self._headers["Authorization"] = f"Bearer {token}"

    # ---------------------------------------------------------------
    # MÉTODO PRIVADO: _request
    # Todas las peticiones HTTP pasan por aquí. Centraliza:
    # - El timeout
    # - El manejo de errores HTTP (404, 403, 429)
    # - El logging de rate limit restante
    # ---------------------------------------------------------------

    async def _request(self, method: str, path: str) -> dict | list:
        """
        Hace una petición HTTP a la API de GitHub con reintentos automáticos.
        
        LÓGICA:
        1. Construye la URL completa (BASE_URL + path).
        2. Envía la petición con headers de autenticación.
        3. Si hay timeout o error 5xx → reintenta hasta MAX_RETRIES veces
           con backoff exponencial.
        4. Si GitHub responde 404 → lanza RepoNotFoundError (sin reintentar).
        5. Si responde 403/429 (rate limit) → lanza RateLimitExceededError (sin reintentar).
        6. Cualquier otro error HTTP → lanza GitHubServiceError genérico.
        7. Si todo bien → devuelve el JSON como diccionario o lista.
        """
        url = f"{self.BASE_URL}{path}"
        last_error: Exception | None = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=self._headers,
                    )

            except httpx.TimeoutException:
                last_error = GitHubTimeoutError(
                    f"GitHub no respondió en {self.TIMEOUT}s para: {path}"
                )
                logger.warning(
                    f"[GitHub] Timeout en intento {attempt}/{self.MAX_RETRIES} para {path}"
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_BACKOFF * attempt)
                    continue
                raise last_error

            except httpx.RequestError as e:
                last_error = GitHubServiceError(f"Error de conexión con GitHub: {e}")
                logger.warning(
                    f"[GitHub] Error de red en intento {attempt}/{self.MAX_RETRIES} para {path}: {e}"
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_BACKOFF * attempt)
                    continue
                raise last_error

            # --- Manejo de códigos HTTP de error ---

            if response.status_code == 404:
                raise RepoNotFoundError(f"No se encontró: {path}")

            if response.status_code in (403, 429):
                remaining = response.headers.get("X-RateLimit-Remaining", "?")
                raise RateLimitExceededError(
                    f"Rate limit excedido (remaining: {remaining}). "
                    f"Espera unos minutos o verifica tu GITHUB_TOKEN."
                )

            # Errores 5xx de GitHub → reintentar
            if response.status_code >= 500:
                last_error = GitHubServiceError(
                    f"GitHub respondió con error {response.status_code} para: {path}"
                )
                logger.warning(
                    f"[GitHub] Error {response.status_code} en intento {attempt}/{self.MAX_RETRIES} para {path}"
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_BACKOFF * attempt)
                    continue
                raise last_error

            if response.status_code >= 400:
                raise GitHubServiceError(
                    f"GitHub respondió con error {response.status_code} para: {path}"
                )

            # Éxito
            logger.debug(f"[GitHub] OK {method} {path} (intento {attempt})")
            return response.json()

        # No debería llegar aquí, pero por seguridad:
        raise last_error or GitHubServiceError(f"Fallo inesperado para: {path}")

    # ---------------------------------------------------------------
    # MÉTODO PÚBLICO: validate_repo
    # ---------------------------------------------------------------

    async def validate_repo(self, owner: str, repo: str) -> bool:
        """
        Verifica que un repositorio existe y es público.
        
        LÓGICA DE NEGOCIO:
            El usuario ingresa una URL de GitHub en el frontend.
            Antes de hacer cualquier análisis, necesitamos confirmar que:
            1. El repo existe (no es un typo).
            2. Es público (no tenemos acceso a repos privados).
        
        RETORNA:
            True si el repo existe y es público.
        
        LANZA:
            RepoNotFoundError si no existe o es privado.
            GitHubTimeoutError si GitHub no responde.
        """
        # GET /repos/{owner}/{repo} devuelve la metadata del repo
        # Si es privado y no tenemos acceso, GitHub responde 404
        data = await self._request("GET", f"/repos/{owner}/{repo}")

        # Verificación extra: aunque respondió 200, confirmamos que no es privado
        # (en teoría con un token con permisos podría ver repos privados)
        if data.get("private", False):
            raise RepoNotFoundError(
                f"El repositorio {owner}/{repo} es privado."
            )

        return True

    # ---------------------------------------------------------------
    # MÉTODO PÚBLICO: get_tree
    # ---------------------------------------------------------------

    async def get_tree(self, owner: str, repo: str) -> list[dict]:
        """
        Obtiene la estructura de archivos/carpetas del repositorio.
        
        LÓGICA DE NEGOCIO:
            Después de validar el repo, el frontend muestra un selector de archivos
            (componente FileSelector de Carolina). Para eso necesita saber qué
            archivos y carpetas tiene el repo.
        
        CÓMO FUNCIONA:
            Usa el endpoint de "Git Trees" con `recursive=1` que devuelve
            TODOS los archivos del repo en una sola petición (eficiente).
            Luego filtramos para quedarnos solo con archivos (type="blob"),
            no carpetas (type="tree"), porque al frontend le interesan los archivos.
        
        RETORNA:
            Lista de diccionarios, cada uno con:
            - "path": ruta relativa del archivo (ej: "src/main.py")
            - "size": tamaño en bytes
            - "type": siempre "blob" (archivo)
        """
        # Primero obtenemos la rama por defecto para saber qué árbol pedir
        default_branch = await self.get_default_branch(owner, repo)

        # GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
        # Devuelve todo el árbol de archivos del repo en una sola llamada
        data = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        )

        tree = data.get("tree", [])

        # Filtramos: solo archivos (blob), no carpetas (tree)
        # y devolvemos solo los campos que el frontend necesita
        files = [
            {
                "path": item["path"],
                "size": item.get("size", 0),
                "type": item["type"],
            }
            for item in tree
            if item["type"] == "blob"
        ]

        return files

    # ---------------------------------------------------------------
    # MÉTODO PÚBLICO: get_file_content
    # ---------------------------------------------------------------

    async def get_file_content(self, owner: str, repo: str, file_path: str) -> str:
        """
        Obtiene el contenido de un archivo específico del repositorio.
        
        LÓGICA DE NEGOCIO:
            Una vez que el usuario selecciona archivos para analizar,
            necesitamos descargar el contenido de cada uno para pasárselo
            al Code_Reviewer (agente de IA de Génesis).
        
        DETALLE TÉCNICO:
            GitHub devuelve el contenido en Base64 (una codificación que
            convierte datos binarios a texto). Nosotros lo decodificamos
            para obtener el código fuente como texto legible.
        
        PARÁMETROS:
            file_path: ruta relativa dentro del repo (ej: "src/main.py")
        
        RETORNA:
            El contenido del archivo como string de texto.
        
        LIMITACIÓN:
            La API de contents tiene un límite de 1MB por archivo.
            Archivos más grandes devuelven error (el frontend ya filtra esto).
        """
        # GET /repos/{owner}/{repo}/contents/{path}
        data = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/contents/{file_path}"
        )

        # El contenido viene en Base64, lo decodificamos a texto
        content_b64 = data.get("content", "")

        # GitHub a veces mete saltos de línea en el Base64, los quitamos
        content_b64_clean = content_b64.replace("\n", "")

        # Decodificamos: Base64 → bytes → texto UTF-8
        content_bytes = base64.b64decode(content_b64_clean)
        return content_bytes.decode("utf-8")

    # ---------------------------------------------------------------
    # MÉTODO PÚBLICO: get_default_branch
    # ---------------------------------------------------------------

    async def get_default_branch(self, owner: str, repo: str) -> str:
        """
        Averigua cuál es la rama principal del repositorio.
        
        LÓGICA DE NEGOCIO:
            No todos los repos usan "main" — algunos usan "master", "develop",
            u otro nombre. Necesitamos saber cuál es la rama por defecto para:
            1. Pedir el árbol de archivos correcto.
            2. Pedir el último commit de la rama correcta.
        
        RETORNA:
            El nombre de la rama por defecto (ej: "main", "master").
        """
        data = await self._request("GET", f"/repos/{owner}/{repo}")
        return data.get("default_branch", "main")

    # ---------------------------------------------------------------
    # MÉTODO PÚBLICO: get_last_commit
    # ---------------------------------------------------------------

    async def get_last_commit(self, owner: str, repo: str) -> dict:
        """
        Obtiene el último commit de la rama principal, incluyendo su diff.
        
        LÓGICA DE NEGOCIO:
            Cuando el usuario dice "ya resolví este ticket" y pide verificación,
            necesitamos:
            1. Ver cuál fue el último commit (para obtener el diff).
            2. Verificar si los archivos cambiados coinciden con los del proyecto.
            3. Pasar el diff al Tech_Lead para que genere preguntas relevantes.
        
        RETORNA:
            Diccionario con:
            - "sha": hash del commit
            - "message": mensaje del commit
            - "files": lista de archivos modificados, cada uno con:
                - "filename": ruta del archivo
                - "status": "added", "modified", "removed"
                - "patch": el diff (líneas agregadas/borradas)
        """
        # Paso 1: obtener la rama por defecto
        default_branch = await self.get_default_branch(owner, repo)

        # Paso 2: pedir los commits de esa rama (solo el más reciente)
        # GET /repos/{owner}/{repo}/commits?sha={branch}&per_page=1
        commits = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/commits?sha={default_branch}&per_page=1"
        )

        if not commits:
            raise GitHubServiceError(
                f"No se encontraron commits en la rama '{default_branch}'"
            )

        commit_sha = commits[0]["sha"]

        # Paso 3: pedir el detalle del commit (incluye diff/patch por archivo)
        # GET /repos/{owner}/{repo}/commits/{sha}
        commit_detail = await self._request(
            "GET",
            f"/repos/{owner}/{repo}/commits/{commit_sha}"
        )

        # Extraemos solo lo que necesitamos
        files = [
            {
                "filename": f.get("filename", ""),
                "status": f.get("status", ""),
                "patch": f.get("patch", ""),  # El diff de ese archivo
            }
            for f in commit_detail.get("files", [])
        ]

        return {
            "sha": commit_sha,
            "message": commit_detail.get("commit", {}).get("message", ""),
            "date": commit_detail.get("commit", {}).get("author", {}).get("date", ""),
            "files": files,
        }
