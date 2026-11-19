"""Admin photo uploads with narration."""
from tests.conftest import ADMIN, UPLOAD_DIR, ids

JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 64


PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 32


def stored_files() -> set[str]:
    return {p.relative_to(UPLOAD_DIR).as_posix() for p in UPLOAD_DIR.rglob("*") if p.is_file()}


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
