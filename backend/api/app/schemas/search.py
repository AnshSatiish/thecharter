"""Search responses."""
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.project import ProjectOut


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
