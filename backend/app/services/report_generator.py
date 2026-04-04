from datetime import datetime, timezone
from typing import Any

import httpx
from supabase import Client

from app.core.config import get_settings
from app.models.report import ReportPayload
from app.services.gemini_flash import gemini_flash_service
from app.services.session_context import session_context_store


async def send_hot_lead_notification(user_id: str, report: ReportPayload) -> None:
    settings = get_settings()
    if not settings.hot_lead_webhook_url:
        return
    payload = {
        'user_id': user_id,
        'lead_score': report.lead_score.total,
        'classification': report.lead_score.classification.value,
        'classification_reason': report.lead_score.classification_reason,
        'recommended_actions': report.recommended_actions,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(settings.hot_lead_webhook_url, json=payload)


async def generate_and_store_report(session_id: str, supabase: Client) -> None:
    ctx = session_context_store.get(session_id)
    if not ctx:
        return

    ended_at = datetime.now(timezone.utc)
    started = ctx.get('started_at', ended_at)
    duration = int((ended_at - started).total_seconds())

    report = gemini_flash_service.generate_session_report(
        ctx.get('profile_json', {}),
        {
            'session_id': session_id,
            'language_detected': ctx.get('language_detected'),
            'duration_seconds': duration,
        },
        ctx,
    )

    supabase.table('sessions').update(
        {
            'status': 'ended',
            'ended_at': ended_at.isoformat(),
            'duration_seconds': duration,
            'language_detected': ctx.get('language_detected'),
        }
    ).eq('id', session_id).execute()

    supabase.table('session_reports').insert(
        {
            'session_id': session_id,
            'user_id': ctx['user_id'],
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

    if report.lead_score.total >= 70:
        await send_hot_lead_notification(ctx['user_id'], report)

    session_context_store.clear(session_id)
