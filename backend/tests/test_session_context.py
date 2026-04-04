from app.services.session_context import SessionContextStore


def test_session_context_lifecycle() -> None:
    store = SessionContextStore(ttl_minutes=1)
    store.create('s1', {'user_id': 'u1'})
    assert store.get('s1') is not None
    store.update('s1', {'language_detected': 'en'})
    assert store.get('s1')['language_detected'] == 'en'
    store.clear('s1')
    assert store.get('s1') is None
