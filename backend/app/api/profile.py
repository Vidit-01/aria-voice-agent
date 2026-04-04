from datetime import datetime, timezone
from io import BytesIO
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pypdf import PdfReader
from supabase import Client

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, get_current_user, require_ownership_or_admin
from app.core.supabase_client import get_supabase_client
from app.models.profile import (
    PreAnalysisPayload,
    PreAnalysisResponse,
    ProfileActionResponse,
    ProfileScoreResponse,
    ProfileSubmitRequest,
    ProfileUpdateRequest,
    ResumeParseResponse,
    ResumeSignedUrlResponse,
    ResumeUploadResponse,
    SummaryResponse,
)
from app.services.gemini_flash import gemini_flash_service


router = APIRouter()
logger = logging.getLogger(__name__)


def _load_profile_or_404(supabase: Client, user_id: str) -> dict:
    resp = supabase.table('profiles').select('*').eq('id', user_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Profile not found')
    return resp.data[0]


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    return "\n".join((page.extract_text() or "") for page in reader.pages).strip()


def _is_missing(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    if isinstance(value, (list, dict)):
        return len(value) == 0
    return False


def _deep_merge_for_prefill(existing: dict, parsed: dict) -> dict:
    merged = dict(existing)
    for key, parsed_value in parsed.items():
        existing_value = merged.get(key)
        if isinstance(parsed_value, dict):
            base = existing_value if isinstance(existing_value, dict) else {}
            merged[key] = _deep_merge_for_prefill(base, parsed_value)
            continue
        if _is_missing(existing_value) and not _is_missing(parsed_value):
            merged[key] = parsed_value
    return merged


def _store_pre_analysis(
    supabase: Client,
    user_id: str,
    profile: dict,
    resume_text: str | None = None,
    strict: bool = False,
) -> tuple[PreAnalysisPayload, str]:
    analysis = gemini_flash_service.generate_pre_analysis(profile, resume_text, strict=strict)
    record = {
        'user_id': user_id,
        'profile_completeness_score': analysis.profile_completeness_score,
        'initial_observations': analysis.initial_observations,
        'gaps_to_probe': analysis.gaps_to_probe,
        'suggested_focus_areas': analysis.suggested_focus_areas,
        'initial_lead_hint': analysis.initial_lead_hint,
    }
    inserted = supabase.table('pre_analyses').insert(record).execute()
    generated_at = inserted.data[0].get('generated_at') if inserted.data else datetime.now(timezone.utc).isoformat()
    return analysis, generated_at


@router.post('/submit', response_model=ProfileActionResponse)
def submit_profile(
    payload: ProfileSubmitRequest,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ProfileActionResponse:
    data = payload.model_dump()
    data['id'] = user.user_id
    data['email'] = user.email
    data['updated_at'] = datetime.now(timezone.utc).isoformat()
    supabase.table('profiles').upsert(data).execute()
    return ProfileActionResponse(message='Profile saved', user_id=user.user_id)


@router.get('/{user_id}')
def get_profile(user_id: str, user: CurrentUser = Depends(get_current_user), supabase: Client = Depends(get_supabase_client)) -> dict:
    require_ownership_or_admin(user, user_id)
    return _load_profile_or_404(supabase, user_id)


@router.put('/{user_id}', response_model=ProfileActionResponse)
def update_profile(
    user_id: str,
    payload: ProfileUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ProfileActionResponse:
    require_ownership_or_admin(user, user_id)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return ProfileActionResponse(message='Profile updated', user_id=user_id)
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    supabase.table('profiles').update(updates).eq('id', user_id).execute()
    return ProfileActionResponse(message='Profile updated', user_id=user_id)


@router.post('/{user_id}/resume', response_model=ResumeUploadResponse)
async def upload_resume(
    user_id: str,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ResumeUploadResponse:
    require_ownership_or_admin(user, user_id)
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only PDF files are accepted')

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File too large')

    parsed_profile = None
    profile_score = None
    resume_text: str | None = None
    updated_at = datetime.now(timezone.utc).isoformat()
    existing = _load_profile_or_404(supabase, user_id)
    merged = dict(existing)
    try:
        resume_text = _extract_pdf_text(content)
        if resume_text:
            parsed_profile = gemini_flash_service.parse_resume_to_profile(resume_text, user.email)
            merged = _deep_merge_for_prefill(existing, parsed_profile)
            profile_score = gemini_flash_service.generate_profile_score(merged)
    except Exception:
        # Keep upload flow resilient even if parsing fails.
        pass

    merged['id'] = user_id
    merged['email'] = user.email
    merged['updated_at'] = updated_at

    settings = get_settings()
    path = f'{user_id}/resume.pdf'
    try:
        supabase.storage.from_(settings.resume_bucket).upload(path, content, {'content-type': 'application/pdf', 'upsert': 'true'})
        signed = supabase.storage.from_(settings.resume_bucket).create_signed_url(path, 3600)
        signed_url = signed.get('signedURL') or signed.get('signedUrl')
        merged['resume_url'] = signed_url
        supabase.table('profiles').upsert(merged).execute()
        if resume_text:
            _store_pre_analysis(supabase, user_id, merged, resume_text)
        return ResumeUploadResponse(
            message='Resume uploaded and parsed successfully' if parsed_profile else 'Resume uploaded successfully',
            resume_url=signed_url,
            parsed_profile=parsed_profile,
            profile_score=profile_score,
        )
    except Exception:
        # Save parsed profile data even when storage upload fails due bucket/RLS issues.
        supabase.table('profiles').upsert(merged).execute()
        if resume_text:
            _store_pre_analysis(supabase, user_id, merged, resume_text)
        return ResumeUploadResponse(
            message='Resume parsed but storage upload failed (check bucket policies)',
            resume_url=merged.get('resume_url'),
            parsed_profile=parsed_profile,
            profile_score=profile_score,
        )


@router.post('/{user_id}/resume/parse', response_model=ResumeParseResponse)
async def parse_resume(
    user_id: str,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ResumeParseResponse:
    require_ownership_or_admin(user, user_id)
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only PDF files are accepted')
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File too large')

    try:
        reader = PdfReader(BytesIO(content))
        resume_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unable to parse PDF') from exc
    if not resume_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No readable text found in PDF')

    parsed_profile = gemini_flash_service.parse_resume_to_profile(resume_text, user.email)
    parsed_profile['id'] = user_id
    parsed_profile['updated_at'] = datetime.now(timezone.utc).isoformat()
    parsed_profile.setdefault('email', user.email)
    existing = _load_profile_or_404(supabase, user_id)
    merged = _deep_merge_for_prefill(existing, parsed_profile)
    merged['id'] = user_id
    merged['email'] = user.email
    merged['updated_at'] = parsed_profile['updated_at']
    supabase.table('profiles').upsert(merged).execute()
    _store_pre_analysis(supabase, user_id, merged, resume_text)
    score = gemini_flash_service.generate_profile_score(merged)
    return ResumeParseResponse(
        user_id=user_id,
        parsed_profile=parsed_profile,
        profile_score=score,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get('/{user_id}/resume', response_model=ResumeSignedUrlResponse)
def get_resume(
    user_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ResumeSignedUrlResponse:
    require_ownership_or_admin(user, user_id)
    settings = get_settings()
    signed = supabase.storage.from_(settings.resume_bucket).create_signed_url(f'{user_id}/resume.pdf', 3600)
    signed_url = signed.get('signedURL') or signed.get('signedUrl')
    return ResumeSignedUrlResponse(signed_url=signed_url, expires_in_seconds=3600)


@router.post('/{user_id}/analyze', response_model=PreAnalysisResponse)
def analyze_profile(
    user_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> PreAnalysisResponse:
    require_ownership_or_admin(user, user_id)
    profile = _load_profile_or_404(supabase, user_id)
    try:
        analysis, generated_at = _store_pre_analysis(supabase, user_id, profile, None, strict=True)
    except Exception as exc:
        logger.exception('Gemini pre-analysis failed for user_id=%s', user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f'AI pre-analysis failed: {exc}',
        ) from exc
    return PreAnalysisResponse(user_id=user_id, pre_analysis=analysis, generated_at=generated_at)


@router.get('/{user_id}/score', response_model=ProfileScoreResponse)
def get_profile_score(
    user_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ProfileScoreResponse:
    require_ownership_or_admin(user, user_id)
    profile = _load_profile_or_404(supabase, user_id)
    score = gemini_flash_service.generate_profile_score(profile)
    return ProfileScoreResponse(
        user_id=user_id,
        profile_score=score,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get('/{user_id}/pre-analysis', response_model=PreAnalysisResponse)
def get_pre_analysis(
    user_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> PreAnalysisResponse:
    require_ownership_or_admin(user, user_id)
    resp = (
        supabase.table('pre_analyses')
        .select('*')
        .eq('user_id', user_id)
        .order('generated_at', desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='No pre-analysis found for this user')
    row = resp.data[0]
    payload = PreAnalysisPayload(
        profile_completeness_score=row['profile_completeness_score'],
        initial_observations=row['initial_observations'],
        gaps_to_probe=row['gaps_to_probe'],
        suggested_focus_areas=row['suggested_focus_areas'],
        initial_lead_hint=row['initial_lead_hint'],
    )
    return PreAnalysisResponse(user_id=user_id, pre_analysis=payload, generated_at=row['generated_at'])


@router.post('/{user_id}/summary', response_model=SummaryResponse)
def generate_profile_summary(
    user_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> SummaryResponse:
    require_ownership_or_admin(user, user_id)
    profile = _load_profile_or_404(supabase, user_id)
    pre = gemini_flash_service.generate_pre_analysis(profile, None)
    summary = " | ".join(pre.initial_observations[:3]) if pre.initial_observations else "Profile summary generated."
    return SummaryResponse(user_id=user_id, summary=summary)
