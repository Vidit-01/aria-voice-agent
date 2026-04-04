from datetime import datetime, timezone

import pdfplumber
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from supabase import Client

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, get_current_user, require_ownership_or_admin
from app.core.supabase_client import get_supabase_client
from app.models.profile import (
    PreAnalysisResponse,
    ProfileActionResponse,
    ProfileSubmitRequest,
    ProfileUpdateRequest,
    ResumeSignedUrlResponse,
    ResumeUploadResponse,
)
from app.services.gemini_flash import gemini_flash_service


router = APIRouter()


def _load_profile_or_404(supabase: Client, user_id: str) -> dict:
    resp = supabase.table('profiles').select('*').eq('id', user_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Profile not found')
    return resp.data[0]


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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Only PDF files are allowed')

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File too large')

    settings = get_settings()
    path = f'{user_id}/resume.pdf'
    supabase.storage.from_(settings.resume_bucket).upload(path, content, {'content-type': 'application/pdf', 'upsert': 'true'})
    signed = supabase.storage.from_(settings.resume_bucket).create_signed_url(path, 3600)
    signed_url = signed.get('signedURL') or signed.get('signedUrl')
    supabase.table('profiles').update({'resume_url': signed_url}).eq('id', user_id).execute()
    return ResumeUploadResponse(message='Resume uploaded successfully', resume_url=signed_url)


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

    resume_text = None
    if profile.get('resume_url'):
        resume_text = ''

    analysis = gemini_flash_service.generate_pre_analysis(profile, resume_text)
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
    return PreAnalysisResponse(user_id=user_id, pre_analysis=analysis, generated_at=generated_at)


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pre-analysis not found')

    row = resp.data[0]
    from app.models.profile import PreAnalysisPayload

    payload = PreAnalysisPayload(
        profile_completeness_score=row['profile_completeness_score'],
        initial_observations=row['initial_observations'],
        gaps_to_probe=row['gaps_to_probe'],
        suggested_focus_areas=row['suggested_focus_areas'],
        initial_lead_hint=row['initial_lead_hint'],
    )
    return PreAnalysisResponse(user_id=user_id, pre_analysis=payload, generated_at=row['generated_at'])
