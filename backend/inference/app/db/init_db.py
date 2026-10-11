"""Create tables, add columns introduced after the first release, and set up PostGIS, full-text search and pgvector on PostgreSQL.

Alembic migrations are planned; until then this is idempotent and safe to rerun,
so existing development databases keep working.
"""
import warnings

from sqlalchemy import Engine, inspect, text
from sqlalchemy.exc import DBAPIError, SAWarning

from app.core.config import get_settings
from app.db.models import Base

# Columns added to existing tables since the first schema: {table: {column: SQL type}}.
_ADDED_COLUMNS = {"projects": {"captions": "JSON", "summary": "TEXT"}}

_POSTGIS_STEPS = (
    "CREATE EXTENSION IF NOT EXISTS postgis",
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'projects' AND column_name = 'location'
        ) THEN
            ALTER TABLE projects ADD COLUMN location geography(Point, 4326)
                GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;
        END IF;
    END $$;
    """,
    "CREATE INDEX IF NOT EXISTS ix_projects_location ON projects USING GIST (location)",
)


# Keyword search: a tsvector the application fills in (see services/search_index.py), with a GIN index.
_FULLTEXT_STEPS = (
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS search_tsv tsvector",
    "CREATE INDEX IF NOT EXISTS ix_projects_search_tsv ON projects USING GIN (search_tsv)",
)


def _pgvector_steps(dim: int) -> tuple[str, ...]:
    return (
        f"ALTER TABLE search_chunks ADD COLUMN IF NOT EXISTS embedding_vec vector({dim})",
        "CREATE INDEX IF NOT EXISTS ix_search_chunks_embedding_vec ON search_chunks "
        "USING hnsw (embedding_vec vector_cosine_ops)",
    )


def _setup_pgvector(engine: Engine) -> bool:
    """Semantic search uses pgvector when the server has it; without it the API compares vectors itself."""
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except DBAPIError:
        return False
    with engine.begin() as conn:
        for stmt in _pgvector_steps(get_settings().embedding_dim):
            conn.execute(text(stmt))
    return True


def _add_missing_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    with engine.begin() as conn, warnings.catch_warnings():
        # Reflection does not know the PostGIS geography type; only column names matter here.
        warnings.simplefilter("ignore", SAWarning)
        for table, columns in _ADDED_COLUMNS.items():
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))


def init_db(engine: Engine) -> None:
    Base.metadata.create_all(engine)
    _add_missing_columns(engine)
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            for stmt in _POSTGIS_STEPS + _FULLTEXT_STEPS:
                conn.execute(text(stmt))
        _setup_pgvector(engine)
