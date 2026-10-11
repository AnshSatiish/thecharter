"""Application settings, read from environment variables and backend/.env."""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_ADMIN_TOKEN = "dev-admin-token"
BACKEND_ROOT = Path(__file__).resolve().parents[3]  # the backend/ folder; shared data lives in backend/data


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["development", "production", "test"] = "development"
    database_url: str = "sqlite:///./charter.db"
    admin_token: str | None = None
    cors_origins: str = "http://localhost:5173,http://localhost:3031,http://localhost:8080"
    upload_dir: Path = BACKEND_ROOT / "data" / "uploads"
    max_image_mb: int = 25
    max_pdf_mb: int = 50
    # Semantic search: an open-source sentence embedding model that runs on this machine (no API key, no cost).
    semantic_search: bool = True
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    embedding_dim: int = 384
    embedding_cache_dir: Path = Path.home() / ".cache" / "charter-models"
    # A passage is unrelated when its cosine similarity is below this, or below this share of the best result's.
    # Tuned on the sample projects: off-topic queries peak near 0.22, related passages start near 0.29.
    semantic_min_score: float = 0.28
    semantic_relative_cut: float = 0.65

    @field_validator("upload_dir", "embedding_cache_dir")
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
