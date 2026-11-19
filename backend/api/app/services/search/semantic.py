"""Semantic search: ranked by meaning.

The query is embedded with the sentence model and compared with every stored passage by cosine
similarity, so a project can match without sharing a word with the query. pgvector does the
comparison when the server has it, numpy otherwise.
"""
import numpy as np
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.ai.embeddings import get_embedder
from app.core.config import get_settings
from app.db.models import SearchChunk
from app.services.search.hit import Hit
from app.services.search.indexing import has_pgvector


def best_per_project(rows, limit: int) -> list[Hit]:
    """Keep each project's best passage. rows: (project_id, document_id, source, text, similarity), best first.

    Stops at the first passage below the absolute floor (SEMANTIC_MIN_SCORE) or below
    SEMANTIC_RELATIVE_CUT times the best result's similarity.
    """
    settings = get_settings()
    best: dict[int, Hit] = {}
    floor = settings.semantic_min_score
    for project_id, document_id, source, passage, similarity in rows:
        if not similarity >= floor:  # also stops on NaN, which a blank vector gives
            break
        if project_id in best:
            continue
        floor = max(floor, similarity * settings.semantic_relative_cut) if not best else floor
        best[project_id] = Hit(
            project_id, float(similarity), ["semantic"], similarity=round(float(similarity), 4),
            passage=passage, passage_source=source, document_id=document_id,
        )
    return list(best.values())[:limit]


def semantic_search(db: Session, q: str, limit: int = 20) -> list[Hit]:
    """Raises EmbedderUnavailable when the model is switched off or cannot be loaded."""
    if not q.strip():
        return []
    embedder = get_embedder()
    query = embedder.embed_query(q.strip())

    if has_pgvector(db):
        nearest = min(limit * 10, 1000)  # several passages can belong to one project
        db.execute(text(f"SET LOCAL hnsw.ef_search = {nearest}"))
        rows = db.execute(
            text(
                """
                SELECT project_id, document_id, source, text, 1 - (embedding_vec <=> CAST(:query AS vector)) AS similarity
                FROM search_chunks
                WHERE embedding_vec IS NOT NULL AND model = :model
                ORDER BY embedding_vec <=> CAST(:query AS vector)
                LIMIT :nearest
                """
            ),
            {"query": str(query), "model": embedder.name, "nearest": nearest},
        ).all()
        return best_per_project(rows, limit)

    chunks = db.execute(
        select(SearchChunk.project_id, SearchChunk.document_id, SearchChunk.source, SearchChunk.text, SearchChunk.embedding)
        .where(SearchChunk.model == embedder.name)
    ).all()
    if not chunks:
        return []
    # Vectors are unit length, so the dot product is the cosine similarity.
    similarities = np.asarray([c.embedding for c in chunks], dtype=np.float32) @ np.asarray(query, dtype=np.float32)
    order = np.argsort(-similarities)
    rows = ((*chunks[i][:4], similarities[i]) for i in order)
    return best_per_project(rows, limit)
