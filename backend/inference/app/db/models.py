"""SQLAlchemy models.

Coordinates are stored as plain lat/lng floats so the schema runs on SQLite too.
On PostgreSQL, init_db adds a generated PostGIS `location` geography column
derived from them (not mapped here, used only in raw spatial SQL).
"""
import datetime as dt

from sqlalchemy import JSON, CheckConstraint, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

CATEGORIES = ("wildlife", "anthropology", "urban", "border", "news")
ROLES = ("academic", "journalist")


class Base(DeclarativeBase):
    pass


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    profession: Mapped[str | None] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(20), default="journalist")
    affiliation: Mapped[str | None] = mapped_column(String(300))
    website: Mapped[str | None] = mapped_column(String(500))
    google_scholar: Mapped[str | None] = mapped_column(String(500))
    researchgate: Mapped[str | None] = mapped_column(String(500))
    academia: Mapped[str | None] = mapped_column(String(500))
    # Region-level only: never store a researcher's precise location.
    region_lat: Mapped[float | None] = mapped_column(Float)
    region_lng: Mapped[float | None] = mapped_column(Float)

    projects: Mapped[list["Project"]] = relationship(back_populates="author", order_by="Project.date.desc()")

    __table_args__ = (CheckConstraint(f"role IN {ROLES}", name="ck_author_role"),)


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

    author: Mapped[Author] = relationship(back_populates="projects", lazy="joined")
    documents: Mapped[list["Document"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", lazy="selectin", order_by="Document.id"
    )
    chunks: Mapped[list["SearchChunk"]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(f"category IN {CATEGORIES}", name="ck_project_category"),
        CheckConstraint("lat BETWEEN -90 AND 90", name="ck_project_lat"),
        CheckConstraint("lng BETWEEN -180 AND 180", name="ck_project_lng"),
    )


class Document(Base):
    """A PDF uploaded for a project. The file lives in UPLOAD_DIR; `text` is kept for keyword search."""

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

    project: Mapped[Project] = relationship(back_populates="documents")
    chunks: Mapped[list["SearchChunk"]] = relationship(cascade="all, delete-orphan")


class SearchChunk(Base):
    """A short passage of a project or of one of its PDFs, with its sentence embedding.

    Semantic search compares the query's embedding with these. `embedding` is a plain JSON list so the
    schema runs on SQLite; on PostgreSQL with pgvector, init_db adds an indexed `embedding_vec` copy.
    """

    __tablename__ = "search_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    source: Mapped[str] = mapped_column(String(20))  # "project" or "document"
    position: Mapped[int] = mapped_column(default=0)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(JSON)
    model: Mapped[str] = mapped_column(String(200))
