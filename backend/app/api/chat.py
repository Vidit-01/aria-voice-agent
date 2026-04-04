from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from supabase import Client

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, get_current_user
from app.core.supabase_client import get_supabase_client
from app.services.rag import rag_service

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None


router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_code_fences(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```") and cleaned.endswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 2:
            return "\n".join(lines[1:-1]).strip()
    return cleaned


def _load_chat_session_or_404(supabase: Client, chat_session_id: str) -> dict[str, Any]:
    resp = supabase.table("chat_sessions").select("*").eq("id", chat_session_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return resp.data[0]


def _require_owner(user: CurrentUser, row: dict[str, Any]) -> None:
    if row.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this chat session")


def _get_latest_pre_analysis(supabase: Client, user_id: str) -> dict[str, Any]:
    resp = (
        supabase.table("pre_analyses")
        .select("*")
        .eq("user_id", user_id)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pre-analysis not found")
    return resp.data[0]


def _build_chat_system_prompt(
    profile: dict[str, Any],
    pre_analysis: dict[str, Any],
    company_name: str,
    rag_context: str,
) -> str:
    return f"""
You are Aria, a friendly and knowledgeable study abroad assistant for {company_name}. You help students with questions about studying abroad — countries, universities, applications, visas, scholarships, tests, and timelines.

You have access to the student's profile and pre-analysis summary below. Use this to personalise your answers. Do not ask for information already present in the profile.

STUDENT PROFILE:
{profile}

PRE-ANALYSIS:
{pre_analysis}

RAG CONTEXT (trusted knowledge base snippets):
{rag_context}

RULES:
- Keep every response under 80 words. Be direct and specific.
- Never give more than 3 bullet points in a single response.
- Do not repeat information the student already provided in their profile.
- Do not make promises about admissions, visa approvals, or scholarship outcomes.
- Do not give legal or financial advice. Direct those queries to a human counsellor.
- If a question is completely outside study abroad scope, politely decline and redirect.
- If the student seems confused or anxious, reassure them briefly before answering.
- End responses with a follow-up question only if genuinely needed. Do not force it.
- For factual answers (universities, programs, visa/process details), prefer the RAG CONTEXT.
- If RAG CONTEXT does not contain enough evidence, clearly say you need more verified context.
""".strip()


def _call_gemini_chat(system_prompt: str, history: list[dict[str, Any]], user_message: str) -> str:
    settings = get_settings()
    if not genai or not settings.gemini_api_key:
        raise RuntimeError("Gemini is not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.rag_chat_model, system_instruction=system_prompt)

    contents: list[dict[str, Any]] = []
    for msg in history:
        role = "model" if msg.get("role") == "ai" else "user"
        text = str(msg.get("text") or "").strip()
        if not text:
            continue
        contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": user_message}]})
    response = model.generate_content(
        contents,
        request_options={"timeout": max(1, int(settings.gemini_request_timeout_seconds))},
    )
    return _strip_code_fences(response.text or "").strip()


def _call_gemini_summary(transcript: str) -> str:
    settings = get_settings()
    if not genai or not settings.gemini_api_key:
        raise RuntimeError("Gemini is not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.rag_chat_model)
    prompt = f"""
You are a summarisation assistant. You will be given the full message history of a chat session between a student and an AI study abroad assistant. Generate a concise factual summary of the conversation.

The summary must:
- Be 5–7 sentences maximum.
- Cover: what the student asked about, key information or advice given, any concerns or hesitations raised by the student, and any next steps discussed.
- Be written in third person (e.g. "The student asked about...").
- Contain only facts from the conversation — no interpretation or scoring.
- Be usable standalone without reading the original chat.

Return ONLY a plain text summary. No JSON, no bullet points, no headers, no preamble.

Chat history:
{transcript}
""".strip()
    response = model.generate_content(
        prompt,
        request_options={"timeout": max(1, int(settings.gemini_request_timeout_seconds))},
    )
    return _strip_code_fences(response.text or "").strip()


class ChatStartResponse(BaseModel):
    chat_session_id: str
    created_at: str


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatMessageResponse(BaseModel):
    reply: str
    chat_session_id: str


class ChatEndResponse(BaseModel):
    summary: str | None
    chat_session_id: str
    ended_at: str


@router.post("/start", response_model=ChatStartResponse)
def start_chat(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ChatStartResponse:
    session_id = str(uuid4())
    created_at = _now_iso()
    supabase.table("chat_sessions").insert(
        {
            "id": session_id,
            "user_id": user.user_id,
            "messages": [],
            "summary": None,
            "created_at": created_at,
            "ended_at": None,
        }
    ).execute()
    return ChatStartResponse(chat_session_id=session_id, created_at=created_at)


@router.post("/{chat_session_id}/message", response_model=ChatMessageResponse)
def send_message(
    chat_session_id: str,
    payload: ChatMessageRequest,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ChatMessageResponse:
    row = _load_chat_session_or_404(supabase, chat_session_id)
    _require_owner(user, row)
    if row.get("ended_at"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This chat session has ended")

    messages = row.get("messages") or []
    if not isinstance(messages, list):
        messages = []

    profile_resp = supabase.table("profiles").select("*").eq("id", user.user_id).limit(1).execute()
    if not profile_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile = profile_resp.data[0]
    pre_analysis = _get_latest_pre_analysis(supabase, user.user_id)
    try:
        rag_chunks = rag_service.retrieve(payload.message.strip(), supabase)
    except Exception:
        rag_chunks = []
    rag_context = rag_service.format_context(rag_chunks)

    settings = get_settings()
    system_prompt = _build_chat_system_prompt(profile, pre_analysis, settings.company_name, rag_context)
    reply = _call_gemini_chat(system_prompt, messages, payload.message.strip())

    user_msg = {"role": "user", "text": payload.message.strip(), "timestamp": _now_iso()}
    ai_msg = {"role": "ai", "text": reply, "timestamp": _now_iso()}
    updated_messages = [*messages, user_msg, ai_msg]
    supabase.table("chat_sessions").update({"messages": updated_messages}).eq("id", chat_session_id).execute()

    return ChatMessageResponse(reply=reply, chat_session_id=chat_session_id)


@router.post("/{chat_session_id}/end", response_model=ChatEndResponse)
def end_chat(
    chat_session_id: str,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> ChatEndResponse:
    row = _load_chat_session_or_404(supabase, chat_session_id)
    _require_owner(user, row)

    messages = row.get("messages") or []
    if not isinstance(messages, list):
        messages = []

    ended_at = _now_iso()
    if not messages:
        supabase.table("chat_sessions").update({"summary": None, "ended_at": ended_at}).eq("id", chat_session_id).execute()
        return ChatEndResponse(summary=None, chat_session_id=chat_session_id, ended_at=ended_at)

    lines: list[str] = []
    for msg in messages:
        role = "Aria" if msg.get("role") == "ai" else "User"
        text = str(msg.get("text") or "").strip()
        if text:
            lines.append(f"{role}: {text}")
    transcript = "\n".join(lines)

    summary = _call_gemini_summary(transcript)
    supabase.table("chat_sessions").update({"summary": summary, "ended_at": ended_at}).eq("id", chat_session_id).execute()
    return ChatEndResponse(summary=summary, chat_session_id=chat_session_id, ended_at=ended_at)
