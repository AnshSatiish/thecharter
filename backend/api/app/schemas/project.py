"""Project requests and responses. ProjectOut is the shape the frontend depends on."""
import datetime as dt

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
    model_validator,
)

from app.schemas.author import AuthorBrief
from app.schemas.common import Category, Lat, Lng, Role, Sdg
from app.schemas.document import DocumentOut


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
    captions: list[str] = []
    summary: str | None = None
    original_language: str
    title_original: str | None
    description_original: str | None
    author: AuthorBrief
    documents: list[DocumentOut] = []

    @field_validator("captions", mode="before")
    @classmethod
    def _null_captions(cls, v: list[str] | None) -> list[str]:
        return v or []

    @model_validator(mode="after")
    def _captions_match_images(self) -> "ProjectOut":
        """One caption per image: pad with "" (or trim) so the frontend can index them together."""
        n = len(self.images)
        self.captions = (self.captions + [""] * n)[:n]
        return self

    @computed_field
    @property
    def year(self) -> int:
        return self.date.year


class ProjectNearOut(ProjectOut):
    distance_km: float


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
    captions: list[str] = Field(default=[], description="Photo narration written by the admin, one per image")
    summary: str | None = None
    original_language: str = Field(default="en", max_length=8)
    title_original: str | None = None
    description_original: str | None = None
    translation_reviewed_by: str | None = None

    author_name: str = Field(min_length=1, max_length=200)
    author_affiliation: str | None = None
    author_profession: str | None = None
    author_role: Role = "journalist"
    author_website: str | None = None


class ProjectPatch(BaseModel):
    """Admin edits. Only the fields sent are changed."""

    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, min_length=1)
    summary: str | None = None
    captions: list[str] | None = None
    keywords: list[str] | None = None
