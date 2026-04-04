import json
from typing import Any

from app.core.config import get_settings
from app.models.profile import PreAnalysisPayload
from app.models.profile import ProfileScorePayload
from app.models.report import ReportPayload
from app.prompts.pre_analysis_prompt import PRE_ANALYSIS_PROMPT
from app.prompts.resume_parse_prompt import RESUME_PARSE_PROMPT

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

    def parse_resume_to_profile(self, resume_text: str, user_email: str | None = None) -> dict[str, Any]:
        if not self.enabled:
            return {
                'full_name': '',
                'phone': None,
                'age': None,
                'current_education': None,
                'target_countries': [],
                'target_course': None,
                'target_universities': [],
                'budget': None,
                'timeline': None,
                'test_scores': None,
                'previous_visa_rejection': False,
                'preferred_language': 'auto',
                'email': user_email,
            }
        prompt = _render(RESUME_PARSE_PROMPT, {'RESUME_TEXT': resume_text, 'USER_EMAIL': user_email or ''})
        parsed = self._generate_json(prompt)
        if not isinstance(parsed, dict):
            raise RuntimeError('Gemini resume parser returned invalid structure')
        parsed['email'] = user_email
        parsed.setdefault('previous_visa_rejection', False)
        parsed.setdefault('preferred_language', 'auto')
        parsed.setdefault('target_countries', [])
        parsed.setdefault('target_universities', [])
        return parsed

    def generate_profile_score(self, profile: dict[str, Any]) -> ProfileScorePayload:
        breakdown = {
            'personal_info': 0,
            'education': 0,
            'targets': 0,
            'readiness': 0,
            'timeline_tests': 0,
        }
        missing_fields: list[str] = []
        recommendations: list[str] = []

        if profile.get('full_name'):
            breakdown['personal_info'] += 8
        else:
            missing_fields.append('full_name')
        if profile.get('email'):
            breakdown['personal_info'] += 6
        else:
            missing_fields.append('email')
        if profile.get('phone'):
            breakdown['personal_info'] += 6
        else:
            missing_fields.append('phone')

        current_edu = profile.get('current_education') or {}
        if current_edu.get('level'):
            breakdown['education'] += 8
        else:
            missing_fields.append('current_education.level')
        if current_edu.get('field'):
            breakdown['education'] += 8
        else:
            missing_fields.append('current_education.field')
        if current_edu.get('institution'):
            breakdown['education'] += 9
        else:
            missing_fields.append('current_education.institution')

        target_countries = profile.get('target_countries') or []
        if target_countries:
            breakdown['targets'] += 10
        else:
            missing_fields.append('target_countries')
        if profile.get('target_course'):
            breakdown['targets'] += 8
        else:
            missing_fields.append('target_course')
        if (profile.get('target_universities') or []):
            breakdown['targets'] += 7
        else:
            missing_fields.append('target_universities')

        budget = profile.get('budget') or {}
        if budget.get('annual_tuition_usd') is not None:
            breakdown['readiness'] += 8
        else:
            missing_fields.append('budget.annual_tuition_usd')
        if budget.get('living_expenses_usd') is not None:
            breakdown['readiness'] += 7
        else:
            missing_fields.append('budget.living_expenses_usd')
        if budget.get('funding_source'):
            breakdown['readiness'] += 5
        else:
            missing_fields.append('budget.funding_source')

        timeline = profile.get('timeline') or {}
        if timeline.get('preferred_intake'):
            breakdown['timeline_tests'] += 6
        else:
            missing_fields.append('timeline.preferred_intake')
        if timeline.get('months_to_start') is not None:
            breakdown['timeline_tests'] += 5
        else:
            missing_fields.append('timeline.months_to_start')
        test_scores = profile.get('test_scores') or {}
        if any(test_scores.get(k) is not None for k in ['ielts', 'toefl', 'gre', 'gmat', 'duolingo']):
            breakdown['timeline_tests'] += 9
        else:
            missing_fields.append('test_scores')

        total = min(sum(breakdown.values()), 100)
        if missing_fields:
            recommendations.append('Complete missing profile fields to improve counselling quality.')
        if not (profile.get('target_universities') or []):
            recommendations.append('Add a shortlist of universities for better lead scoring.')
        if not (profile.get('test_scores') or {}):
            recommendations.append('Add available test scores or planned test dates.')

        return ProfileScorePayload(
            total_score=total,
            breakdown=breakdown,
            missing_fields=missing_fields,
            recommendations=recommendations,
        )

    def generate_session_report(
        self,
        profile: dict[str, Any],
        session_metadata: dict[str, Any],
        session_signals: dict[str, Any],
    ) -> ReportPayload:
        _ = profile
        _ = session_metadata
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
                'classification_reason': 'Baseline scoring used for REST-only demo mode.',
            },
            'sentiment_analysis': {
                'overall': 'neutral',
                'score': 0.0,
                'trajectory': 'stable',
                'key_emotions': ['curious'],
            },
            'recommended_actions': ['Counsellor follow-up within 24 hours.'],
            'summary': 'Session completed. Summary generated for admin dashboard.',
        }
        return ReportPayload.model_validate(fallback)


gemini_flash_service = GeminiFlashService()
