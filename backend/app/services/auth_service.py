"""
Auth Service — Hashing de contraseñas, generación y verificación de JWT.

RESPONSABILIDADES:
    - hash_password: convierte contraseña en texto claro a bcrypt hash
    - verify_password: compara texto claro contra hash de forma segura
    - create_access_token: genera JWT firmado con el user_id como subject
    - decode_access_token: verifica firma y expiración, devuelve payload
    - get_current_user: dependencia de FastAPI que extrae y valida el usuario
      del header Authorization en cada request protegido

REGLAS DE SEGURIDAD:
    - Nunca loguear ni devolver contraseñas en texto claro
    - Mensajes de error de login siempre genéricos (no revelar si el email existe)
    - El JWT solo contiene user_id — los datos del usuario se consultan a la DB
"""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

logger = logging.getLogger(__name__)

# Contexto de bcrypt para hashear contraseñas
# bcrypt aplica un salt aleatorio automáticamente — dos hashes del mismo texto son distintos
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de seguridad para Swagger — lee el header "Authorization: Bearer <token>"
_bearer_scheme = HTTPBearer()


# ---------------------------------------------------------------
# HASHING DE CONTRASEÑAS
# ---------------------------------------------------------------


def hash_password(plain: str) -> str:
    """
    Convierte una contraseña en texto claro a un bcrypt hash.

    El hash incluye un salt aleatorio, por lo que dos llamadas con la misma
    contraseña producen hashes distintos — esto es correcto y esperado.

    NUNCA almacenar el valor de `plain` en logs o DB.
    """
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verifica si una contraseña en texto claro coincide con su hash bcrypt.

    Usa comparación de tiempo constante internamente para evitar timing attacks.
    """
    return _pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------
# JWT
# ---------------------------------------------------------------


def create_access_token(user_id: UUID) -> str:
    """
    Genera un JWT firmado con el user_id como subject.

    El token incluye:
        - sub: user_id como string (subject estándar de JWT)
        - exp: timestamp de expiración (ahora + JWT_EXPIRE_MINUTES)

    RETORNA:
        String del JWT firmado (ej: "eyJhbGci...")
    """
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodifica y verifica un JWT.

    RETORNA:
        Payload del token como dict (incluye "sub" con el user_id).

    LANZA:
        HTTPException 401 si el token es inválido, expirado o malformado.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------
# DEPENDENCIA DE FASTAPI
# ---------------------------------------------------------------


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """
    Dependencia de FastAPI que extrae el usuario autenticado del JWT.

    USO EN ENDPOINTS:
        @router.post("/projects")
        async def create_project(
            request: ProjectCreate,
            current_user: dict = Depends(get_current_user),
        ):
            user_id = current_user["id"]

    FLUJO:
        1. FastAPI extrae el token del header "Authorization: Bearer <token>"
        2. Decodifica el JWT y obtiene el user_id del claim "sub"
        3. Consulta la tabla users en Supabase para obtener el registro completo
        4. Devuelve el dict del usuario

    LANZA:
        HTTPException 401 si:
            - No hay header Authorization
            - El token es inválido o expirado
            - El user_id del token no existe en la DB
    """
    from app.services.db_service import DBService, DBServiceError
    from app.config import get_settings

    settings = get_settings()

    # Decodificar el token — lanza 401 si es inválido
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Consultar el usuario en la DB
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        user = await db.get_user_by_id(user_id)
    except DBServiceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
