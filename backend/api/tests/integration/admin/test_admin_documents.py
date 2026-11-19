"""Admin PDF uploads: storage, text extraction, summaries, keyword search over PDFs, deletion."""
from tests.conftest import ADMIN, UPLOAD_DIR, ids, make_pdf

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


def test_upload_document(client):
    assert client.get("/api/projects/18").json()["summary"] is None
    resp = upload_pdf(client, title="Field report", summary="Draft: Thermocline shifts are changing the sambaza fishery")
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


def test_document_upload_does_not_draft_a_summary(client):
    doc = upload_pdf(client).json()
    assert doc["summary"] is None
    assert client.get("/api/projects/18").json()["summary"] is None


def test_document_upload_keeps_an_intentionally_empty_summary(client):
    doc = upload_pdf(client, summary="").json()
    assert doc["summary"] is None
    assert client.get("/api/projects/18").json()["summary"] is None


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
