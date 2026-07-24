"""
API Router — Auth endpoints.

ENDPOINTS:
    POST /api/auth/register  → crea usuario, devuelve JWT + datos
    POST /api/auth/login     → valida credenciales, devuelve JWT + datos

REGLAS DE SEGURIDAD:
    - Los mensajes de error de login son siempre genéricos para no revelar
      si un email existe o no en el sistema.
    - Las contraseñas nunca aparecen en logs ni en respuestas.
    - El JWT se genera con el user_id como subject — los datos del usuario
      se consultan a la DB en cada request protegido via get_current_user.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.auth_service import create_access_token, get_current_user, hash_password, verify_password
from app.services.db_service import DBService, DBServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
    responses={
        409: {"description": "El email ya está registrado"},
        422: {"description": "Datos inválidos (Pydantic)"},
    },
)
async def register(request: UserCreate):
    """
    Crea un nuevo usuario y devuelve un JWT listo para usar.

    FLUJO:
        1. Hashear la contraseña con bcrypt
        2. Guardar usuario en DB (falla con 409 si el email ya existe)
        3. Generar JWT con el user_id
        4. Devolver token + datos del usuario
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # Hashear contraseña — nunca guardar en texto claro
    hashed = hash_password(request.password)

    # Crear usuario en DB
    try:
        user = await db.create_user(
            full_name=request.full_name,
            email=request.email,
            hashed_password=hashed,
        )
    except DBServiceError as e:
        if "Email ya registrado" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )
        logger.error(f"Error en register: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el usuario",
        )

    # Generar JWT
    token = create_access_token(user["id"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            created_at=user["created_at"],
        ),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
    responses={
        401: {"description": "Credenciales incorrectas"},
    },
)
async def login(request: UserLogin):
    """
    Valida credenciales y devuelve un JWT.

    FLUJO:
        1. Buscar usuario por email
        2. Verificar contraseña contra el hash almacenado
        3. Generar JWT con el user_id
        4. Devolver token + datos del usuario

    NOTA SEGURIDAD:
        Si el email no existe O la contraseña es incorrecta, siempre se devuelve
        el mismo error 401 genérico — nunca revelar cuál de los dos falló.
    """
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # Mensaje genérico para ambos casos (email no existe + password incorrecto)
    CREDENTIALS_ERROR = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales incorrectas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Buscar usuario (incluye hash de password para verificación)
    try:
        user = await db.get_user_by_email(request.email)
    except DBServiceError:
        raise CREDENTIALS_ERROR

    if user is None:
        raise CREDENTIALS_ERROR

    # Verificar contraseña
    if not verify_password(request.password, user["password"]):
        raise CREDENTIALS_ERROR

    # Generar JWT
    token = create_access_token(user["id"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            created_at=user["created_at"],
        ),
    )


# ---------------------------------------------------------------
# PROFILE & SETTINGS ENDPOINTS
# ---------------------------------------------------------------


class ProfileUpdate(BaseModel):
    """Request body for updating user profile."""
    full_name: str = Field(min_length=2, max_length=100)


class PasswordUpdate(BaseModel):
    """Request body for changing password."""
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class ApiKeyUpdate(BaseModel):
    """Request body for saving user's own Gemini API key."""
    gemini_api_key: str = Field(min_length=10, max_length=200)


@router.put(
    "/profile",
    summary="Actualizar perfil de usuario",
    responses={401: {"description": "No autenticado"}},
)
async def update_profile(
    request: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Actualiza el nombre del usuario autenticado."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        updated = await db.update_user_profile(current_user["id"], full_name=request.full_name)
    except DBServiceError as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="No se pudo actualizar el perfil")

    return {
        "user": UserResponse(
            id=updated["id"],
            full_name=updated["full_name"],
            email=updated["email"],
            created_at=updated["created_at"],
        )
    }


@router.put(
    "/password",
    summary="Cambiar contraseña",
    responses={
        401: {"description": "Contraseña actual incorrecta"},
    },
)
async def update_password(
    request: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Cambia la contraseña del usuario autenticado."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    # Verify current password
    user_with_password = await db.get_user_by_email(current_user["email"])
    if not user_with_password or not verify_password(request.current_password, user_with_password["password"]):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    # Hash and save new password
    new_hash = hash_password(request.new_password)
    try:
        await db.update_user_password(current_user["id"], new_hash)
    except DBServiceError as e:
        logger.error(f"Error updating password: {e}")
        raise HTTPException(status_code=500, detail="No se pudo cambiar la contraseña")

    return {"message": "Contraseña actualizada"}


@router.get(
    "/api-key-status",
    summary="Verificar si el usuario tiene API key configurada",
)
async def api_key_status(current_user: dict = Depends(get_current_user)):
    """Devuelve si el usuario tiene una API key propia configurada."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    has_key = await db.user_has_api_key(current_user["id"])
    return {"has_key": has_key}


@router.put(
    "/api-key",
    summary="Guardar API key personal del usuario",
)
async def update_api_key(
    request: ApiKeyUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Guarda la API key personal de Gemini para el usuario."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        await db.save_user_api_key(current_user["id"], request.gemini_api_key)
    except DBServiceError as e:
        logger.error(f"Error saving API key: {e}")
        raise HTTPException(status_code=500, detail="No se pudo guardar la API key")

    return {"message": "API key guardada"}


@router.delete(
    "/api-key",
    summary="Eliminar API key personal del usuario",
)
async def delete_api_key(current_user: dict = Depends(get_current_user)):
    """Elimina la API key personal, volviendo a usar la del sistema."""
    settings = get_settings()
    db = DBService(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

    try:
        await db.delete_user_api_key(current_user["id"])
    except DBServiceError as e:
        logger.error(f"Error deleting API key: {e}")
        raise HTTPException(status_code=500, detail="No se pudo eliminar la API key")

    return {"message": "API key eliminada"}
