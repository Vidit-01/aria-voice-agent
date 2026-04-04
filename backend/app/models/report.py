from enum import Enum
from typing import Any

from pydantic import BaseModel


class LeadClassification(str, Enum):
    hot = 'hot'
    warm = 'warm'
    cold = 'cold'


class SentimentOverall(str, Enum):
    positive = 'positive'
    neutral = 'neutral'
    negative = 'negative'


class SentimentTrajectory(str, Enum):
    improving = 'improving'
    stable = 'stable'
    declining = 'declining'


class LeadScoreBreakdown(BaseModel):
    intent_seriousness: int
    financial_readiness: int
    timeline_urgency: int


class LeadScore(BaseModel):
    total: int
    breakdown: LeadScoreBreakdown
    classification: LeadClassification
    classification_reason: str


class SentimentAnalysis(BaseModel):
    overall: SentimentOverall
    score: float
    trajectory: SentimentTrajectory
    key_emotions: list[str]


class ReportPayload(BaseModel):
    extracted_data: dict[str, Any]
    lead_score: LeadScore
    sentiment_analysis: SentimentAnalysis
    recommended_actions: list[str]
    summary: str
