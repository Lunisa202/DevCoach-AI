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

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.models.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.auth_service import create_access_token, hash_password, verify_password
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
