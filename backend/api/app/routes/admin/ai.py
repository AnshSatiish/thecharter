"""Admin AI helpers: draft a summary, and read an unsaved PDF for the upload form."""
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from app.ai.keywords import extract_keywords
from app.ai.summarization import SUMMARY_METHOD, summarize, summarize_with_fallback
from app.schemas import PdfExtractOut, SummarizeIn, SummaryOut
from app.services.files.storage import safe_filename
from app.services.files.validation import read_pdf

router = APIRouter(prefix="/ai", tags=["admin: ai"])


@router.post("/summarize", response_model=SummaryOut)
def summarize_text(body: SummarizeIn) -> SummaryOut:
    """Summarize text using the requested method."""
    if body.method == "ai":
        summary, method, fallback = summarize_with_fallback(body.text, body.max_sentences)
        return SummaryOut(summary=summary, method=method, fallback=fallback)
    return SummaryOut(summary=summarize(body.text, body.max_sentences), method=SUMMARY_METHOD)


@router.post("/extract-pdf", response_model=PdfExtractOut)
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
