"""Hybrid search: keyword and semantic results merged by reciprocal rank fusion.

Exact names still rank first and paraphrases are still found.
"""
from sqlalchemy.orm import Session

from app.services.search.fusion import fuse
from app.services.search.hit import Hit
from app.services.search.keyword import keyword_search
from app.services.search.semantic import semantic_search


def hybrid_search(db: Session, q: str, limit: int = 20) -> list[Hit]:
    # Strict keywords: a project sharing one stray word with a long query is noise here; meaning covers the rest.
    return fuse(keyword_search(db, q, limit, strict=True), semantic_search(db, q, limit), limit)
