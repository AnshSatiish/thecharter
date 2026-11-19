"""A PDF uploaded for a project. The file lives in UPLOAD_DIR; `text` is kept for keyword search."""
import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base

if TYPE_CHECKING:
    from app.db.models.project import Project
    from app.db.models.search_chunk import SearchChunk


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    filename: Mapped[str] = mapped_column(String(300))
    path: Mapped[str] = mapped_column(String(600))
    size_bytes: Mapped[int] = mapped_column()
    pages: Mapped[int] = mapped_column(default=0)
    text: Mapped[str] = mapped_column(Text, default="", deferred=True)
    summary: Mapped[str | None] = mapped_column(Text)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    uploaded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))

    project: Mapped["Project"] = relationship(back_populates="documents")
    chunks: Mapped[list["SearchChunk"]] = relationship(cascade="all, delete-orphan")
