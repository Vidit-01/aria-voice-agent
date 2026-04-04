from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    supabase_url: str = Field(default='https://example.supabase.co', alias='SUPABASE_URL')
    supabase_service_role_key: str = Field(default='dev-service-role-key', alias='SUPABASE_SERVICE_ROLE_KEY')
    supabase_anon_key: str = Field(default='dev-anon-key', alias='SUPABASE_ANON_KEY')

    gemini_api_key: str = Field(default='', alias='GEMINI_API_KEY')
    gemini_flash_model: str = Field(default='gemini-2.5-flash', alias='GEMINI_FLASH_MODEL')
    gemini_request_timeout_seconds: int = Field(default=300, alias='GEMINI_REQUEST_TIMEOUT_SECONDS')
    rag_embed_model: str = Field(default='text-embedding-004', alias='RAG_EMBED_MODEL')
    rag_chat_model: str = Field(default='gemini-2.5-flash', alias='RAG_CHAT_MODEL')
    rag_top_k: int = Field(default=4, alias='RAG_TOP_K')
    rag_chunk_size: int = Field(default=1000, alias='RAG_CHUNK_SIZE')
    rag_chunk_overlap: int = Field(default=150, alias='RAG_CHUNK_OVERLAP')

    app_secret_key: str = Field(default='change-me', alias='APP_SECRET_KEY')
    company_name: str = Field(default='YourCompanyName', alias='COMPANY_NAME')
    hot_lead_webhook_url: str | None = Field(default=None, alias='HOT_LEAD_WEBHOOK_URL')
    hot_lead_email: str | None = Field(default=None, alias='HOT_LEAD_EMAIL')

    resume_bucket: str = Field(default='resumes', alias='RESUME_BUCKET')
    frontend_origins: str = Field(default='*', alias='FRONTEND_ORIGINS')
    enable_gemini_video: bool = Field(default=False, alias='ENABLE_GEMINI_VIDEO')

    @field_validator('enable_gemini_video', mode='before')
    @classmethod
    def _coerce_bool(cls, value: object) -> bool:
        if value in (None, ''):
            return False
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {'1', 'true', 'yes', 'y', 'on'}

    @property
    def cors_origins(self) -> List[str]:
        value = self.frontend_origins.strip()
        if not value or value == '*':
            return ['*']
        return [o.strip() for o in value.split(',') if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
