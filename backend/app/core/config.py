from pathlib import Path
from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Placeholder that must never be used to sign real tokens.
PLACEHOLDER_SECRET_KEY = "highland-coffee-super-secret-key-change-in-production-min-32-chars"

MIN_SECRET_KEY_LENGTH = 32


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
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Login throttling (per client IP + email, in-process sliding window)
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300  # 5 minutes

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

    @model_validator(mode="after")
    def _validate_secret_key(self) -> "Settings":
        """Fail fast when the JWT signing key is missing or still a placeholder.

        A missing ``backend/.env`` used to silently sign tokens with a public
        hard-coded key, which makes every deployment forgeable.
        """
        if not self.SECRET_KEY.strip():
            raise ValueError(
                "SECRET_KEY is not configured. Copy 'backend/.env.example' to 'backend/.env' "
                f"and set SECRET_KEY to a random string of at least {MIN_SECRET_KEY_LENGTH} characters."
            )
        if self.SECRET_KEY == PLACEHOLDER_SECRET_KEY:
            raise ValueError(
                "SECRET_KEY still uses the built-in placeholder value. "
                "Set a unique random secret in 'backend/.env' before starting the app."
            )
        if len(self.SECRET_KEY) < MIN_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY must be at least {MIN_SECRET_KEY_LENGTH} characters long "
                f"(got {len(self.SECRET_KEY)})."
            )
        return self


settings = Settings()
