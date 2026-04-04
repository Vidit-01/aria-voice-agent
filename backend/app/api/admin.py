from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.core.dependencies import CurrentUser, require_admin
from app.core.supabase_client import get_supabase_client
from app.models.auth import AuthResponse, LoginRequest


router = APIRouter()


@router.post('/login', response_model=AuthResponse)
def admin_login(payload: LoginRequest, supabase: Client = Depends(get_supabase_client)) -> AuthResponse:
    try:
        auth_resp = supabase.auth.sign_in_with_password({'email': payload.email, 'password': payload.password})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    user = auth_resp.user
    session = auth_resp.session
    if not user or not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    profile = supabase.table('profiles').select('role').eq('id', user.id).limit(1).execute()
    role = profile.data[0]['role'] if profile.data else 'student'
    if role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin role required')
    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=user.id,
        role=role,
    )


@router.get('/leads')
def leads(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    classification: str | None = None,
    sort_by: str = Query(default='created_at'),
    admin: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    _ = admin
    offset = (page - 1) * limit
    leads_resp = supabase.table('profiles').select('*').range(offset, offset + limit - 1).execute()
    rows = leads_resp.data or []
    output = []
    for row in rows:
        report_q = (
            supabase.table('session_reports')
            .select('lead_score,lead_classification,generated_at')
            .eq('user_id', row['id'])
            .order('generated_at', desc=True)
            .limit(1)
            .execute()
        )
        latest = report_q.data[0] if report_q.data else {}
        sessions = supabase.table('sessions').select('id,ended_at').eq('user_id', row['id']).execute().data or []
        lead_row = {
            'user_id': row['id'],
            'full_name': row.get('full_name'),
            'email': row.get('email'),
            'phone': row.get('phone'),
            'target_countries': row.get('target_countries') or [],
            'target_course': row.get('target_course'),
            'latest_lead_score': latest.get('lead_score'),
            'latest_classification': latest.get('lead_classification'),
            'total_sessions': len(sessions),
            'last_session_at': max((s.get('ended_at') for s in sessions if s.get('ended_at')), default=None),
        }
        output.append(lead_row)
    if classification:
        output = [o for o in output if o.get('latest_classification') == classification]
    if sort_by == 'lead_score':
        output.sort(key=lambda x: x.get('latest_lead_score') or 0, reverse=True)
    else:
        output.sort(key=lambda x: x.get('last_session_at') or x.get('user_id'), reverse=True)
    return {'total': len(output), 'page': page, 'limit': limit, 'leads': output}


@router.get('/leads/{user_id}')
def lead_detail(user_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    _ = admin
    profile = supabase.table('profiles').select('*').eq('id', user_id).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Lead not found')
    pre = supabase.table('pre_analyses').select('*').eq('user_id', user_id).order('generated_at', desc=True).limit(1).execute()
    sessions = (
        supabase.table('sessions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', desc=True)
        .execute()
        .data
        or []
    )
    normalized_sessions = []
    for s in sessions:
        report = supabase.table('session_reports').select('lead_score,lead_classification,summary').eq('session_id', s['id']).limit(1).execute()
        rpt = report.data[0] if report.data else {}
        normalized_sessions.append(
            {
                'session_id': s['id'],
                'status': s.get('status'),
                'language_detected': s.get('language_detected'),
                'duration_seconds': s.get('duration_seconds'),
                'lead_score': rpt.get('lead_score'),
                'classification': rpt.get('lead_classification'),
                'summary': rpt.get('summary'),
                'ended_at': s.get('ended_at'),
            }
        )
    return {
        'profile': profile.data[0],
        'pre_analysis': pre.data[0] if pre.data else None,
        'sessions': normalized_sessions,
    }


@router.get('/leads/{user_id}/sessions')
def lead_sessions(user_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> list[dict]:
    return lead_detail(user_id, admin, supabase)['sessions']


@router.get('/sessions')
def sessions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    classification: str | None = None,
    language: str | None = None,
    sort_by: str = Query(default='ended_at'),
    admin: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    _ = admin
    offset = (page - 1) * limit
    rows = supabase.table('sessions').select('*').range(offset, offset + limit - 1).execute().data or []
    normalized = []
    for s in rows:
        profile = supabase.table('profiles').select('full_name').eq('id', s['user_id']).limit(1).execute()
        full_name = profile.data[0].get('full_name') if profile.data else None
        report = supabase.table('session_reports').select('lead_score,lead_classification').eq('session_id', s['id']).limit(1).execute()
        rpt = report.data[0] if report.data else {}
        normalized.append(
            {
                'session_id': s['id'],
                'user_id': s['user_id'],
                'full_name': full_name,
                'status': s.get('status'),
                'language_detected': s.get('language_detected'),
                'duration_seconds': s.get('duration_seconds'),
                'lead_score': rpt.get('lead_score'),
                'classification': rpt.get('lead_classification'),
                'ended_at': s.get('ended_at'),
            }
        )
    if classification:
        normalized = [r for r in normalized if r.get('classification') == classification]
    if language:
        normalized = [r for r in normalized if r.get('language_detected') == language]
    if sort_by == 'lead_score':
        normalized.sort(key=lambda x: x.get('lead_score') or 0, reverse=True)
    else:
        normalized.sort(key=lambda x: x.get('ended_at') or x.get('session_id'), reverse=True)
    return {'total': len(normalized), 'page': page, 'limit': limit, 'sessions': normalized}


@router.get('/sessions/{session_id}/report')
def session_report(session_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    _ = admin
    sess = supabase.table('sessions').select('*').eq('id', session_id).limit(1).execute()
    report = supabase.table('session_reports').select('*').eq('session_id', session_id).limit(1).execute()
    if not sess.data or not report.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not yet generated or session not found')
    s = sess.data[0]
    r = report.data[0]
    return {
        'session_id': session_id,
        'user_id': s.get('user_id'),
        'language_detected': s.get('language_detected'),
        'duration_seconds': s.get('duration_seconds'),
        'extracted_data': r.get('extracted_data'),
        'lead_score': {
            'total': r.get('lead_score'),
            'breakdown': r.get('lead_score_breakdown'),
            'classification': r.get('lead_classification'),
            'classification_reason': r.get('classification_reason'),
        },
        'sentiment_analysis': {
            'overall': r.get('sentiment_overall'),
            'score': r.get('sentiment_score'),
            'trajectory': r.get('sentiment_trajectory'),
            'key_emotions': r.get('key_emotions'),
        },
        'recommended_actions': r.get('recommended_actions'),
        'summary': r.get('summary'),
        'generated_at': r.get('generated_at'),
    }


@router.get('/analytics')
def analytics(admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    _ = admin
    profiles = supabase.table('profiles').select('id,target_countries').execute().data or []
    reports = supabase.table('session_reports').select('lead_score,lead_classification,sentiment_overall').execute().data or []
    sessions_data = supabase.table('sessions').select('id,duration_seconds,language_detected,created_at').execute().data or []

    class_breakdown = Counter(r.get('lead_classification') for r in reports if r.get('lead_classification'))
    sentiment_breakdown = Counter(r.get('sentiment_overall') for r in reports if r.get('sentiment_overall'))
    language_breakdown = Counter(s.get('language_detected') for s in sessions_data if s.get('language_detected'))
    country_counter = Counter()
    for p in profiles:
        for c in (p.get('target_countries') or []):
            country_counter[c] += 1

    today = datetime.now(timezone.utc).date()
    sessions_today = sum(
        1
        for s in sessions_data
        if s.get('created_at') and datetime.fromisoformat(s['created_at'].replace('Z', '+00:00')).date() == today
    )
    avg_score = sum((r.get('lead_score') or 0) for r in reports) / len(reports) if reports else 0
    durations = [s.get('duration_seconds') for s in sessions_data if s.get('duration_seconds') is not None]
    avg_duration = int(sum(durations) / len(durations)) if durations else 0

    return {
        'total_leads': len(profiles),
        'classification_breakdown': {'hot': class_breakdown.get('hot', 0), 'warm': class_breakdown.get('warm', 0), 'cold': class_breakdown.get('cold', 0)},
        'average_lead_score': round(avg_score, 1),
        'sessions_today': sessions_today,
        'total_sessions': len(sessions_data),
        'sentiment_distribution': {
            'positive': sentiment_breakdown.get('positive', 0),
            'neutral': sentiment_breakdown.get('neutral', 0),
            'negative': sentiment_breakdown.get('negative', 0),
        },
        'top_target_countries': [c for c, _ in country_counter.most_common(5)],
        'avg_session_duration_seconds': avg_duration,
        'language_distribution': dict(language_breakdown),
    }


@router.post('/notify/{user_id}')
def notify(user_id: str, body: dict, admin: CurrentUser = Depends(require_admin)) -> dict:
    _ = user_id
    _ = body
    _ = admin
    return {'message': 'Notification sent'}
