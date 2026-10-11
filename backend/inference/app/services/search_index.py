"""Keep the two search indexes in step with a project.

Keyword search (PostgreSQL only) reads a weighted tsvector on the project row.
Semantic search reads `search_chunks`: short passages of the project and its PDFs, each with a
sentence embedding. Both are rebuilt whenever a project or one of its documents changes.
"""
import logging

from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.ai.embeddings import EmbedderUnavailable, get_embedder
from app.ai.embeddings.chunking import chunk_text
from app.db.models import Project, SearchChunk
from app.db.session import is_postgres
from app.services.text import fold

log = logging.getLogger(__name__)

MAX_DOCUMENT_CHUNKS = 300      # per PDF: about 15,000 words
MAX_DOCUMENT_CHARS = 400_000   # per project, for the keyword index (a tsvector holds at most 1 MB)

# Field groups for keyword search, most important first. PostgreSQL calls these weights A to D.
WEIGHTS = {"title": 1.0, "tags": 0.6, "body": 0.3, "documents": 0.15}
_PG_WEIGHT = {"title": "A", "tags": "B", "body": "C", "documents": "D"}
_pgvector: dict[str, bool] = {}


def keyword_fields(project: Project) -> dict[str, str]:
    """The searchable text of a project by field group, lower-cased with accents stripped."""
    author = project.author
    documents = project.documents
    groups = {
        "title": [project.title, project.title_original],
        "tags": [
            *(project.keywords or []), project.location_name, author.name, author.affiliation,
            *(d.title for d in documents), *(k for d in documents for k in d.keywords or []),
        ],
        "body": [project.description, project.description_original, project.summary, *(project.captions or [])],
        "documents": [" ".join(d.text or "" for d in documents)[:MAX_DOCUMENT_CHARS]],
    }
    return {name: fold(" \n ".join(p for p in parts if p)) for name, parts in groups.items()}


def passages(project: Project) -> list[tuple[str, int | None, str]]:
    """(source, document id, text) for every passage to embed, without repeats."""
    head = ". ".join(p for p in (project.title, project.location_name, ", ".join(project.keywords or [])) if p)
    found: list[tuple[str, int | None, str]] = [("project", None, head)]
    for block in (project.description, project.summary, *(project.captions or [])):
        found += [("project", None, chunk) for chunk in chunk_text(block or "")]
    for document in project.documents:
        found += [("document", document.id, chunk) for chunk in chunk_text(document.text, max_chunks=MAX_DOCUMENT_CHUNKS)]
    seen: set[str] = set()
    return [p for p in found if p[2].strip() and not (p[2] in seen or seen.add(p[2]))]


def has_pgvector(db: Session) -> bool:
    """True when init_db could add the pgvector column (the server has the extension)."""
    bind = db.get_bind()
    key = str(bind.url)
    if key not in _pgvector:
        _pgvector[key] = bind.dialect.name == "postgresql" and bool(db.scalar(text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'search_chunks' AND column_name = 'embedding_vec'"
        )))
    return _pgvector[key]


def _refresh_keyword_index(db: Session, project: Project) -> None:
    fields = keyword_fields(project)
    vector = " || ".join(f"setweight(to_tsvector('english', :{name}), '{_PG_WEIGHT[name]}')" for name in fields)
    db.execute(text(f"UPDATE projects SET search_tsv = {vector} WHERE id = :id"), {**fields, "id": project.id})


def _refresh_passages(db: Session, project: Project) -> None:
    embedder = get_embedder()
    wanted = passages(project)
    existing = db.scalars(select(SearchChunk).where(SearchChunk.project_id == project.id)).all()
    # Passages whose text has not changed keep their vector, so editing a caption does not re-read a whole PDF.
    known = {c.text: c.embedding for c in existing if c.model == embedder.name}
    new_texts = [t for _, _, t in wanted if t not in known]
    known.update(zip(new_texts, embedder.embed(new_texts)))

    db.execute(delete(SearchChunk).where(SearchChunk.project_id == project.id))
    db.add_all(
        SearchChunk(
            project_id=project.id, document_id=document_id, source=source, position=i,
            text=passage, embedding=known[passage], model=embedder.name,
        )
        for i, (source, document_id, passage) in enumerate(wanted)
    )
    db.flush()
    if has_pgvector(db):
        db.execute(
            text("UPDATE search_chunks SET embedding_vec = CAST(CAST(embedding AS text) AS vector) WHERE project_id = :id"),
            {"id": project.id},
        )


def reindex_project(db: Session, project_id: int) -> None:
    """Rebuild both indexes for one project and commit.

    Search is an add-on to saving a project: a failure here is logged and never fails the request.
    """
    try:
        project = db.get(Project, project_id)
        if project is None:
            return
        if is_postgres(db):
            _refresh_keyword_index(db, project)
        try:
            _refresh_passages(db, project)
        except EmbedderUnavailable as exc:
            log.warning("Project %s was not indexed for semantic search: %s", project_id, exc)
        db.commit()
    except Exception:
        db.rollback()
        log.exception("Could not rebuild the search index for project %s", project_id)


def reindex_all(db: Session) -> int:
    ids = list(db.scalars(select(Project.id).order_by(Project.id)))
    for project_id in ids:
        reindex_project(db, project_id)
    return len(ids)
