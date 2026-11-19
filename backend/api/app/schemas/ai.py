"""Request and response bodies of the AI helper endpoints (summaries, keywords, PDF extraction)."""
from typing import Literal

from pydantic import BaseModel, Field


class SummarizeIn(BaseModel):
    text: str = Field(max_length=500_000)
    max_sentences: int = Field(default=3, ge=1, le=10, description="Extractive method only")
    method: Literal["ai", "extractive"] = Field(
        default="extractive", description="ai: use the abstractive model. extractive: select sentences with TF-IDF."
    )


class SummaryOut(BaseModel):
    summary: str
    method: str
    fallback: bool = Field(default=False, description="True when AI was unavailable and the TF-IDF summary was used")


class KeywordsIn(BaseModel):
    text: str = Field(max_length=500_000)
    top_k: int = Field(default=8, ge=1, le=30)


class KeywordsOut(BaseModel):
    keywords: list[str]
    method: str


class PdfExtractOut(BaseModel):
    """Extracted text, optional summary and keywords from an unsaved PDF."""

    filename: str
    pages: int
    characters: int
    summary: str
    summary_method: str
    fallback: bool = Field(description="True when the AI model was unavailable and TF-IDF sentence scoring was used")
    keywords: list[str]
    has_text: bool
    text: str = Field(description="The extracted text, for the admin form")
