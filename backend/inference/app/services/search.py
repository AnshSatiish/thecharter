"""Project search: by keyword, by meaning, or both.

keyword   The words typed must appear in the project. PostgreSQL full-text search (stemming, field
          weights, ranking); a simpler scorer in Python on SQLite.
semantic  The query is embedded with the sentence model and compared with every stored passage by
          cosine similarity, so a project can match without sharing a word with the query.
          pgvector does the comparison when the server has it, numpy otherwise.
hybrid    Both lists merged with reciprocal rank fusion: exact names still rank first and
          paraphrases are still found.
"""
import re
from dataclasses import dataclass, field

import numpy as np
from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.ai.embeddings import get_embedder
from app.core.config import get_settings
from app.db.models import Document, Project, SearchChunk
from app.db.session import is_postgres
from app.services.search_index import WEIGHTS, has_pgvector, keyword_fields
from app.services.text import STOPWORDS, fold

RRF_K = 60  # the usual constant: a rank-1 result scores 1/61, rank 2 scores 1/62, and so on
_TOKEN = re.compile(r"\w+")


@dataclass
class Hit:
    project_id: int
    score: float
    matched_by: list[str] = field(default_factory=list)
    similarity: float | None = None       # cosine similarity of the best passage, semantic only
    passage: str | None = None            # the passage that matched by meaning
    passage_source: str | None = None     # "project" or "document"
    document_id: int | None = None


def query_terms(q: str) -> list[str]:
    """Words of the query, folded. Filler words are dropped unless the query is nothing else."""
    tokens = _TOKEN.findall(fold(q))
    return [t for t in tokens if t not in STOPWORDS] or tokens


# ---------- keyword ----------

def _keyword_postgres(db: Session, terms: list[str], limit: int, strict: bool) -> list[Hit]:
    # Each word matches either as a stemmed English word ("migrating" finds "migration") or as the start of a
    # word exactly as typed ("migr" finds "migration"), so results appear while the user is still typing.
    words = [f"(to_tsquery('english', :e{i}) || to_tsquery('simple', :p{i}))" for i in range(len(terms))]
    params = {f"e{i}": t for i, t in enumerate(terms)} | {f"p{i}": f"{t}:*" for i, t in enumerate(terms)}

    def run(joiner: str) -> list[Hit]:
        rows = db.execute(
            text(
                f"""
                SELECT p.id, ts_rank_cd(p.search_tsv, query, 32) AS score
                FROM projects p, (SELECT {joiner.join(words)} AS query) AS q
                WHERE p.search_tsv @@ query
                ORDER BY score DESC, p.id
                LIMIT :limit
                """
            ),
            {**params, "limit": limit},
        ).all()
        return [Hit(r.id, float(r.score), ["keyword"]) for r in rows]

    return run(" && ") or ([] if strict or len(terms) == 1 else run(" || "))


def _keyword_python(db: Session, terms: list[str], limit: int, strict: bool) -> list[Hit]:
    patterns = [re.compile(rf"(?<!\w){re.escape(t)}") for t in terms]
    projects = db.scalars(select(Project).options(selectinload(Project.documents).undefer(Document.text))).unique().all()
    scored: list[tuple[int, int, float]] = []  # (terms matched, project id, score)
    for project in projects:
        fields = keyword_fields(project)
        per_term = [
            max((WEIGHTS[name] for name, value in fields.items() if pattern.search(value)), default=0.0)
            for pattern in patterns
        ]
        matched = sum(1 for s in per_term if s)
        if matched:
            scored.append((matched, project.id, sum(per_term) / len(terms)))
    complete = [s for s in scored if s[0] == len(terms)]
    ranked = sorted(complete or ([] if strict else scored), key=lambda s: (-s[2], s[1]))[:limit]
    return [Hit(project_id, score, ["keyword"]) for _, project_id, score in ranked]


def keyword_search(db: Session, q: str, limit: int = 20, strict: bool = False) -> list[Hit]:
    """Projects containing every word of the query. If there are none, projects containing any word,
    unless `strict`."""
    terms = query_terms(q)
    if not terms:
        return []
    search = _keyword_postgres if is_postgres(db) else _keyword_python
    return search(db, terms, limit, strict)


# ---------- semantic ----------

def _best_per_project(rows, limit: int) -> list[Hit]:
    """rows: (project_id, document_id, source, text, similarity), best first."""
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
    query = embedder.embed([q.strip()])[0]

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
        return _best_per_project(rows, limit)

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
    return _best_per_project(rows, limit)


# ---------- hybrid ----------

def fuse(keyword: list[Hit], semantic: list[Hit], limit: int) -> list[Hit]:
    """Reciprocal rank fusion: a project scores 1 / (60 + rank) in each list it appears in."""
    merged: dict[int, Hit] = {}
    for hits in (semantic, keyword):
        for rank, hit in enumerate(hits, start=1):
            target = merged.setdefault(hit.project_id, Hit(hit.project_id, 0.0))
            target.score += 1 / (RRF_K + rank)
            target.matched_by += hit.matched_by
            if hit.passage:
                target.similarity, target.passage = hit.similarity, hit.passage
                target.passage_source, target.document_id = hit.passage_source, hit.document_id
    # Ties go to the closer meaning.
    return sorted(merged.values(), key=lambda h: (-h.score, -(h.similarity or 0), h.project_id))[:limit]


def hybrid_search(db: Session, q: str, limit: int = 20) -> list[Hit]:
    # Strict keywords: a project sharing one stray word with a long query is noise here; meaning covers the rest.
    return fuse(keyword_search(db, q, limit, strict=True), semantic_search(db, q, limit), limit)
