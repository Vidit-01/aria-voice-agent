# app/notion_handler.py
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_DB_NOTES = os.getenv("NOTION_DB_NOTES")       # Notes database ID
NOTION_DB_REMINDERS = os.getenv("NOTION_DB_REMINDERS")  # Reminders database ID
NOTION_DB_TODOS = os.getenv("NOTION_DB_TODOS")       # To-Do database ID

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

def save_to_notion(content: str, category: str, time: str = None):
    """
    Saves the given message into the correct Notion database based on category.
    category: 'note', 'reminder', or 'todo'
    """
    db_map = {
        "note": NOTION_DB_NOTES,
        "reminder": NOTION_DB_REMINDERS,
        "todo": NOTION_DB_TODOS
    }

    database_id = db_map.get(category)
    if not database_id:
        print(f"⚠️ Unknown category '{category}'. Defaulting to notes database.")
        database_id = NOTION_DB_NOTES

    # Base properties
    data = {
        "parent": {"database_id": database_id},
        "properties": {
            "Content": {"title": [{"text": {"content": content}}]},
            "Type": {"rich_text": [{"text": {"content": category}}]},
            "Created At": {"date": {"start": datetime.now().isoformat()}}
        }
    }

    # Add reminder time if available
    if time:
        data["properties"]["Time"] = {"date": {"start": time}}

    try:
        response = requests.post("https://api.notion.com/v1/pages", headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Successfully added {category} to Notion.")
        else:
            print(f"❌ Notion API Error: {response.status_code} — {response.text}")
    except Exception as e:
        print(f"❌ Notion API Exception: {e}")
