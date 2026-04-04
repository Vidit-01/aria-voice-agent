import json
from typing import Any

from app.core.config import get_settings
from app.models.profile import PreAnalysisPayload
from app.models.report import ReportPayload
from app.prompts.pre_analysis_prompt import PRE_ANALYSIS_PROMPT
from app.prompts.report_generation_prompt import REPORT_GENERATION_PROMPT

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


def _render(template: str, replacements: dict[str, Any]) -> str:
    text = template
    for key, value in replacements.items():
        text = text.replace('{{' + key + '}}', json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else str(value))
    return text


class GeminiFlashService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = settings.gemini_flash_model
        self.enabled = bool(genai and settings.gemini_api_key)
        if self.enabled:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None

    def _generate_json(self, prompt: str) -> dict[str, Any]:
        if not self.model:
            raise RuntimeError('Gemini not configured')
        last_error: Exception | None = None
        for _ in range(3):
            try:
                response = self.model.generate_content(prompt)
                raw = (response.text or '').strip()
                return json.loads(raw)
            except Exception as exc:
                last_error = exc
        raise RuntimeError(f'Gemini JSON generation failed: {last_error}')

    def generate_pre_analysis(self, profile: dict[str, Any], resume_text: str | None = None) -> PreAnalysisPayload:
        if not self.enabled:
            return PreAnalysisPayload(
                profile_completeness_score=70,
                initial_observations=['Profile captured. Enable Gemini API key for richer analysis.'],
                gaps_to_probe=['Funding readiness', 'University shortlist rationale', 'Timeline confidence'],
                suggested_focus_areas=['financial_readiness', 'timeline_urgency'],
                initial_lead_hint='warm',
            )
        prompt = _render(PRE_ANALYSIS_PROMPT, {'PROFILE_JSON': profile, 'RESUME_TEXT': resume_text or ''})
        parsed = self._generate_json(prompt)
        payload = parsed.get('pre_analysis', parsed)
        return PreAnalysisPayload.model_validate(payload)

    def generate_session_report(
        self,
        profile: dict[str, Any],
        session_metadata: dict[str, Any],
        session_signals: dict[str, Any],
    ) -> ReportPayload:
        if not self.enabled:
            fallback = {
                'extracted_data': {
                    'intent_signals': session_signals.get('intent_signals', []),
                    'financial_signals': session_signals.get('financial_signals', []),
                    'timeline_signals': session_signals.get('timeline_signals', []),
                    'universities_mentioned': session_signals.get('universities_mentioned', []),
                    'courses_mentioned': session_signals.get('courses_mentioned', []),
                    'concerns_raised': session_signals.get('concerns_raised', []),
                },
                'lead_score': {
                    'total': 55,
                    'breakdown': {'intent_seriousness': 22, 'financial_readiness': 16, 'timeline_urgency': 17},
                    'classification': 'warm',
                    'classification_reason': 'Fallback scoring used because Gemini is not configured.',
                },
                'sentiment_analysis': {
                    'overall': 'neutral',
                    'score': 0.0,
                    'trajectory': 'stable',
                    'key_emotions': ['curious'],
                },
                'recommended_actions': ['Counsellor follow-up within 24 hours.'],
                'summary': 'Session completed. Add Gemini API key for richer auto-generated summary.',
            }
            return ReportPayload.model_validate(fallback)

        prompt = _render(
            REPORT_GENERATION_PROMPT,
            {
                'PROFILE_JSON': profile,
                'SESSION_METADATA_JSON': session_metadata,
                'SESSION_SIGNALS_JSON': session_signals,
            },
        )
        parsed = self._generate_json(prompt)
        return ReportPayload.model_validate(parsed)


gemini_flash_service = GeminiFlashService()
