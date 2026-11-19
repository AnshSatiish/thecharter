"""Project search: by keyword, by meaning, or both.

keyword.py   The words typed must appear in the project.
semantic.py  Ranked by meaning with the sentence model.
fusion.py    Reciprocal rank fusion of the two lists (pure function).
hybrid.py    keyword + semantic, fused.
indexing.py  Keeps both indexes in step with each project.
"""
from app.services.search.fusion import RRF_K, fuse
from app.services.search.hit import Hit
from app.services.search.hybrid import hybrid_search
from app.services.search.indexing import reindex_all, reindex_project
from app.services.search.keyword import keyword_search, query_terms
from app.services.search.semantic import semantic_search

__all__ = [
    "RRF_K",
    "Hit",
    "fuse",
    "hybrid_search",
    "keyword_search",
    "query_terms",
    "reindex_all",
    "reindex_project",
    "semantic_search",
]
