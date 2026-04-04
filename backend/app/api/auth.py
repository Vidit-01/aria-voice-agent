from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.dependencies import CurrentUser, get_current_user
from app.core.supabase_client import get_supabase_client
from app.models.auth import AuthResponse, LoginRequest, LogoutResponse, MeResponse, SignupRequest, TokenRefreshRequest


router = APIRouter()


def _map_supabase_auth_error(exc: Exception, default_status: int) -> HTTPException:
    msg = str(exc)
    lower = msg.lower()
    if 'email signups are disabled' in lower:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email signups are disabled in Supabase')
    if 'email logins are disabled' in lower:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email logins are disabled in Supabase')
    if 'invalid login credentials' in lower or 'invalid credentials' in lower:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    if 'email not confirmed' in lower:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email not confirmed')
    if 'invalid api key' in lower or 'apikey' in lower:
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Invalid Supabase API key')
    if 'provider' in lower and 'disabled' in lower:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email provider is disabled in Supabase')
    return HTTPException(status_code=default_status, detail='Supabase auth request failed')


@router.post('/signup', response_model=AuthResponse)
def signup(payload: SignupRequest, supabase: Client = Depends(get_supabase_client)) -> AuthResponse:
    try:
        auth_resp = supabase.auth.sign_up({'email': payload.email, 'password': payload.password})
    except Exception as exc:
        raise _map_supabase_auth_error(exc, status.HTTP_400_BAD_REQUEST) from exc
    user = auth_resp.user
    session = auth_resp.session
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Signup failed')

    supabase.table('profiles').upsert(
        {'id': user.id, 'email': payload.email, 'full_name': payload.full_name, 'role': payload.role.value}
    ).execute()

    if not session:
        # fallback for provider settings where session is not returned immediately
        try:
            login_resp = supabase.auth.sign_in_with_password({'email': payload.email, 'password': payload.password})
        except Exception as exc:
            raise _map_supabase_auth_error(exc, status.HTTP_400_BAD_REQUEST) from exc
        session = login_resp.session
        if not session:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Signup succeeded but login failed')

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=user.id,
        role=payload.role,
    )


@router.post('/login', response_model=AuthResponse)
def login(payload: LoginRequest, supabase: Client = Depends(get_supabase_client)) -> AuthResponse:
    try:
        auth_resp = supabase.auth.sign_in_with_password({'email': payload.email, 'password': payload.password})
    except Exception as exc:
        raise _map_supabase_auth_error(exc, status.HTTP_401_UNAUTHORIZED) from exc
    user = auth_resp.user
    session = auth_resp.session
    if not user or not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    profile = supabase.table('profiles').select('role').eq('id', user.id).limit(1).execute()
    role = profile.data[0]['role'] if profile.data else 'student'
    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=user.id,
        role=role,
    )


@router.post('/logout', response_model=LogoutResponse)
def logout(user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> LogoutResponse:
    _ = user
    try:
        supabase.auth.sign_out()
    except Exception:
        # Do not block logout UX for token/session invalidation failures.
        pass
    return LogoutResponse(message='Logged out successfully')


@router.post('/refresh')
def refresh_token(payload: TokenRefreshRequest, supabase: Client = Depends(get_supabase_client)) -> dict[str, str]:
    try:
        refreshed = supabase.auth.refresh_session(payload.refresh_token)
    except Exception as exc:
        raise _map_supabase_auth_error(exc, status.HTTP_401_UNAUTHORIZED) from exc
    if not refreshed.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')
    return {'access_token': refreshed.session.access_token, 'token_type': 'bearer'}


@router.get('/me', response_model=MeResponse)
def me(user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> MeResponse:
    profile = supabase.table('profiles').select('full_name').eq('id', user.user_id).limit(1).execute()
    full_name = profile.data[0].get('full_name') if profile.data else None
    return MeResponse(user_id=user.user_id, email=user.email, full_name=full_name, role=user.role)
