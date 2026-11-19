"""Author (photographer, journalist, researcher) responses."""
import datetime as dt

from pydantic import BaseModel, ConfigDict

from app.schemas.common import Category, Role


class AuthorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    profession: str | None
    role: Role
    affiliation: str | None
    website: str | None
    google_scholar: str | None
    researchgate: str | None
    academia: str | None


class AuthorOut(AuthorBrief):
    region_lat: float | None
    region_lng: float | None


class AuthorProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    lat: float
    lng: float
    location_name: str
    date: dt.date
    category: Category


class AuthorDetail(AuthorOut):
    projects: list[AuthorProject]
