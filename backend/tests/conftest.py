"""Test setup: a throwaway SQLite file unless DATABASE_URL already points at PostgreSQL.

Each test starts from a freshly seeded database, so run a Postgres pass only against
a disposable database (the tables are dropped and recreated).
"""
import os
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

if not os.environ.get("DATABASE_URL", "").startswith("postgres"):
    _tmp = Path(tempfile.mkdtemp(prefix="charter-test-")) / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.as_posix()}"
os.environ.setdefault("ENV", "test")
os.environ["ADMIN_TOKEN"] = "test-admin-token"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.models import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.scripts.seed import seed  # noqa: E402

ADMIN = {"X-Admin-Token": "test-admin-token"}
IS_POSTGRES = get_settings().is_postgres


@pytest.fixture
def client() -> Iterator[TestClient]:
    Base.metadata.drop_all(engine)
    seed(engine)
    with TestClient(app) as c:
        yield c


def ids(resp) -> set[int]:
    assert resp.status_code == 200, resp.text
    return {p["id"] for p in resp.json()}
