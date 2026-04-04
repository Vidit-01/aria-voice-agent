from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from supabase import Client
from supabase_auth.errors import AuthApiError

from app.core.supabase_client import get_supabase_client


@dataclass
class CurrentUser:
    user_id: str
    email: str | None
    role: str


def _extract_bearer(auth_header: str | None) -> str:
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing authorization header')
    if not auth_header.lower().startswith('bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid authorization format')
    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    return token


def _resolve_user(token: str, supabase: Client) -> CurrentUser:
    try:
        auth_resp = supabase.auth.get_user(token)
    except AuthApiError as exc:
        # Normalize Supabase auth failures (expired/invalid JWT) into 401.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token') from exc
    user = auth_resp.user
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token')
    profile_resp = supabase.table('profiles').select('id,email,role').eq('id', user.id).limit(1).execute()
    if not profile_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Profile not found')
    profile = profile_resp.data[0]
    return CurrentUser(user_id=profile['id'], email=profile.get('email'), role=profile.get('role', 'student'))


def get_current_user(
    authorization: str | None = Header(default=None),
    supabase: Client = Depends(get_supabase_client),
) -> CurrentUser:
    token = _extract_bearer(authorization)
    return _resolve_user(token, supabase)


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin role required')
    return user


def require_ownership_or_admin(user: CurrentUser, target_user_id: str) -> None:
    if user.role != 'admin' and user.user_id != target_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed to access this resource')
