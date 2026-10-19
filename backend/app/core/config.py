from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Highlands Coffee"
    API_V1_STR: str = "/api"

    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5555
    POSTGRES_DB: str = "highland_coffee"

    # Async Database URL (e.g. postgresql+asyncpg://user:pass@localhost:5555/highland_coffee)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5555/highland_coffee"
    # Sync Database URL for Alembic & Seed (e.g. postgresql://user:pass@localhost:5555/highland_coffee)
    SYNC_DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5555/highland_coffee"
    )

    # Security & JWT
    SECRET_KEY: str = "highland-coffee-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Seed Admin Defaults
    INITIAL_ADMIN_EMAIL: str = "admin@highland.vn"
    INITIAL_ADMIN_PASSWORD: str = "Admin@123456"
    INITIAL_ADMIN_NAME: str = "Highlands Administrator"
    INITIAL_ADMIN_PHONE: str = "0901234567"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
