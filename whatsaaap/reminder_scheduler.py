import os
import requests
from textblob import TextBlob
from dateparser import parse
from fuzzywuzzy import fuzz

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# --- Text Cleaning and Spell Correction ---
def clean_and_correct_text(text: str) -> str:
    """
    Auto-correct spelling and clean user message.
    """
    corrected = str(TextBlob(text).correct())
    return corrected.strip().lower()

# --- Fuzzy Logic for Command Detection ---
def detect_intent(text: str) -> str:
    """
    Detects if text is a reminder, note, or to-do using fuzzy matching + keywords.
    """
    reminder_keywords = ["remind", "alarm", "notify", "remember", "alert"]
    note_keywords = ["note", "save", "remember this", "important", "keep this"]
    todo_keywords = ["todo", "task", "list", "work on", "complete", "have to"]

    def match_any(keywords):
        return any(fuzz.partial_ratio(word, text) > 70 for word in keywords)

    if match_any(reminder_keywords):
        return "reminder"
    elif match_any(todo_keywords):
        return "todo"
    elif match_any(note_keywords):
        return "note"
    else:
        # Fallback to AI classification
        return classify_intent_with_ai(text)

# --- OpenRouter API Call ---
def call_openrouter_ai(prompt: str) -> str:
    """
    Calls the OpenRouter API to get AI-based interpretation of text.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4o-mini",  # You can switch to another model like 'mistralai/mixtral-8x7b'
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("OpenRouter API error:", e)
        return None

# --- AI-based Classification Fallback ---
def classify_intent_with_ai(text: str) -> str:
    """
    Uses AI to classify a message into: reminder, note, or todo.
    """
    prompt = f"""
    Classify the following message into one of these categories:
    - reminder
    - note
    - todo

    Message: "{text}"

    Return only one word: reminder, note, or todo.
    """
    result = call_openrouter_ai(prompt)
    if result and any(word in result.lower() for word in ["reminder", "note", "todo"]):
        return result.lower()
    return "note"

# --- Smart Time Parsing ---
def smart_time_inference(text: str):
    """
    Infers datetime from informal text using dateparser + AI fallback.
    """
    # Step 1: Try dateparser
    dt = parse(text)
    if dt:
        return dt

    # Step 2: If dateparser fails, ask AI
    ai_guess = call_openrouter_ai(
        f"Extract an exact date/time from this text: '{text}'. "
        "Return ISO format (YYYY-MM-DDTHH:MM:SS) or 'None' if unclear."
    )

    # Basic validation for AI output
    if ai_guess and any(char.isdigit() for char in ai_guess):
        return ai_guess

    return None

# --- Combined Function for Processing ---
def process_message_with_ai(message_text: str):
    """
    Full pipeline: clean text → detect intent → infer time (if needed)
    """
    corrected = clean_and_correct_text(message_text)
    intent = detect_intent(corrected)
    time = smart_time_inference(corrected) if intent == "reminder" else None

    return {
        "corrected_text": corrected,
        "intent": intent,
        "time": time,
    }
