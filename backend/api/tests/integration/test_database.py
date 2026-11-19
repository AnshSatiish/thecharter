"""Database setup: init_db upgrades an existing database in place."""


def test_init_db_adds_new_columns_to_an_existing_database(tmp_path):
    """A database created before captions/summary existed is upgraded in place, keeping its rows."""
    from sqlalchemy import inspect, text

    from app.db.init_db import init_db
    from app.db.session import make_engine

    engine = make_engine(f"sqlite:///{(tmp_path / 'old.db').as_posix()}")
    init_db(engine)
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO authors (id, name, role) VALUES (1, 'A', 'journalist')"))
        conn.execute(text(
            "INSERT INTO projects (id, title, description, category, location_name, lat, lng, date, verified, "
            "keywords, sdgs, images, original_language, created_at, author_id) VALUES "
            "(1, 'Old', 'd', 'news', 'x', 0, 0, '2024-01-01', 0, '[]', '[]', '[\"a.jpg\"]', 'en', '2024-01-01', 1)"
        ))
        conn.execute(text("ALTER TABLE projects DROP COLUMN captions"))
        conn.execute(text("ALTER TABLE projects DROP COLUMN summary"))
    assert "captions" not in {c["name"] for c in inspect(engine).get_columns("projects")}

    init_db(engine)
    init_db(engine)  # idempotent
    assert {"captions", "summary"} <= {c["name"] for c in inspect(engine).get_columns("projects")}

    from sqlalchemy.orm import Session

    from app.db.models import Project
    from app.schemas import ProjectOut

    with Session(engine) as db:
        out = ProjectOut.model_validate(db.get(Project, 1))
    assert out.captions == [""] and out.summary is None
    engine.dispose()
