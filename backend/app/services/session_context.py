from datetime import datetime, timedelta, timezone
from threading import RLock
from typing import Any


class SessionContextStore:
    def __init__(self, ttl_minutes: int = 180) -> None:
        self._ttl = timedelta(minutes=ttl_minutes)
        self._store: dict[str, dict[str, Any]] = {}
        self._lock = RLock()

    def create(self, session_id: str, context: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            enriched = {**context, '_updated_at': datetime.now(timezone.utc)}
            self._store[session_id] = enriched
            return enriched

    def get(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            item = self._store.get(session_id)
            if not item:
                return None
            if self._is_expired(item):
                self._store.pop(session_id, None)
                return None
            return item

    def update(self, session_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        with self._lock:
            existing = self.get(session_id)
            if not existing:
                return None
            existing.update(updates)
            existing['_updated_at'] = datetime.now(timezone.utc)
            return existing

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._store.pop(session_id, None)

    def cleanup_expired(self) -> None:
        with self._lock:
            expired = [sid for sid, item in self._store.items() if self._is_expired(item)]
            for sid in expired:
                self._store.pop(sid, None)

    def _is_expired(self, item: dict[str, Any]) -> bool:
        updated_at = item.get('_updated_at')
        if not updated_at:
            return True
        return datetime.now(timezone.utc) - updated_at > self._ttl


session_context_store = SessionContextStore()
