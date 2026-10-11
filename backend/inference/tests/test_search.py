"""Keyword, semantic and hybrid search, and the indexes behind them."""
import pytest

from app.ai.embeddings import EmbedderUnavailable, set_embedder
from app.ai.embeddings.chunking import chunk_text
from app.services.search import Hit, fuse, query_terms
from tests.conftest import ADMIN, make_pdf

REPORT = [
    "Thermocline shifts are changing the sambaza fishery. Fishers report smaller catches each season.",
    "Cooperatives now rotate fishing nights to protect the sambaza stock.",
]


def search(client, q, mode="hybrid", **params):
    resp = client.get("/api/projects/search", params={"q": q, "mode": mode, **params})
    assert resp.status_code == 200, resp.text
    return resp.json()


def found(client, q, mode="hybrid", **params) -> list[int]:
    return [r["project"]["id"] for r in search(client, q, mode, **params)["results"]]


def upload_pdf(client, project_id=18, pages=REPORT, **data):
    # A project with no summary takes the PDF's; set one so the PDF text lives only in the document.
    client.patch(f"/api/projects/{project_id}", json={"summary": "Two railways."}, headers=ADMIN)
    resp = client.post(
        f"/api/projects/{project_id}/documents",
        files={"file": ("report.pdf", make_pdf(pages), "application/pdf")},
        data=data,
        headers=ADMIN,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


class Broken:
    name = "broken"

    def embed(self, texts):
        raise EmbedderUnavailable("model missing")


# Keyword

@pytest.mark.parametrize(
    ("q", "expected"),
    [
        ("Kivu", [23]),
        ("kivu fishing", [23]),
        ("Darien", [27]),            # accents are optional
        ("DARIÉN", [27]),
        ("Finance Bill", [25]),
        ("Rosa Bello", [26]),        # photo narration
        ("zzzznothing", []),
    ],
)
def test_keyword_matches(client, q, expected):
    assert found(client, q, "keyword") == expected


def test_keyword_matches_the_start_of_a_word(client):
    assert set(found(client, "migr", "keyword")) >= {26, 27}


def test_keyword_ranks_title_matches_first(client):
    # "China" is in the title of 18; "Chinese" appears only in a caption of 27.
    assert found(client, "chin", "keyword")[0] == 18


def test_keyword_falls_back_to_any_word(client):
    assert found(client, "Kivu zzzznothing", "keyword") == [23]


def test_keyword_result_shape(client):
    body = search(client, "Kivu", "keyword")
    assert body["mode_used"] == "keyword" and body["model"] is None
    hit = body["results"][0]
    assert hit["matched_by"] == ["keyword"] and hit["passage"] is None and hit["similarity"] is None
    assert hit["project"]["title"] == "The Lake Has Fallen Silent"


def test_keyword_reads_uploaded_pdfs(client):
    assert found(client, "thermocline", "keyword") == []
    document = upload_pdf(client)
    assert found(client, "thermocline", "keyword") == [18]
    client.delete(f"/api/documents/{document['id']}", headers=ADMIN)
    assert found(client, "thermocline", "keyword") == []


def test_keyword_follows_edits(client):
    client.patch("/api/projects/17", json={"summary": "A study of marigold altars."}, headers=ADMIN)
    assert found(client, "marigold", "keyword") == [17]


# Semantic

def test_semantic_returns_the_matching_passage(client):
    body = search(client, "cool burning fires undergrowth", "semantic")
    hit = body["results"][0]
    assert hit["project"]["id"] == 28
    assert hit["matched_by"] == ["semantic"] and hit["passage_source"] == "project"
    assert "burn" in hit["passage"].lower()
    assert 0 < hit["similarity"] <= 1
    assert body["model"] == "test-hashing" and body["mode_used"] == "semantic"


def test_semantic_drops_unrelated_projects(client):
    # The stand-in embedder gives a query with no words a blank vector: similar to nothing.
    assert found(client, "?!", "semantic") == []
    assert found(client, "?!", "hybrid") == []


def test_semantic_reads_uploaded_pdfs(client):
    document = upload_pdf(client, title="Fishery report")
    hit = search(client, "thermocline shifts cooperatives rotate", "semantic")["results"][0]
    assert hit["project"]["id"] == 18
    assert hit["passage_source"] == "document" and hit["passage_document"] == "Fishery report"
    assert "Thermocline" in hit["passage"]

    client.delete(f"/api/documents/{document['id']}", headers=ADMIN)
    after = search(client, "thermocline shifts cooperatives rotate", "semantic")["results"]
    assert all(r["passage_source"] == "project" for r in after)


def test_new_projects_are_searchable(client):
    body = {
        "title": "Salt Harvest", "description": "Families rake salt from evaporation ponds on the Sechura coast.",
        "category": "anthropology", "location_name": "Sechura, Peru", "lat": -5.56, "lng": -80.82,
        "date": "2024-03-01", "author_name": "Test Author",
    }
    created = client.post("/api/projects", json=body, headers=ADMIN).json()
    assert found(client, "evaporation ponds", "semantic")[0] == created["id"]
    assert found(client, "sechura", "keyword") == [created["id"]]


def test_semantic_unavailable(client):
    set_embedder(Broken())
    resp = client.get("/api/projects/search", params={"q": "lake", "mode": "semantic"})
    assert resp.status_code == 503
    body = search(client, "Kivu", "hybrid")
    assert body["mode_used"] == "keyword" and [r["project"]["id"] for r in body["results"]] == [23]


def test_saving_still_works_without_the_model(client):
    set_embedder(Broken())
    resp = client.patch("/api/projects/17", json={"summary": "Updated."}, headers=ADMIN)
    assert resp.status_code == 200 and resp.json()["summary"] == "Updated."


# Hybrid

def test_hybrid_marks_how_each_result_was_found(client):
    hit = search(client, "Lake Kivu fishing communities")["results"][0]
    assert hit["project"]["id"] == 23
    assert hit["matched_by"] == ["keyword", "semantic"] and hit["passage"]


def test_hybrid_needs_every_keyword(client):
    results = search(client, "Kivu zzzznothing")["results"]
    assert all(r["matched_by"] == ["semantic"] for r in results)


def test_fuse_rewards_results_in_both_lists():
    keyword = [Hit(1, 0.9, ["keyword"]), Hit(2, 0.5, ["keyword"])]
    semantic = [Hit(3, 0.8, ["semantic"], passage="p3"), Hit(2, 0.7, ["semantic"], passage="p2")]
    merged = fuse(keyword, semantic, limit=10)
    assert [h.project_id for h in merged] == [2, 1, 3]
    assert merged[0].matched_by == ["semantic", "keyword"] and merged[0].passage == "p2"
    assert fuse(keyword, semantic, limit=1)[0].project_id == 2


# Request validation and helpers

@pytest.mark.parametrize("params", [{}, {"q": ""}, {"q": "x", "mode": "magic"}, {"q": "x", "limit": 0}, {"q": "x" * 201}])
def test_search_validation(client, params):
    assert client.get("/api/projects/search", params=params).status_code == 422


def test_limit(client):
    assert len(found(client, "migration", "keyword", limit=1)) == 1


def test_query_terms():
    assert query_terms("The Darién Gap") == ["darien", "gap"]
    assert query_terms("the of") == ["the", "of"]
    assert query_terms("  ") == []


def test_chunk_text():
    assert chunk_text("") == []
    assert chunk_text("One short sentence.") == ["One short sentence."]
    text = " ".join(f"Sentence number {i} has exactly seven words." for i in range(30))
    chunks = chunk_text(text, max_words=20)
    assert all(len(c.split()) <= 20 for c in chunks)
    assert chunks[1].startswith(chunks[0].split(". ")[-1][:10])  # passages overlap by one sentence
    assert len(chunk_text(text, max_words=20, max_chunks=3)) == 3
    assert all(len(c.split()) <= 20 for c in chunk_text("word " * 100, max_words=20))
