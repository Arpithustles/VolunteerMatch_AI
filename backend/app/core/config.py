from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "VolunteerMatch AI"
    DATABASE_URL: str = "sqlite:///./dev.db"
    SECRET_KEY: str = "dev-secret-change-me"
    ENVIRONMENT: str = "development"
    SEED_DEMO_DATA: bool = True
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    MATCH_WEIGHTS: str = '{"skills":30,"interests":20,"availability":15,"location":10,"experience":10,"profession":10,"preferences":5}'

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT.lower() == "production":
            if self.SECRET_KEY == "dev-secret-change-me" or len(self.SECRET_KEY) < 32:
                raise ValueError("Production requires a SECRET_KEY with at least 32 characters")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("Production requires a persistent PostgreSQL DATABASE_URL")
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
