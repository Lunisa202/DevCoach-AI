"""Pydantic models for User entity and auth responses."""

from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    """Request body for registering a new user."""
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Request body for logging in."""
    email: EmailStr
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    """Public user data returned in API responses — never includes password."""
    id: UUID
    full_name: str
    email: str
    created_at: datetime
    alias: str | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response returned after successful login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
