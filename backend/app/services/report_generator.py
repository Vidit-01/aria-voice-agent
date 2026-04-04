from datetime import datetime, timezone

from supabase import Client

from app.models.report import ReportPayload
from app.services.gemini_flash import gemini_flash_service


async def generate_and_store_report(session_id: str, supabase: Client) -> None:
    session_resp = supabase.table('sessions').select('*').eq('id', session_id).limit(1).execute()
    if not session_resp.data:
        return
    session = session_resp.data[0]
    profile_resp = supabase.table('profiles').select('*').eq('id', session['user_id']).limit(1).execute()
    profile = profile_resp.data[0] if profile_resp.data else {}

    ended_at = datetime.now(timezone.utc).isoformat()
    report: ReportPayload = gemini_flash_service.generate_session_report(
        profile,
        {'session_id': session_id, 'language_detected': session.get('language_detected')},
        {},
    )

    supabase.table('sessions').update({'status': 'ended', 'ended_at': ended_at}).eq('id', session_id).execute()
    supabase.table('session_reports').insert(
        {
            'session_id': session_id,
            'user_id': session['user_id'],
            'extracted_data': report.extracted_data,
            'lead_score': report.lead_score.total,
            'lead_score_breakdown': report.lead_score.breakdown.model_dump(),
            'lead_classification': report.lead_score.classification.value,
            'classification_reason': report.lead_score.classification_reason,
            'sentiment_overall': report.sentiment_analysis.overall.value,
            'sentiment_score': report.sentiment_analysis.score,
            'sentiment_trajectory': report.sentiment_analysis.trajectory.value,
            'key_emotions': report.sentiment_analysis.key_emotions,
            'recommended_actions': report.recommended_actions,
            'summary': report.summary,
        }
    ).execute()
