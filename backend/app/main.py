import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.profile import router as profile_router
from app.api.session import router as session_router
from app.core.config import get_settings


settings = get_settings()
app = FastAPI(title='Study Abroad Backend', version='1.0.0')
logger = logging.getLogger(__name__)

# Allow any localhost port for local dev; also respect explicit origins from env.
_explicit_origins = [o for o in settings.cors_origins if o != '*']
app.add_middleware(
    CORSMiddleware,
    allow_origins=_explicit_origins,
    allow_origin_regex=r'https?://(localhost|127\.0\.0\.1)(:\d+)?',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router, prefix='/auth', tags=['auth'])
app.include_router(profile_router, prefix='/profile', tags=['profile'])
app.include_router(session_router, prefix='/session', tags=['session'])
app.include_router(chat_router, prefix='/chat', tags=['chat'])
app.include_router(admin_router, prefix='/admin', tags=['admin'])


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
