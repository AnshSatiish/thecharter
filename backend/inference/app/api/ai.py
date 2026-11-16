"""Text summarization, PDF extraction and keyword endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.ai.summarization import summarize_with_fallback
from app.api.documents import read_pdf
from app.core.security import require_admin
from app.schemas import KeywordsIn, KeywordsOut, PdfExtractOut, SummarizeIn, SummaryOut
from app.services.storage import safe_filename
from app.services.text import KEYWORD_METHOD, SUMMARY_METHOD, extract_keywords, summarize

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/summarize", response_model=SummaryOut, dependencies=[Depends(require_admin)])
def summarize_text(body: SummarizeIn) -> SummaryOut:
    """Summarize text using the requested method."""
    if body.method == "ai":
        summary, method, fallback = summarize_with_fallback(body.text, body.max_sentences)
        return SummaryOut(summary=summary, method=method, fallback=fallback)
    return SummaryOut(summary=summarize(body.text, body.max_sentences), method=SUMMARY_METHOD)


@router.post("/keywords", response_model=KeywordsOut)
def keywords(body: KeywordsIn) -> KeywordsOut:
    return KeywordsOut(keywords=extract_keywords(body.text, body.top_k), method=KEYWORD_METHOD)


@router.post("/extract-pdf", response_model=PdfExtractOut, dependencies=[Depends(require_admin)])
def extract_pdf(
    file: Annotated[UploadFile, File()],
    generate_summary: Annotated[bool, Form()] = False,
) -> PdfExtractOut:
    """Extract PDF text and keywords; draft a summary only when requested."""
    _, text, pages = read_pdf(file)
    if generate_summary:
        summary, method, fallback = summarize_with_fallback(text)
    else:
        summary, method, fallback = "", "not-requested", False
    return PdfExtractOut(
        filename=safe_filename(file.filename or "", default="document.pdf"),
        pages=pages,
        characters=len(text),
        summary=summary,
        summary_method=method,
        fallback=fallback,
        keywords=extract_keywords(text),
        has_text=bool(text.strip()),
        text=text,
    )
