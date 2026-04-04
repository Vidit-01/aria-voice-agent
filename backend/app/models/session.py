from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    created = 'created'
    active = 'active'
    ended = 'ended'
    failed = 'failed'


class SessionCreateRequest(BaseModel):
    user_id: str
    preferred_language: str = 'auto'


class SessionCreateResponse(BaseModel):
    session_id: str
    user_id: str
    status: SessionStatus
    webrtc_config: dict[str, Any]
    created_at: str


class SessionMetadataResponse(BaseModel):
    session_id: str
    user_id: str
    status: SessionStatus
    language_detected: str | None = None
    started_at: str | None = None
    duration_seconds: int | None = None


class SessionStatusResponse(BaseModel):
    status: SessionStatus


class SessionEndResponse(BaseModel):
    message: str
    session_id: str
    status: SessionStatus
