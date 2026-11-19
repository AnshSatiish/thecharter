"""Keyword search: the words typed must appear in the project.

PostgreSQL full-text search (stemming, field weights, ranking); a simpler scorer in Python on SQLite.
"""
import re

from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.db.models import Document, Project
from app.db.session import is_postgres
from app.services.search.hit import Hit
from app.services.search.indexing import WEIGHTS, keyword_fields
from app.text.normalize import STOPWORDS, fold

_TOKEN = re.compile(r"\w+")


def query_terms(q: str) -> list[str]:
    """Words of the query, folded. Filler words are dropped unless the query is nothing else."""
    tokens = _TOKEN.findall(fold(q))
    return [t for t in tokens if t not in STOPWORDS] or tokens


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
