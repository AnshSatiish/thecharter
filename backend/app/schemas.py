"""Request and response schemas. ProjectOut is the shape the frontend depends on."""
import datetime as dt
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

Category = Literal["wildlife", "anthropology", "urban", "border", "news"]
Role = Literal["academic", "journalist"]
Lat = Annotated[float, Field(ge=-90, le=90)]
Lng = Annotated[float, Field(ge=-180, le=180)]
Sdg = Annotated[str, Field(pattern=r"^SDG([1-9]|1[0-7])$")]


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


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: Category
    location_name: str
    lat: float
    lng: float
    date: dt.date
    keywords: list[str]
    sdgs: list[str]
    verified: bool
    images: list[str]
    original_language: str
    title_original: str | None
    description_original: str | None
    author: AuthorBrief

    @computed_field
    @property
    def year(self) -> int:
        return self.date.year


class ProjectNearOut(ProjectOut):
    distance_km: float


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


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1)
    category: Category
    location_name: str = Field(min_length=1, max_length=300)
    lat: Lat
    lng: Lng
    date: dt.date
    keywords: list[str] = []
    sdgs: list[Sdg] = Field(default=[], description='UN SDG codes such as "SDG10"')
    images: list[str] = []
    original_language: str = Field(default="en", max_length=8)
    title_original: str | None = None
    description_original: str | None = None
    translation_reviewed_by: str | None = None

    author_name: str = Field(min_length=1, max_length=200)
    author_affiliation: str | None = None
    author_profession: str | None = None
    author_role: Role = "journalist"
    author_website: str | None = None
