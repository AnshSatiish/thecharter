"""Load the sample dataset: `python -m app.scripts.seed` (run from backend/).

Creates tables first. Idempotent: projects are upserted by id, authors deduplicated by name.
Also builds the search indexes (the first run downloads the sentence model, about 220 MB).
"""
import datetime as dt
import json
import sys
from pathlib import Path

from sqlalchemy import Engine, text
from sqlalchemy.orm import Session

from app.db.init_db import init_db
from app.db.models import Project
from app.services.authors import get_or_create_author
from app.services.search_index import reindex_all

SAMPLE_FILE = Path(__file__).resolve().parents[3] / "data" / "samples" / "projects.json"
PROJECT_FIELDS = (
    "title", "description", "category", "location_name", "lat", "lng", "verified",
    "keywords", "sdgs", "images", "original_language", "title_original",
    "description_original", "translation_reviewed_by", "captions", "summary",
)


def seed(engine: Engine, path: Path = SAMPLE_FILE) -> int:
    init_db(engine)
    records = json.loads(path.read_text(encoding="utf-8"))
    with Session(engine) as db:
        for rec in records:
            author_data = dict(rec["author"])
            author = get_or_create_author(db, author_data.pop("name"), **author_data)
            project = db.get(Project, rec["id"]) or Project(id=rec["id"])
            for field in PROJECT_FIELDS:
                if field in rec:
                    setattr(project, field, rec[field])
            project.date = dt.date.fromisoformat(rec["date"])
            project.author = author
            db.add(project)
        db.commit()
        if engine.dialect.name == "postgresql":
            # Explicit ids bypass the sequence; move it past them so uploads don't collide.
            for table in ("projects", "authors"):
                db.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1))"))
            db.commit()
        reindex_all(db)
    return len(records)


def main() -> None:
    from app.db.session import engine

    path = Path(sys.argv[1]) if len(sys.argv) > 1 else SAMPLE_FILE
    count = seed(engine, path)
    print(f"Seeded {count} projects from {path} into {engine.dialect.name}.")


if __name__ == "__main__":
    main()
