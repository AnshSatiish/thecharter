"""Create tables, plus the PostGIS column and index on PostgreSQL.

Alembic migrations are planned; until then this is idempotent and safe to rerun.
"""
from sqlalchemy import Engine, text

from app.db.models import Base

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


def init_db(engine: Engine) -> None:
    Base.metadata.create_all(engine)
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            for stmt in _POSTGIS_STEPS:
                conn.execute(text(stmt))
