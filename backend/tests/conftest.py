"""Test setup: a throwaway SQLite file unless DATABASE_URL already points at PostgreSQL.

Each test starts from a freshly seeded database, so run a Postgres pass only against
a disposable database (the tables are dropped and recreated).
"""
import os
import shutil
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

if not os.environ.get("DATABASE_URL", "").startswith("postgres"):
    _tmp = Path(tempfile.mkdtemp(prefix="charter-test-")) / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.as_posix()}"
os.environ.setdefault("ENV", "test")
UPLOAD_DIR = Path(tempfile.mkdtemp(prefix="charter-uploads-"))
os.environ["UPLOAD_DIR"] = str(UPLOAD_DIR)
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
    shutil.rmtree(UPLOAD_DIR, ignore_errors=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with TestClient(app) as c:
        yield c


def ids(resp) -> set[int]:
    assert resp.status_code == 200, resp.text
    return {p["id"] for p in resp.json()}


def make_pdf(pages: list[str]) -> bytes:
    """Build a small real PDF with one text line per page ("" gives a page with no text layer)."""
    objects: list[bytes] = [b"", b"", b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    kids = []
    for line in pages:
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream = f"BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET".encode("latin-1") if line else b""
        objects.append(b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream))
        content = len(objects)
        objects.append(
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>" % content
        )
        kids.append(b"%d 0 R" % len(objects))
    objects[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objects[1] = b"<< /Type /Pages /Kids [" + b" ".join(kids) + b"] /Count %d >>" % len(kids)

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n%s\nendobj\n" % (number, body)
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    out += b"".join(b"%010d 00000 n \n" % o for o in offsets)
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objects) + 1, xref)
    return bytes(out)
