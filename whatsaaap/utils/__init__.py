from datetime import datetime
import re

def valid_datetime(dt_str: str) -> bool:
    """Check if a string is a valid ISO datetime."""
    try:
        datetime.fromisoformat(dt_str)
        return True
    except:
        return False

def clean_text(text: str) -> str:
    """Simple text cleaning for message input."""
    text = re.sub(r'\s+', ' ', text)
    return text.strip().lower()

def pretty_time(dt_str: str) -> str:
    """Convert ISO datetime into a readable format for user messages."""
    try:
        dt = datetime.fromisoformat(dt_str)
        return dt.strftime("%A, %d %B %Y at %I:%M %p")
    except:
        return dt_str
