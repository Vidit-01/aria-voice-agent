from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Role(str, Enum):
    student = 'student'
    admin = 'admin'


class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    role: Role = Role.student


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    refresh_token: str | None = None
    user_id: str
    role: Role


class LogoutResponse(BaseModel):
    message: str


class MeResponse(BaseModel):
    user_id: str
    email: str | None
    full_name: str | None = None
    role: Role
