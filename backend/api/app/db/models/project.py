"""A photojournalism or research project: one pin on the map.

Coordinates are stored as plain lat/lng floats so the schema runs on SQLite too.
On PostgreSQL, init_db adds a generated PostGIS `location` geography column
derived from them (not mapped here, used only in raw spatial SQL).
"""
import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import JSON, CheckConstraint, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import CATEGORIES, Base

if TYPE_CHECKING:
    from app.db.models.author import Author
    from app.db.models.document import Document
    from app.db.models.search_chunk import SearchChunk


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(20), index=True)
    location_name: Mapped[str] = mapped_column(String(300))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    date: Mapped[dt.date] = mapped_column(Date, index=True)
    verified: Mapped[bool] = mapped_column(default=False)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    sdgs: Mapped[list[str]] = mapped_column(JSON, default=list)
    images: Mapped[list[str]] = mapped_column(JSON, default=list)
    # Photo narration, parallel to `images`. Written by the admin, never generated.
    captions: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    summary: Mapped[str | None] = mapped_column(Text)
    original_language: Mapped[str] = mapped_column(String(8), default="en")
    title_original: Mapped[str | None] = mapped_column(String(500))
    description_original: Mapped[str | None] = mapped_column(Text)
    translation_reviewed_by: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"), index=True)

    author: Mapped["Author"] = relationship(back_populates="projects", lazy="joined")
    documents: Mapped[list["Document"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", lazy="selectin", order_by="Document.id"
    )
    chunks: Mapped[list["SearchChunk"]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(f"category IN {CATEGORIES}", name="ck_project_category"),
        CheckConstraint("lat BETWEEN -90 AND 90", name="ck_project_lat"),
        CheckConstraint("lng BETWEEN -180 AND 180", name="ck_project_lng"),
    )
