"""Behaviour under load: a full connection pool answers 503 at once, and several server processes can start together."""
import threading

import pytest
from sqlalchemy.exc import TimeoutError as PoolTimeout

from app.db.init_db import init_db
from app.db.session import engine, get_db
from app.main import app
from tests.conftest import IS_POSTGRES


def test_full_pool_answers_503_busy(client):
    def no_connection():
        raise PoolTimeout("QueuePool limit reached")
        yield  # pragma: no cover

    app.dependency_overrides[get_db] = no_connection
    try:
        resp = client.get("/api/projects/search", params={"q": "migration", "mode": "keyword"})
    finally:
        app.dependency_overrides.pop(get_db, None)
    assert resp.status_code == 503
    assert resp.headers["retry-after"] == "2"
    assert "busy" in resp.json()["detail"]


@pytest.mark.skipif(not IS_POSTGRES, reason="the schema lock is PostgreSQL only")
def test_processes_starting_together_do_not_deadlock(client):
    errors: list[Exception] = []

    def start():
        try:
            init_db(engine)
        except Exception as exc:  # noqa: BLE001
            errors.append(exc)

    threads = [threading.Thread(target=start) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
