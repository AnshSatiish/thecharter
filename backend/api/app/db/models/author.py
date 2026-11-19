"""A photographer, journalist or researcher whose work is in the library."""
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import ROLES, Base

if TYPE_CHECKING:
    from app.db.models.project import Project


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
