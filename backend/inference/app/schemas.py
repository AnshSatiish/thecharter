"""Request and response schemas. ProjectOut is the shape the frontend depends on."""
import datetime as dt
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator

from app.services.storage import URL_PREFIX

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


class DocumentOut(BaseModel):
    """An uploaded PDF. The extracted full text is searchable but never returned."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    filename: str
    path: str = Field(exclude=True)
    size_bytes: int
    pages: int
    summary: str | None
    keywords: list[str]
    uploaded_at: dt.datetime

    @computed_field
    @property
    def url(self) -> str:
        return f"{URL_PREFIX}/{self.path}"


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


class SearchHitOut(BaseModel):
    project: ProjectOut
    score: float = Field(description="Ranking score; only comparable within one response")
    matched_by: list[Literal["keyword", "semantic"]]
    similarity: float | None = Field(default=None, description="Cosine similarity of the best passage, 0 to 1")
    passage: str | None = Field(default=None, description="The passage that matched by meaning")
    passage_source: Literal["project", "document"] | None = None
    passage_document: str | None = Field(default=None, description="Title of the PDF the passage comes from")


class SearchOut(BaseModel):
    query: str
    mode: Literal["keyword", "semantic", "hybrid"]
    mode_used: Literal["keyword", "semantic", "hybrid"]
    model: str | None = Field(description="The sentence model behind semantic results")
    results: list[SearchHitOut]


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


class SummarizeIn(BaseModel):
    text: str = Field(max_length=500_000)
    max_sentences: int = Field(default=3, ge=1, le=10)


class SummaryOut(BaseModel):
    summary: str
    method: str


class KeywordsIn(BaseModel):
    text: str = Field(max_length=500_000)
    top_k: int = Field(default=8, ge=1, le=30)


class KeywordsOut(BaseModel):
    keywords: list[str]
    method: str


class PdfExtractOut(BaseModel):
    """Suggestions from a PDF that has not been saved."""

    filename: str
    pages: int
    characters: int
    summary: str
    keywords: list[str]
    has_text: bool
