"""Pydantic request and response schemas, one file per resource. Import from here."""
from app.schemas.ai import (
    KeywordsIn,
    KeywordsOut,
    PdfExtractOut,
    SummarizeIn,
    SummaryOut,
)
from app.schemas.author import AuthorBrief, AuthorDetail, AuthorOut, AuthorProject
from app.schemas.common import Category, Lat, Lng, Role, Sdg
from app.schemas.document import DocumentOut
from app.schemas.geo import LocationCheckOut
from app.schemas.project import ProjectIn, ProjectNearOut, ProjectOut, ProjectPatch
from app.schemas.search import SearchHitOut, SearchOut

__all__ = [
    "AuthorBrief", "AuthorDetail", "AuthorOut", "AuthorProject", "Category", "DocumentOut", "KeywordsIn",
    "KeywordsOut", "Lat", "Lng", "LocationCheckOut", "PdfExtractOut", "ProjectIn", "ProjectNearOut", "ProjectOut",
    "ProjectPatch", "Role", "SearchHitOut", "SearchOut", "Sdg", "SummarizeIn", "SummaryOut",
]
