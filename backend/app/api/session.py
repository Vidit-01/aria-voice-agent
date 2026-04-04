from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from supabase import Client

from app.core.dependencies import CurrentUser, get_current_user
from app.core.supabase_client import get_supabase_client
from app.models.session import (
    SessionCreateRequest,
    SessionCreateResponse,
    SessionEndResponse,
    SessionMetadataResponse,
    SessionStatus,
    SessionStatusResponse,
)
from app.services.report_generator import generate_and_store_report


router = APIRouter()


def _ensure_student_scope(user: CurrentUser, user_id: str) -> None:
    if user.role != 'admin' and user.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')


@router.post('/create', response_model=SessionCreateResponse)
def create_session(
    payload: SessionCreateRequest,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SessionCreateResponse:
    _ensure_student_scope(user, payload.user_id)
    session_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    supabase.table('sessions').insert(
        {'id': session_id, 'user_id': payload.user_id, 'status': SessionStatus.created.value, 'created_at': now}
    ).execute()
    return SessionCreateResponse(
        session_id=session_id,
        user_id=payload.user_id,
        status=SessionStatus.created,
        webrtc_config={
            'ice_servers': [
                {'urls': 'stun:stun.l.google.com:19302'},
                {'urls': 'stun:stun1.l.google.com:19302'},
            ]
        },
        created_at=now,
    )


@router.get('/{session_id}', response_model=SessionMetadataResponse)
def get_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SessionMetadataResponse:
    resp = supabase.table('sessions').select('*').eq('id', session_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    row = resp.data[0]
    _ensure_student_scope(user, row['user_id'])
    return SessionMetadataResponse(
        session_id=row['id'],
        user_id=row['user_id'],
        status=row['status'],
        language_detected=row.get('language_detected'),
        started_at=row.get('started_at'),
        duration_seconds=row.get('duration_seconds'),
    )


@router.get('/{session_id}/status', response_model=SessionStatusResponse)
def get_session_status(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SessionStatusResponse:
    row = get_session(session_id, user, supabase)
    return SessionStatusResponse(status=row.status)


@router.post('/{session_id}/end', response_model=SessionEndResponse)
def end_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SessionEndResponse:
    _ = get_session(session_id, user, supabase)
    supabase.table('sessions').update({'status': SessionStatus.ended.value}).eq('id', session_id).execute()
    background_tasks.add_task(generate_and_store_report, session_id, supabase)
    return SessionEndResponse(
        message='Session ended. Report generation in progress.',
        session_id=session_id,
        status=SessionStatus.ended,
    )
