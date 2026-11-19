"""A short passage of a project or of one of its PDFs, with its sentence embedding.

Semantic search compares the query's embedding with these. `embedding` is a plain JSON list so the
schema runs on SQLite; on PostgreSQL with pgvector, init_db adds an indexed `embedding_vec` copy.
"""
from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.models.base import Base


class SearchChunk(Base):
    __tablename__ = "search_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    source: Mapped[str] = mapped_column(String(20))  # "project" or "document"
    position: Mapped[int] = mapped_column(default=0)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(JSON)
    model: Mapped[str] = mapped_column(String(200))
