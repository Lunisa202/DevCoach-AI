"""Pydantic models for Project entity."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    """Request body for creating a new project."""
    repo_url: str = Field(max_length=2048, description="URL del repositorio GitHub público")
    archivos_seleccionados: list[str] = Field(
        min_length=1,
        max_length=50,
        description="Lista de rutas de archivos seleccionados (1 a 50)"
    )


class ProjectResponse(BaseModel):
    """Response body for a project."""
    id: UUID
    repo_url: str
    archivos_seleccionados: list[str]
    fecha_analisis: datetime

    class Config:
        from_attributes = True


class ValidateRepoRequest(BaseModel):
    """Request body for validating a repo URL."""
    repo_url: str = Field(max_length=2048)


class ValidateRepoResponse(BaseModel):
    """Response body for repo validation."""
    valid: bool
    owner: str | None = None
    repo: str | None = None
