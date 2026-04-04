import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
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
from app.services.gemini_live import gemini_live_relay
from app.services.report_generator import generate_and_store_report
from app.services.session_context import session_context_store
from app.services.webrtc_signal import webrtc_signal_service


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
    supabase.table('sessions').insert({'id': session_id, 'user_id': payload.user_id, 'status': 'created', 'created_at': now}).execute()

    profile_resp = supabase.table('profiles').select('*').eq('id', payload.user_id).limit(1).execute()
    pre_resp = (
        supabase.table('pre_analyses').select('*').eq('user_id', payload.user_id).order('generated_at', desc=True).limit(1).execute()
    )
    profile = profile_resp.data[0] if profile_resp.data else {}
    pre = pre_resp.data[0] if pre_resp.data else {}

    session_context_store.create(
        session_id,
        {
            'session_id': session_id,
            'user_id': payload.user_id,
            'language_detected': None,
            'started_at': datetime.now(timezone.utc),
            'intent_signals': [],
            'financial_signals': [],
            'timeline_signals': [],
            'concerns_raised': [],
            'emotional_cues': [],
            'universities_mentioned': [],
            'courses_mentioned': [],
            'turn_count': 0,
            'profile_json': profile,
            'pre_analysis': pre,
        },
    )

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
def get_session(session_id: str, user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> SessionMetadataResponse:
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
def get_session_status(session_id: str, user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> SessionStatusResponse:
    row = get_session(session_id, user, supabase)
    return SessionStatusResponse(status=row.status)


@router.post('/{session_id}/end', response_model=SessionEndResponse)
def end_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SessionEndResponse:
    session = get_session(session_id, user, supabase)
    supabase.table('sessions').update({'status': 'ended'}).eq('id', session_id).execute()
    background_tasks.add_task(generate_and_store_report, session_id, supabase)
    return SessionEndResponse(
        message='Session ended. Report generation in progress.',
        session_id=session_id,
        status=SessionStatus.ended,
    )


@router.websocket('/{session_id}/signal')
async def signal_ws(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get('token')
    if not token:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_json()
            payload = webrtc_signal_service.validate_incoming(message)
            if payload['type'] == 'offer':
                await websocket.send_json(webrtc_signal_service.make_answer(payload.get('sdp', '')))
            elif payload['type'] == 'ice_candidate':
                await websocket.send_json(payload)
            await websocket.send_json({'type': 'ready'})
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.send_json({'type': 'error', 'message': 'Signaling failed'})
        await websocket.close(code=1011)


@router.websocket('/{session_id}/stream')
async def stream_ws(websocket: WebSocket, session_id: str) -> None:
    token = websocket.query_params.get('token')
    if not token:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    context = session_context_store.get(session_id)
    if not context:
        await websocket.send_json({'type': 'error', 'code': 'SESSION_NOT_FOUND', 'message': 'Session context missing'})
        await websocket.close(code=4404)
        return

    async def receive_loop() -> None:
        while True:
            inbound = await websocket.receive_json()
            if inbound.get('type') == 'session_end_signal':
                await websocket.send_json({'type': 'session_status', 'status': 'ended'})
                await websocket.close(code=1000)
                return
            relay_events = await gemini_live_relay.relay(inbound)
            for event in relay_events:
                await websocket.send_json(event)

    try:
        await websocket.send_json({'type': 'session_status', 'status': 'active'})
        await receive_loop()
    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.send_json({'type': 'error', 'code': 'GEMINI_STREAM_FAIL', 'message': 'Gemini relay error'})
    finally:
        await gemini_live_relay.close()
