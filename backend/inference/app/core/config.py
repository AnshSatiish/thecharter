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
    # Database connections per server process: a pool of this size, plus overflow when busy. A request that
    # cannot get one within db_pool_timeout seconds is answered "503 busy" instead of waiting.
    # Keep processes x (pool + overflow) below PostgreSQL's max_connections (100 by default): 4 processes x 20 = 80.
    db_pool_size: int = 5
    db_max_overflow: int = 15
    db_pool_timeout: float = 5
    # Semantic search: an open-source sentence embedding model that runs on this machine (no API key, no cost).
    semantic_search: bool = True
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384
    # Longest passage, in words, cut from project text for embedding (tuned by cross-validation).
    embedding_chunk_words: int = 40
    embedding_cache_dir: Path = Path.home() / ".cache" / "charter-models"
    # CPU threads the model may use for one query. Unset: ONNX Runtime's default (all cores), fastest for one
    # user. Under many simultaneous searches, 1 lets each request use its own core instead of all competing.
    embedding_threads: int | None = None
    # A passage is unrelated when its cosine similarity is below this, or below this share of the best result's.
    # Both chosen by 5-fold cross-validation over the judged queries (backend/model_training/compare_models.py).
    semantic_min_score: float = 0.575
    semantic_relative_cut: float = 0.95
    # AI summarization: an open-source sequence-to-sequence model run with PyTorch on this machine (no API, no cost).
    # Model and generation settings chosen by cross-validation (backend/model_training/evaluate_summarizers.py).
    ai_summary: bool = True
    summary_model: str = "sshleifer/distilbart-cnn-6-6"
    summary_prefix: str = ""
    summary_max_new_tokens: int = 60
    summary_num_beams: int = 1

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
