from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.dependencies import CurrentUser, get_current_user
from app.core.supabase_client import get_supabase_client
from app.models.auth import AuthResponse, LoginRequest, LogoutResponse, MeResponse, SignupRequest, TokenRefreshRequest


router = APIRouter()


@router.post('/signup', response_model=AuthResponse)
def signup(payload: SignupRequest, supabase: Client = Depends(get_supabase_client)) -> AuthResponse:
    auth_resp = supabase.auth.sign_up({'email': payload.email, 'password': payload.password})
    user = auth_resp.user
    session = auth_resp.session
    if not user or not session:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Signup failed')

    supabase.table('profiles').upsert(
        {'id': user.id, 'email': payload.email, 'full_name': payload.full_name, 'role': payload.role.value}
    ).execute()

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=user.id,
        role=payload.role,
    )


@router.post('/login', response_model=AuthResponse)
def login(payload: LoginRequest, supabase: Client = Depends(get_supabase_client)) -> AuthResponse:
    auth_resp = supabase.auth.sign_in_with_password({'email': payload.email, 'password': payload.password})
    user = auth_resp.user
    session = auth_resp.session
    if not user or not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    profile = supabase.table('profiles').select('role').eq('id', user.id).limit(1).execute()
    role = profile.data[0]['role'] if profile.data else 'student'
    return AuthResponse(access_token=session.access_token, refresh_token=session.refresh_token, user_id=user.id, role=role)


@router.post('/logout', response_model=LogoutResponse)
def logout(user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> LogoutResponse:
    supabase.auth.sign_out()
    return LogoutResponse(message='Logged out successfully')


@router.post('/refresh')
def refresh_token(payload: TokenRefreshRequest, supabase: Client = Depends(get_supabase_client)) -> dict[str, str]:
    refreshed = supabase.auth.refresh_session(payload.refresh_token)
    if not refreshed.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')
    return {'access_token': refreshed.session.access_token, 'token_type': 'bearer'}


@router.get('/me', response_model=MeResponse)
def me(user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> MeResponse:
    profile = supabase.table('profiles').select('full_name').eq('id', user.user_id).limit(1).execute()
    full_name = profile.data[0].get('full_name') if profile.data else None
    return MeResponse(user_id=user.user_id, email=user.email, full_name=full_name, role=user.role)
