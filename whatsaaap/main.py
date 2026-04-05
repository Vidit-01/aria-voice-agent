import json
import os
from pathlib import Path
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Form
from fastapi.responses import Response

load_dotenv()
app = FastAPI()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATA_FILE = Path("app/data/whatsapp_users.json")
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

# Load context from local workspace instead of hitting backend APIs
KB_FILE = Path("Letuscook/fateh_rag_context.md")
KNOWLEDGE_BASE = KB_FILE.read_text(encoding="utf-8") if KB_FILE.exists() else "You are a helpful AI study abroad assistant. Please guide the student."

def _load_state() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}

def _save_state(state: dict) -> None:
    DATA_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=True), encoding="utf-8")

def _call_llm(prompt: str, system: str = "") -> str:
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY is missing in your .env file."
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
    }
    try:
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=20)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Sorry, I am having trouble connecting to the AI models."

def _generate_summary(history: list) -> str:
    transcript = "\n".join([f"{msg['role']}: {msg['text']}" for msg in history])
    prompt = f"Please summarize the following student counselling chat session concisely (2-3 sentences), capturing the student's key needs, goals, and any advice given:\n\n{transcript}"
    return _call_llm(prompt, system="You are an expert summarization assistant for a study abroad agency.")

def _extract_info(text: str, info_type: str) -> str:
    prompt = f"Extract the {info_type} from the following text and return ONLY the exact value. Do not include extra conversational words. If you are unsure, just return the original text.\n\nText: \"{text}\""
    return _call_llm(prompt, system="You are a data extraction bot. Only reply with the requested data.")

@app.post("/webhook")
async def receive_message(From: str = Form(...), Body: str = Form(...)):
    phone = (From or "").strip()
    message = (Body or "").strip()

    state = _load_state()
    user = state.get(phone)

    # 1. Handle New Users
    if not user:
        user = {
            "phone": phone,
            "onboarding_step": "awaiting_name",
            "profile": {},
            "history": [],
            "summaries": []
        }
        state[phone] = user
        _save_state(state)
        reply = "Hello! I am your AI study abroad assistant. To provide you with personalized advice, could you please tell me your full name?"
        return Response(content=f"<Response><Message>{reply}</Message></Response>", media_type="text/xml")

    # 2. Handle Onboarding State Machine
    step = user.get("onboarding_step")
    if step != "completed":
        if step == "awaiting_name":
            extracted_name = _extract_info(message, "person's full name")
            user["profile"]["full_name"] = extracted_name
            user["onboarding_step"] = "awaiting_age"
            reply = f"Nice to meet you, {extracted_name}! How old are you?"
        elif step == "awaiting_age":
            extracted_age = _extract_info(message, "person's age (just the number)")
            user["profile"]["age"] = extracted_age
            user["onboarding_step"] = "awaiting_countries"
            reply = "Got it! Which countries are you targeting to study in? (e.g., USA, UK, Canada, Australia)"
        elif step == "awaiting_countries":
            extracted_countries = _extract_info(message, "list of target countries")
            user["profile"]["target_countries"] = extracted_countries
            user["onboarding_step"] = "completed"
            reply = "Awesome! Your profile is set up. How can I help you with your study abroad journey today?"
        
        state[phone] = user
        _save_state(state)
        return Response(content=f"<Response><Message>{reply}</Message></Response>", media_type="text/xml")

    # 3. Handle /end command to generate and save chat summaries
    if message.lower() == "/end":
        history = user.get("history", [])
        if history:
            summary = _generate_summary(history)
            user.setdefault("summaries", []).append(summary)
            user["history"] = []  # Clear history for the next session
            reply = f"Session ended. Your chat summary has been saved to your profile:\n\n{summary}"
        else:
            reply = "There is no active chat session to summarize."
        state[phone] = user
        _save_state(state)
        return Response(content=f"<Response><Message>{reply}</Message></Response>", media_type="text/xml")

    # 4. Handle Independent RAG Conversation
    history = user.setdefault("history", [])
    history.append({"role": "Student", "text": message})
    
    # Keep context window manageable (last 10 turns)
    if len(history) > 20:
        history = history[-20:]

    transcript = "\n".join([f"{msg['role']}: {msg['text']}" for msg in history])
    
    profile_str = ", ".join([f"{k.replace('_', ' ').capitalize()}: {v}" for k, v in user.get("profile", {}).items()])
    
    system_prompt = f"""
You are Aria, a friendly and knowledgeable AI study abroad assistant.
You must use the provided Knowledge Base below to answer questions factually. 
Do not make promises about admissions or visa approvals. Be concise and keep answers under 80 words.

STUDENT PROFILE:
{profile_str}

KNOWLEDGE BASE:
{KNOWLEDGE_BASE}
""".strip()
    
    ai_reply = _call_llm(transcript, system=system_prompt)
    history.append({"role": "Aria", "text": ai_reply})
    user["history"] = history
    
    state[phone] = user
    _save_state(state)

    return Response(content=f"<Response><Message>{ai_reply}</Message></Response>", media_type="text/xml")