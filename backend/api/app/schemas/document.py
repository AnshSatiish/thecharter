"""Uploaded PDF responses."""
import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.services.files.storage import URL_PREFIX


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
