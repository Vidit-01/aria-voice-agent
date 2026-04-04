from typing import Any

from pydantic import BaseModel, Field


class ProfileSubmitRequest(BaseModel):
    full_name: str
    phone: str | None = None
    age: int | None = None
    current_education: dict[str, Any] | None = None
    target_countries: list[str] = Field(default_factory=list)
    target_course: str | None = None
    target_universities: list[str] = Field(default_factory=list)
    budget: dict[str, Any] | None = None
    timeline: dict[str, Any] | None = None
    test_scores: dict[str, Any] | None = None
    previous_visa_rejection: bool = False
    preferred_language: str = 'auto'


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    age: int | None = None
    current_education: dict[str, Any] | None = None
    target_countries: list[str] | None = None
    target_course: str | None = None
    target_universities: list[str] | None = None
    budget: dict[str, Any] | None = None
    timeline: dict[str, Any] | None = None
    test_scores: dict[str, Any] | None = None
    previous_visa_rejection: bool | None = None
    preferred_language: str | None = None


class ProfileActionResponse(BaseModel):
    message: str
    user_id: str | None = None


class ResumeUploadResponse(BaseModel):
    message: str
    resume_url: str


class ResumeSignedUrlResponse(BaseModel):
    signed_url: str
    expires_in_seconds: int


class PreAnalysisPayload(BaseModel):
    profile_completeness_score: int
    initial_observations: list[str]
    gaps_to_probe: list[str]
    suggested_focus_areas: list[str]
    initial_lead_hint: str


class PreAnalysisResponse(BaseModel):
    user_id: str
    pre_analysis: PreAnalysisPayload
    generated_at: str
