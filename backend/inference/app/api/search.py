"""Project search endpoint: keyword, semantic (by meaning) or hybrid."""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.embeddings import EmbedderUnavailable, get_embedder
from app.db.models import Project
from app.db.session import get_db
from app.schemas import ProjectOut, SearchHitOut, SearchOut
from app.services.search import Hit, hybrid_search, keyword_search, semantic_search

router = APIRouter(prefix="/projects", tags=["search"])
Mode = Literal["keyword", "semantic", "hybrid"]


@router.get("/search", response_model=SearchOut)
def search_projects(
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str, Query(min_length=1, max_length=200)],
    mode: Annotated[Mode, Query(description="keyword: the words must appear. semantic: ranked by meaning. hybrid: both.")] = "hybrid",
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> SearchOut:
    """Best matches first. A semantic match comes with the passage that matched and its similarity.

    If the sentence model is not available, hybrid falls back to keyword results (see `mode_used`)
    and semantic answers 503.
    """
    used: Mode = mode
    hits: list[Hit]
    if mode == "keyword":
        hits = keyword_search(db, q, limit)
    else:
        try:
            hits = semantic_search(db, q, limit) if mode == "semantic" else hybrid_search(db, q, limit)
        except EmbedderUnavailable as exc:
            if mode == "semantic":
                raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, f"Semantic search is not available: {exc}") from exc
            hits, used = keyword_search(db, q, limit), "keyword"

    projects = {p.id: p for p in db.scalars(select(Project).where(Project.id.in_([h.project_id for h in hits]))).unique()}
    results = []
    for hit in hits:
        project = projects[hit.project_id]
        document = next((d for d in project.documents if d.id == hit.document_id), None)
        results.append(
            SearchHitOut(
                project=ProjectOut.model_validate(project),
                score=round(hit.score, 4),
                matched_by=sorted(set(hit.matched_by)),
                similarity=hit.similarity,
                passage=hit.passage,
                passage_source=hit.passage_source,
                passage_document=document.title if document else None,
            )
        )
    model = get_embedder().name if used != "keyword" else None
    return SearchOut(query=q, mode=mode, mode_used=used, model=model, results=results)
