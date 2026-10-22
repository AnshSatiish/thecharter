"""AI helper endpoints: summaries and keywords the admin can accept or edit.

Photo narration is not here on purpose: it is written by the admin, never generated.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.documents import read_pdf
from app.core.security import require_admin
from app.schemas import KeywordsIn, KeywordsOut, PdfExtractOut, SummarizeIn, SummaryOut
from app.services.storage import safe_filename
from app.ai.summarization import SummarizerUnavailable, get_summarizer
from app.services.text import METHOD, extract_keywords, summarize

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/summarize", response_model=SummaryOut)
def summarize_text(body: SummarizeIn) -> SummaryOut:
    """A draft summary for the administrator to review. With method=ai the summarization model writes it;
    if the model cannot be loaded, the extractive baseline answers and `fallback` is true."""
    if body.method == "ai":
        try:
            summarizer = get_summarizer()
            return SummaryOut(summary=summarizer.summarize(body.text), method=f"ai:{summarizer.name}")
        except SummarizerUnavailable:
            return SummaryOut(summary=summarize(body.text, body.max_sentences), method=METHOD, fallback=True)
    return SummaryOut(summary=summarize(body.text, body.max_sentences), method=METHOD)


@router.post("/keywords", response_model=KeywordsOut)
def keywords(body: KeywordsIn) -> KeywordsOut:
    return KeywordsOut(keywords=extract_keywords(body.text, body.top_k), method=METHOD)


@router.post("/extract-pdf", response_model=PdfExtractOut, dependencies=[Depends(require_admin)])
def extract_pdf(file: Annotated[UploadFile, File()]) -> PdfExtractOut:
    """Read a PDF and suggest a summary and keywords without saving anything.

    The admin form calls this to prefill fields before the project exists.
    """
    _, text, pages = read_pdf(file)
    return PdfExtractOut(
        filename=safe_filename(file.filename or "", default="document.pdf"),
        pages=pages,
        characters=len(text),
        summary=summarize(text),
        keywords=extract_keywords(text),
        has_text=bool(text.strip()),
        text=text,
    )
