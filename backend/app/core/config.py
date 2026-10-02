"""Application settings, read from environment variables and backend/.env."""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_ADMIN_TOKEN = "dev-admin-token"
REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["development", "production", "test"] = "development"
    database_url: str = "sqlite:///./charter.db"
    admin_token: str | None = None
    cors_origins: str = "http://localhost:5173,http://localhost:3031,http://localhost:8080"
    upload_dir: Path = REPO_ROOT / "data" / "uploads"
    max_image_mb: int = 25
    max_pdf_mb: int = 50

    @field_validator("upload_dir")
    @classmethod
    def _absolute_upload_dir(cls, v: Path) -> Path:
        return v.expanduser().resolve()

    @field_validator("database_url")
    @classmethod
    def _use_psycopg3(cls, v: str) -> str:
        """Plain postgresql:// URLs would pick psycopg2; point them at psycopg (v3)."""
        for prefix in ("postgresql://", "postgres://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @model_validator(mode="after")
    def _admin_token_policy(self) -> "Settings":
        if not self.admin_token:
            if self.env == "production":
                raise ValueError("ADMIN_TOKEN must be set when ENV=production")
            self.admin_token = DEV_ADMIN_TOKEN
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")


@lru_cache
def get_settings() -> Settings:
    return Settings()
