from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.dependencies import CurrentUser, require_admin
from app.core.supabase_client import get_supabase_client


router = APIRouter()


@router.get('/leads')
def list_leads(
    page: int = 1,
    limit: int = 20,
    classification: str | None = None,
    sort_by: str = 'created_at',
    admin: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    offset = (page - 1) * limit
    leads_resp = supabase.table('profiles').select('id,full_name,email,phone,target_countries,target_course,created_at').range(offset, offset + limit - 1).execute()

    leads = []
    for row in leads_resp.data or []:
        report_q = supabase.table('session_reports').select('lead_score,lead_classification,generated_at').eq('user_id', row['id']).order('generated_at', desc=True).limit(1)
        if classification:
            report_q = report_q.eq('lead_classification', classification)
        report = report_q.execute()
        latest = report.data[0] if report.data else {}
        sessions = supabase.table('sessions').select('id,ended_at').eq('user_id', row['id']).execute()
        leads.append(
            {
                'user_id': row['id'],
                'full_name': row.get('full_name'),
                'email': row.get('email'),
                'phone': row.get('phone'),
                'target_countries': row.get('target_countries', []),
                'target_course': row.get('target_course'),
                'latest_lead_score': latest.get('lead_score'),
                'latest_classification': latest.get('lead_classification'),
                'total_sessions': len(sessions.data or []),
                'last_session_at': (sessions.data or [{}])[-1].get('ended_at') if sessions.data else None,
            }
        )

    if sort_by == 'lead_score':
        leads.sort(key=lambda x: x.get('latest_lead_score') or 0, reverse=True)

    return {'total': len(leads), 'page': page, 'limit': limit, 'leads': leads}


@router.get('/leads/{user_id}')
def lead_detail(user_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    profile = supabase.table('profiles').select('*').eq('id', user_id).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail='Lead not found')

    pre = supabase.table('pre_analyses').select('*').eq('user_id', user_id).order('generated_at', desc=True).limit(1).execute()
    sessions = (
        supabase.table('sessions')
        .select('id,status,language_detected,duration_seconds,ended_at')
        .eq('user_id', user_id)
        .order('created_at', desc=True)
        .execute()
    )

    session_cards = []
    for s in sessions.data or []:
        report = supabase.table('session_reports').select('lead_score,lead_classification,summary').eq('session_id', s['id']).limit(1).execute()
        r = report.data[0] if report.data else {}
        session_cards.append(
            {
                'session_id': s['id'],
                'status': s['status'],
                'language_detected': s.get('language_detected'),
                'duration_seconds': s.get('duration_seconds'),
                'lead_score': r.get('lead_score'),
                'classification': r.get('lead_classification'),
                'summary': r.get('summary'),
                'ended_at': s.get('ended_at'),
            }
        )

    return {'profile': profile.data[0], 'pre_analysis': pre.data[0] if pre.data else None, 'sessions': session_cards}


@router.get('/leads/{user_id}/sessions')
def lead_sessions(user_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> list[dict]:
    return lead_detail(user_id, admin, supabase)['sessions']


@router.get('/sessions')
def list_sessions(
    page: int = 1,
    limit: int = 20,
    classification: str | None = None,
    language: str | None = None,
    sort_by: str = 'created_at',
    admin: CurrentUser = Depends(require_admin),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    offset = (page - 1) * limit
    query = supabase.table('sessions').select('*').range(offset, offset + limit - 1)
    if language:
        query = query.eq('language_detected', language)
    sessions = query.execute().data or []

    if classification:
        filtered = []
        for s in sessions:
            report = supabase.table('session_reports').select('lead_classification').eq('session_id', s['id']).limit(1).execute()
            if report.data and report.data[0].get('lead_classification') == classification:
                filtered.append(s)
        sessions = filtered

    return {'total': len(sessions), 'page': page, 'limit': limit, 'sessions': sessions, 'sort_by': sort_by}


@router.get('/sessions/{session_id}/report')
def session_report(session_id: str, admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    sess = supabase.table('sessions').select('*').eq('id', session_id).limit(1).execute()
    report = supabase.table('session_reports').select('*').eq('session_id', session_id).limit(1).execute()
    if not sess.data or not report.data:
        raise HTTPException(status_code=404, detail='Report not found')

    s = sess.data[0]
    r = report.data[0]
    return {
        'session_id': s['id'],
        'user_id': s['user_id'],
        'language_detected': s.get('language_detected'),
        'duration_seconds': s.get('duration_seconds'),
        'extracted_data': r.get('extracted_data', {}),
        'lead_score': {
            'total': r.get('lead_score'),
            'breakdown': r.get('lead_score_breakdown', {}),
            'classification': r.get('lead_classification'),
            'classification_reason': r.get('classification_reason'),
        },
        'sentiment_analysis': {
            'overall': r.get('sentiment_overall'),
            'score': r.get('sentiment_score'),
            'trajectory': r.get('sentiment_trajectory'),
            'key_emotions': r.get('key_emotions', []),
        },
        'recommended_actions': r.get('recommended_actions', []),
        'summary': r.get('summary'),
        'generated_at': r.get('generated_at'),
    }


@router.get('/analytics')
def analytics(admin: CurrentUser = Depends(require_admin), supabase: Client = Depends(get_supabase_client)) -> dict:
    profiles = supabase.table('profiles').select('id,target_countries').execute().data or []
    reports = supabase.table('session_reports').select('lead_score,lead_classification,sentiment_overall').execute().data or []
    sessions = supabase.table('sessions').select('id,duration_seconds,language_detected,created_at').execute().data or []

    classification = {'hot': 0, 'warm': 0, 'cold': 0}
    sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
    languages: dict[str, int] = {}
    country_count: dict[str, int] = {}

    for p in profiles:
        for c in p.get('target_countries') or []:
            country_count[c] = country_count.get(c, 0) + 1

    for r in reports:
        cls = r.get('lead_classification')
        if cls in classification:
            classification[cls] += 1
        sent = r.get('sentiment_overall')
        if sent in sentiments:
            sentiments[sent] += 1

    durations = [s.get('duration_seconds') for s in sessions if s.get('duration_seconds')]
    for s in sessions:
        lang = s.get('language_detected')
        if lang:
            languages[lang] = languages.get(lang, 0) + 1

    avg_score = (sum(r.get('lead_score', 0) for r in reports) / len(reports)) if reports else 0
    avg_duration = int(sum(durations) / len(durations)) if durations else 0
    top_countries = sorted(country_count, key=lambda x: country_count[x], reverse=True)[:5]

    return {
        'total_leads': len(profiles),
        'classification_breakdown': classification,
        'average_lead_score': round(avg_score, 2),
        'sessions_today': 0,
        'total_sessions': len(sessions),
        'sentiment_distribution': sentiments,
        'top_target_countries': top_countries,
        'avg_session_duration_seconds': avg_duration,
        'language_distribution': languages,
    }


@router.post('/notify/{user_id}')
def notify(user_id: str, body: dict, admin: CurrentUser = Depends(require_admin)) -> dict:
    return {'message': 'Notification sent'}
