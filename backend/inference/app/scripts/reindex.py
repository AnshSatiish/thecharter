"""Rebuild the keyword and semantic search indexes for every project: `python -m app.scripts.reindex`.

Run it after changing EMBEDDING_MODEL, or once on a database that was filled before search existed.
"""
from sqlalchemy.orm import Session

from app.db.init_db import init_db
from app.services.search_index import reindex_all


def main() -> None:
    from app.db.session import engine

    init_db(engine)
    with Session(engine) as db:
        count = reindex_all(db)
    print(f"Reindexed {count} projects in {engine.dialect.name}.")


if __name__ == "__main__":
    main()
