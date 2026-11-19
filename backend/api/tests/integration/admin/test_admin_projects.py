"""Admin project actions: create, validate, verify and edit."""
import pytest

from tests.conftest import ADMIN, NEW_PROJECT, ids


def test_create_requires_admin(client):
    assert client.post("/api/projects", json=NEW_PROJECT).status_code == 401
    bad = client.post("/api/projects", json=NEW_PROJECT, headers={"X-Admin-Token": "nope"})
    assert bad.status_code == 403


def test_create_project(client):
    resp = client.post("/api/projects", json=NEW_PROJECT, headers=ADMIN)
    assert resp.status_code == 201, resp.text
    created = resp.json()
    assert created["verified"] is False
    assert created["year"] == 2025
    # Existing author is reused rather than duplicated
    assert created["author"]["name"] == "Wanjiru Kimathi"
    names = [a["name"] for a in client.get("/api/authors").json()]
    assert names.count("Wanjiru Kimathi") == 1

    listed = client.get("/api/projects").json()
    assert len(listed) == 10
    assert created["id"] in {p["id"] for p in listed}
    assert created["id"] in ids(client.get("/api/projects", params={"q": "salmon"}))


def test_create_new_author(client):
    body = {**NEW_PROJECT, "author_name": "Lucy Hart", "author_role": "academic"}
    created = client.post("/api/projects", json=body, headers=ADMIN).json()
    assert created["original_language"] == "en"
    assert created["author"]["role"] == "academic"
    assert len(client.get("/api/authors").json()) == 10


@pytest.mark.parametrize(
    "override",
    [{"lat": 95}, {"lng": -181}, {"category": "sports"}, {"sdgs": ["SDG99"]}, {"title": ""}],
)
def test_create_validation(client, override):
    resp = client.post("/api/projects", json={**NEW_PROJECT, **override}, headers=ADMIN)
    assert resp.status_code == 422


def test_verify(client):
    assert client.get("/api/projects/18").json()["verified"] is False
    assert client.patch("/api/projects/18/verify").status_code == 401
    resp = client.patch("/api/projects/18/verify", headers=ADMIN)
    assert resp.status_code == 200 and resp.json()["verified"] is True
    assert client.get("/api/projects/18").json()["verified"] is True
    assert client.patch("/api/projects/9999/verify", headers=ADMIN).status_code == 404


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
