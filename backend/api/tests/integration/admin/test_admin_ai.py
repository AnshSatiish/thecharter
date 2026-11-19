"""Admin AI helper endpoints: PDF extraction, summaries (with fallback) and keyword suggestions."""
from tests.conftest import ADMIN, UPLOAD_DIR, make_pdf

REPORT = [
    "Thermocline shifts are changing the sambaza fishery of Lake Kivu. Fishers report smaller catches each season.",
    "Cooperatives now rotate fishing nights to protect the sambaza stock. Lake Kivu cooperatives share the catch data.",
]


def stored_files() -> set[str]:
    return {p.relative_to(UPLOAD_DIR).as_posix() for p in UPLOAD_DIR.rglob("*") if p.is_file()}


def test_extract_pdf_saves_nothing(client):
    before = stored_files()
    files = {"file": ("report.pdf", make_pdf(REPORT), "application/pdf")}
    assert client.post("/api/ai/extract-pdf", files=files).status_code == 401
    resp = client.post("/api/ai/extract-pdf", files=files, headers=ADMIN)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["filename"] == "report.pdf" and body["pages"] == 2 and body["has_text"] is True
    assert body["characters"] > 100 and body["summary"] == ""
    assert body["summary_method"] == "not-requested"
    assert "sambaza" in [k.lower() for k in body["keywords"]]

    resp = client.post(
        "/api/ai/extract-pdf",
        files=files,
        data={"generate_summary": "true"},
        headers=ADMIN,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["summary"].startswith("Draft:") and body["summary_method"] == "ai:test-stub"
    assert body["fallback"] is False
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
        data={"generate_summary": "true"},
        headers=ADMIN,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["fallback"] is True and body["summary_method"] == "tfidf-extractive"
    assert body["summary"] and "sambaza" in body["summary"].lower()


def test_ai_summarize_and_keywords(client):
    text = " ".join(REPORT)
    assert client.post("/api/ai/summarize", json={"text": text}).status_code == 401
    assert client.post("/api/ai/summarize", json={"text": text}, headers={"X-Admin-Token": "nope"}).status_code == 403
    response = client.post("/api/ai/summarize", json={"text": text, "max_sentences": 1}, headers=ADMIN)
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["method"] == "tfidf-extractive"
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
    assert body["fallback"] is True and body["method"] == "tfidf-extractive" and body["summary"]
