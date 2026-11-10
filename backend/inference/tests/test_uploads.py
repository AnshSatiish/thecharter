"""Photo and PDF uploads, document search, AI helper endpoints and project edits."""
import pytest

from app.services.storage import LocalStorage, safe_filename
from tests.conftest import ADMIN, UPLOAD_DIR, ids, make_pdf

JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 32
REPORT = [
    "Thermocline shifts are changing the sambaza fishery of Lake Kivu. Fishers report smaller catches each season.",
    "Cooperatives now rotate fishing nights to protect the sambaza stock. Lake Kivu cooperatives share the catch data.",
]


def stored_files() -> set[str]:
    return {p.relative_to(UPLOAD_DIR).as_posix() for p in UPLOAD_DIR.rglob("*") if p.is_file()}


def upload_pdf(client, project_id=18, name="report.pdf", pages=REPORT, **data):
    return client.post(
        f"/api/projects/{project_id}/documents",
        files={"file": (name, make_pdf(pages), "application/pdf")},
        data=data,
        headers=ADMIN,
    )


# Photos and narration

def test_upload_images_with_captions(client):
    before = client.get("/api/projects/18").json()
    resp = client.post(
        "/api/projects/18/images",
        files=[("files", ("one.jpg", JPEG, "image/jpeg")), ("files", ("two.png", PNG, "image/png")), ("files", ("three.webp", WEBP, "image/webp"))],
        data={"captions": ["Platform at dawn", "The slow train"]},
        headers=ADMIN,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    new_images = body["images"][len(before["images"]):]
    assert len(new_images) == 3
    assert all(url.startswith("/files/projects/18/") for url in new_images)
    assert [url.rsplit(".", 1)[1] for url in new_images] == ["jpg", "png", "webp"]
    # Captions stay parallel to images: existing ones kept, the third new one padded
    assert len(body["captions"]) == len(body["images"])
    assert body["captions"][: len(before["captions"])] == before["captions"]
    assert body["captions"][-3:] == ["Platform at dawn", "The slow train", ""]
    assert client.get(new_images[0]).content == JPEG
    assert ids(client.get("/api/projects", params={"q": "platform at dawn"})) == {18}


def test_upload_image_requires_admin(client):
    files = [("files", ("one.jpg", JPEG, "image/jpeg"))]
    assert client.post("/api/projects/18/images", files=files).status_code == 401
    assert client.post("/api/projects/18/images", files=files, headers={"X-Admin-Token": "nope"}).status_code == 403
    assert client.post("/api/projects/9999/images", files=files, headers=ADMIN).status_code == 404


def test_upload_image_rejects_non_images_and_saves_nothing(client):
    before = stored_files()
    resp = client.post(
        "/api/projects/18/images",
        # A good file followed by a script pretending to be a JPEG
        files=[("files", ("ok.jpg", JPEG, "image/jpeg")), ("files", ("evil.jpg", b"<script>alert(1)</script>", "image/jpeg"))],
        headers=ADMIN,
    )
    assert resp.status_code == 415
    assert stored_files() == before
    assert len(client.get("/api/projects/18").json()["images"]) == 4


def test_upload_image_size_limit(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "max_image_mb", 0)
    resp = client.post("/api/projects/18/images", files=[("files", ("one.jpg", JPEG, "image/jpeg"))], headers=ADMIN)
    assert resp.status_code == 413


def test_more_captions_than_files_rejected(client):
    resp = client.post(
        "/api/projects/18/images",
        files=[("files", ("one.jpg", JPEG, "image/jpeg"))],
        data={"captions": ["a", "b"]},
        headers=ADMIN,
    )
    assert resp.status_code == 422


def test_captions_padded_to_images(client):
    seeded = client.get("/api/projects/17").json()
    assert len(seeded["captions"]) == len(seeded["images"]) == 4 and seeded["captions"][0]

    body = {
        "title": "Padded", "description": "Captions shorter than images.", "category": "urban",
        "location_name": "Toronto", "lat": 43.65, "lng": -79.38, "date": "2025-01-01",
        "images": ["img/a.jpg", "img/b.jpg", "img/c.jpg"], "captions": ["Only the first"],
        "summary": "A short blurb.", "author_name": "Test Author",
    }
    created = client.post("/api/projects", json=body, headers=ADMIN).json()
    assert created["captions"] == ["Only the first", "", ""]
    assert created["summary"] == "A short blurb."
    assert created["documents"] == []


# PDF documents

def test_upload_document(client):
    assert client.get("/api/projects/18").json()["summary"] is None
    resp = upload_pdf(client, title="Field report")
    assert resp.status_code == 201, resp.text
    doc = resp.json()
    assert set(doc) == {"id", "title", "filename", "url", "size_bytes", "pages", "summary", "keywords", "uploaded_at"}
    assert doc["title"] == "Field report" and doc["filename"] == "report.pdf"
    assert doc["pages"] == 2 and doc["size_bytes"] == len(make_pdf(REPORT))
    assert doc["summary"].startswith("Draft:") and "sambaza" in doc["summary"]
    assert "sambaza" in [k.lower() for k in doc["keywords"]]

    # Served at its URL
    served = client.get(doc["url"])
    assert served.status_code == 200 and served.content[:5] == b"%PDF-"

    # Project picks up the summary and lists the document; the full text is never returned
    project = client.get("/api/projects/18").json()
    assert project["summary"] == doc["summary"]
    assert [d["id"] for d in project["documents"]] == [doc["id"]]
    assert "text" not in project["documents"][0]
    assert client.get("/api/projects/18/documents").json() == [doc]


def test_q_searches_pdf_text(client):
    assert ids(client.get("/api/projects", params={"q": "thermocline"})) == set()
    upload_pdf(client)
    assert ids(client.get("/api/projects", params={"q": "THERMOCLINE"})) == {18}
    # Combined with other filters
    assert ids(client.get("/api/projects", params={"q": "thermocline", "category": "news"})) == set()


def test_document_does_not_overwrite_existing_summary(client):
    client.patch("/api/projects/18", json={"summary": "Written by the curator."}, headers=ADMIN)
    upload_pdf(client)
    assert client.get("/api/projects/18").json()["summary"] == "Written by the curator."


def test_upload_document_preserves_admin_edited_summary(client):
    doc = upload_pdf(client, summary="Edited and approved by the admin.").json()
    assert doc["summary"] == "Edited and approved by the admin."


def test_document_default_title_and_scanned_pdf(client):
    doc = upload_pdf(client, name="scan of notes.pdf", pages=[""]).json()
    assert doc["title"] == "scan-of-notes" and doc["pages"] == 1
    assert doc["summary"] is None and doc["keywords"] == []


def test_upload_document_rejections(client):
    before = stored_files()
    fake = {"file": ("notes.pdf", b"just some text, not a pdf", "application/pdf")}
    assert client.post("/api/projects/18/documents", files=fake, headers=ADMIN).status_code == 415
    broken = {"file": ("broken.pdf", b"%PDF-1.4\nnot really", "application/pdf")}
    assert client.post("/api/projects/18/documents", files=broken, headers=ADMIN).status_code == 422
    real = {"file": ("report.pdf", make_pdf(REPORT), "application/pdf")}
    assert client.post("/api/projects/18/documents", files=real).status_code == 401
    assert client.post("/api/projects/9999/documents", files=real, headers=ADMIN).status_code == 404
    assert stored_files() == before


def test_path_traversal_filename_is_neutralised(client):
    before = stored_files()
    doc = upload_pdf(client, name="../../../evil.pdf").json()
    assert doc["filename"] == "evil.pdf"
    new = stored_files() - before
    assert len(new) == 1
    (path,) = new
    assert path.startswith("projects/18/documents/") and ".." not in path
    assert doc["url"] == f"/files/{path}"
    assert not (UPLOAD_DIR.parent / "evil.pdf").exists()


def test_delete_document_removes_file(client):
    # Give the project its own summary so the PDF text is the only place the search word lives
    client.patch("/api/projects/18", json={"summary": "Curator blurb."}, headers=ADMIN)
    doc = upload_pdf(client).json()
    assert ids(client.get("/api/projects", params={"q": "thermocline"})) == {18}
    path = UPLOAD_DIR / doc["url"].removeprefix("/files/")
    assert path.is_file()

    assert client.delete(f"/api/documents/{doc['id']}").status_code == 401
    assert client.delete(f"/api/documents/{doc['id']}", headers=ADMIN).status_code == 204
    assert not path.exists()
    assert client.get("/api/projects/18/documents").json() == []
    assert client.get(doc["url"]).status_code == 404
    assert ids(client.get("/api/projects", params={"q": "thermocline"})) == set()
    assert client.delete(f"/api/documents/{doc['id']}", headers=ADMIN).status_code == 404


# AI helpers

def test_extract_pdf_saves_nothing(client):
    before = stored_files()
    files = {"file": ("report.pdf", make_pdf(REPORT), "application/pdf")}
    assert client.post("/api/ai/extract-pdf", files=files).status_code == 401
    resp = client.post("/api/ai/extract-pdf", files=files, headers=ADMIN)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["filename"] == "report.pdf" and body["pages"] == 2 and body["has_text"] is True
    assert body["characters"] > 100 and body["summary"]
    assert body["summary"].startswith("Draft:") and body["summary_method"] == "ai:test-stub"
    assert body["fallback"] is False
    assert "sambaza" in [k.lower() for k in body["keywords"]]
    assert stored_files() == before
    assert client.get("/api/projects/18/documents").json() == []

    scanned = client.post("/api/ai/extract-pdf", files={"file": ("s.pdf", make_pdf([""]), "application/pdf")}, headers=ADMIN).json()
    assert scanned["has_text"] is False and scanned["summary"] == "" and scanned["keywords"] == []
    assert scanned["fallback"] is False


def test_extract_pdf_uses_extractive_fallback_when_ai_unavailable(client):
    from app.ai.summarization import SummarizerUnavailable, set_summarizer

    class Broken:
        name = "broken"

        def summarize(self, text):
            raise SummarizerUnavailable("no model")

    set_summarizer(Broken())
    response = client.post(
        "/api/ai/extract-pdf",
        files={"file": ("report.pdf", make_pdf(REPORT), "application/pdf")},
        headers=ADMIN,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["fallback"] is True and body["summary_method"] == "extractive-baseline"
    assert body["summary"] and "sambaza" in body["summary"].lower()


def test_ai_summarize_and_keywords(client):
    text = " ".join(REPORT)
    assert client.post("/api/ai/summarize", json={"text": text}).status_code == 401
    assert client.post("/api/ai/summarize", json={"text": text}, headers={"X-Admin-Token": "nope"}).status_code == 403
    response = client.post("/api/ai/summarize", json={"text": text, "max_sentences": 1}, headers=ADMIN)
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["method"] == "extractive-baseline"
    assert summary["summary"] and summary["summary"] in text
    keywords = client.post("/api/ai/keywords", json={"text": text, "top_k": 3}).json()
    assert keywords["method"] == "extractive-baseline" and len(keywords["keywords"]) == 3
    assert client.post("/api/ai/summarize", json={"text": text, "max_sentences": 0}, headers=ADMIN).status_code == 422
    assert client.post("/api/ai/summarize", json={}, headers=ADMIN).status_code == 422


def test_ai_summarize_with_the_model(client):
    body = client.post(
        "/api/ai/summarize",
        json={"text": "Lake Kivu is warming. Fishers report smaller catches.", "method": "ai"},
        headers=ADMIN,
    ).json()
    assert body == {"summary": "Draft: Lake Kivu is warming", "method": "ai:test-stub", "fallback": False}


def test_ai_summarize_falls_back_without_the_model(client):
    from app.ai.summarization import SummarizerUnavailable, set_summarizer

    class Broken:
        name = "broken"

        def summarize(self, text):
            raise SummarizerUnavailable("no model")

    set_summarizer(Broken())
    body = client.post(
        "/api/ai/summarize",
        json={"text": "One sentence here. Another one.", "method": "ai"},
        headers=ADMIN,
    ).json()
    assert body["fallback"] is True and body["method"] == "extractive-baseline" and body["summary"]


def test_summarizer_generation_errors_are_fallback_eligible(monkeypatch):
    from contextlib import nullcontext
    from types import SimpleNamespace
    import sys

    from app.ai.summarization import AbstractiveSummarizer, SummarizerUnavailable

    class Tokenizer:
        def __call__(self, *_args, **_kwargs):
            return {}

    class BrokenModel:
        def generate(self, **_kwargs):
            raise RuntimeError("generation failed")

    summarizer = AbstractiveSummarizer("broken")
    monkeypatch.setattr(summarizer, "_load", lambda: (Tokenizer(), BrokenModel()))
    monkeypatch.setitem(sys.modules, "torch", SimpleNamespace(no_grad=nullcontext))

    with pytest.raises(SummarizerUnavailable, match="Could not generate a summary"):
        summarizer._generate("A sample report.")


# Edits

def test_patch_project(client):
    before = client.get("/api/projects/18").json()
    captions = ["First", "Second", "Third", "Fourth"]
    resp = client.patch(
        "/api/projects/18",
        json={"summary": "Two rail systems, one country.", "captions": captions, "keywords": ["rail"]},
        headers=ADMIN,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["summary"] == "Two rail systems, one country."
    assert body["captions"] == captions and body["keywords"] == ["rail"]
    # Untouched fields stay as they were
    assert body["title"] == before["title"] and body["description"] == before["description"]
    assert ids(client.get("/api/projects", params={"q": "one country"})) == {18}

    renamed = client.patch("/api/projects/18", json={"title": "Two Chinas"}, headers=ADMIN).json()
    assert renamed["title"] == "Two Chinas" and renamed["summary"] == "Two rail systems, one country."


def test_patch_project_guards(client):
    assert client.patch("/api/projects/18", json={"summary": "x"}).status_code == 401
    assert client.patch("/api/projects/9999", json={"summary": "x"}, headers=ADMIN).status_code == 404
    assert client.patch("/api/projects/18", json={"title": ""}, headers=ADMIN).status_code == 422
    assert client.patch("/api/projects/18", json={"title": None}, headers=ADMIN).status_code == 422
    assert client.patch("/api/projects/18/verify", headers=ADMIN).json()["verified"] is True


# Storage and schema upgrade

def test_safe_filename():
    assert safe_filename("../../etc/passwd") == "passwd"
    assert safe_filename("C:\\Users\\x\\Informe final (2).PDF") == "Informe-final-2-.PDF"
    assert safe_filename("señal.pdf") == "senal.pdf"
    assert safe_filename("...") == "file"


def test_local_storage_stays_inside_root(tmp_path):
    storage = LocalStorage(tmp_path / "uploads")
    path = storage.save(b"data", "projects/1", "../../escape.txt")
    assert path.startswith("projects/1/") and path.endswith("-escape.txt")
    assert (tmp_path / "uploads" / path).read_bytes() == b"data"
    assert storage.url(path) == f"/files/{path}"
    assert storage.save(b"data", "projects/1", "escape.txt") != path  # unique names

    with pytest.raises(ValueError):
        storage.save(b"data", "../outside", "a.txt")
    (tmp_path / "secret.txt").write_text("keep")
    with pytest.raises(ValueError):
        storage.delete("../secret.txt")
    assert (tmp_path / "secret.txt").exists()
    storage.delete(path)
    storage.delete(path)  # deleting a missing file is not an error
    assert not (tmp_path / "uploads" / path).exists()


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
