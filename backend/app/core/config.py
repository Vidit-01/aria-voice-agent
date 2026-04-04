from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    supabase_url: str = Field(default='https://example.supabase.co', alias='SUPABASE_URL')
    supabase_service_role_key: str = Field(default='dev-service-role-key', alias='SUPABASE_SERVICE_ROLE_KEY')
    supabase_anon_key: str = Field(default='dev-anon-key', alias='SUPABASE_ANON_KEY')

    gemini_api_key: str = Field(default='', alias='GEMINI_API_KEY')
    gemini_live_model: str = Field(default='gemini-2.0-flash-live', alias='GEMINI_LIVE_MODEL')
    gemini_flash_model: str = Field(default='gemini-1.5-flash', alias='GEMINI_FLASH_MODEL')

    app_secret_key: str = Field(default='change-me', alias='APP_SECRET_KEY')
    company_name: str = Field(default='YourCompanyName', alias='COMPANY_NAME')
    hot_lead_webhook_url: str | None = Field(default=None, alias='HOT_LEAD_WEBHOOK_URL')
    hot_lead_email: str | None = Field(default=None, alias='HOT_LEAD_EMAIL')

    resume_bucket: str = Field(default='resumes', alias='RESUME_BUCKET')
    frontend_origins: str = Field(default='*', alias='FRONTEND_ORIGINS')
    enable_gemini_video: bool = Field(default=False, alias='ENABLE_GEMINI_VIDEO')

    @property
    def cors_origins(self) -> List[str]:
        if self.frontend_origins.strip() == '*':
            return ['*']
        return [o.strip() for o in self.frontend_origins.split(',') if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
