"""Keyword suggestions: open to everyone (no model, no cost). Summaries and PDF extraction are admin routes."""
from fastapi import APIRouter

from app.ai.keywords import KEYWORD_METHOD, extract_keywords
from app.schemas import KeywordsIn, KeywordsOut

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/keywords", response_model=KeywordsOut)
def keywords(body: KeywordsIn) -> KeywordsOut:
    return KeywordsOut(keywords=extract_keywords(body.text, body.top_k), method=KEYWORD_METHOD)
