from app.models.report import LeadClassification, ReportPayload


def test_report_schema_accepts_valid_payload() -> None:
    payload = {
        'extracted_data': {
            'intent_signals': [],
            'financial_signals': [],
            'timeline_signals': [],
            'universities_mentioned': [],
            'courses_mentioned': [],
            'concerns_raised': [],
        },
        'lead_score': {
            'total': 80,
            'breakdown': {'intent_seriousness': 30, 'financial_readiness': 25, 'timeline_urgency': 25},
            'classification': 'hot',
            'classification_reason': 'Test',
        },
        'sentiment_analysis': {'overall': 'positive', 'score': 0.4, 'trajectory': 'improving', 'key_emotions': ['hopeful']},
        'recommended_actions': ['Call now'],
        'summary': 'Strong lead.',
    }
    report = ReportPayload.model_validate(payload)
    assert report.lead_score.classification == LeadClassification.hot
