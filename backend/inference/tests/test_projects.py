import pytest

from tests.conftest import ADMIN, IS_POSTGRES, ids

NEW_PROJECT = {
    "title": "Fishing Nets of the Salish Sea",
    "description": "How coastal communities adapt to shifting salmon runs.",
    "category": "wildlife",
    "location_name": "Vancouver Island, Canada",
    "lat": 49.65,
    "lng": -125.45,
    "date": "2025-05-02",
    "keywords": ["salmon", "fisheries"],
    "sdgs": ["SDG14"],
    "author_name": "Wanjiru Kimathi",
    "author_affiliation": "University of Nairobi",
}


def test_health(client):
    body = client.get("/health").json()
    assert body == {"status": "ok", "database": "postgresql" if IS_POSTGRES else "sqlite"}


def test_list_all_with_frontend_shape(client):
    data = client.get("/api/projects").json()
    assert len(data) == 7
    p = next(p for p in data if p["id"] == 25)
    assert p["date"] == "2024-06-25" and p["year"] == 2024
    assert p["author"]["name"] == "Wanjiru Kimathi"
    assert set(p) == {
        "id", "title", "description", "category", "location_name", "lat", "lng", "date", "year",
        "keywords", "sdgs", "verified", "images", "original_language", "title_original",
        "description_original", "author", "captions", "summary", "documents",
    }
    assert set(p["author"]) == {
        "id", "name", "profession", "role", "affiliation", "website", "google_scholar", "researchgate", "academia",
    }


def test_category_filter(client):
    assert ids(client.get("/api/projects", params={"category": "news"})) == {25, 26, 27}
    assert ids(client.get("/api/projects", params=[("category", "wildlife"), ("category", "urban")])) == {18, 23, 28}
    assert client.get("/api/projects", params={"category": "sports"}).status_code == 422


def test_sdg_filter_matches_any_and_exact_code(client):
    assert ids(client.get("/api/projects", params={"sdg": "SDG14"})) == {23}
    assert ids(client.get("/api/projects", params=[("sdg", "SDG15"), ("sdg", "sdg9")])) == {18, 28}
    # SDG1 must not match SDG10, SDG11, ...
    assert ids(client.get("/api/projects", params={"sdg": "SDG1"})) == {23, 26, 27}


def test_year_range(client):
    assert ids(client.get("/api/projects", params={"year_to": 2023})) == {17}
    assert ids(client.get("/api/projects", params={"year_from": 2024, "year_to": 2024})) == {18, 23, 25, 26, 27, 28}
    assert ids(client.get("/api/projects", params={"year_from": 2025})) == set()


@pytest.mark.parametrize(
    ("q", "expected"),
    [
        ("KENYA", {25}),  # title, case-insensitive
        ("cegarra", {26}),  # author name
        ("cool burning", {28}),  # keyword / description
        ("Tijuana", {26}),  # location name
        ("migration", {18, 26, 27}),  # keywords
    ],
)
def test_q_search(client, q, expected):
    assert ids(client.get("/api/projects", params={"q": q})) == expected


def test_bbox_normal(client):
    # East Africa
    assert ids(client.get("/api/projects", params={"bbox": "20,-10,40,5"})) == {23, 25}


def test_bbox_crossing_antimeridian(client):
    # 100E eastward over the date line to 100W: China, Australia and Tijuana, but not Oaxaca (-96.8)
    assert ids(client.get("/api/projects", params={"bbox": "100,-50,-100,60"})) == {18, 26, 28}


def test_bbox_invalid(client):
    assert client.get("/api/projects", params={"bbox": "1,2,3"}).status_code == 422
    assert client.get("/api/projects", params={"bbox": "0,50,10,40"}).status_code == 422


def test_near_nairobi(client):
    resp = client.get("/api/projects/near", params={"lat": -1.2864, "lng": 36.8172, "km": 1500})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert [p["id"] for p in data] == [25, 23]
    assert data[0]["distance_km"] == pytest.approx(0, abs=0.1)
    assert 800 < data[1]["distance_km"] < 900
    assert data[0]["author"]["name"] == "Wanjiru Kimathi"
    assert data[0]["year"] == 2024


def test_near_validates_input(client):
    assert client.get("/api/projects/near", params={"lat": 95, "lng": 0}).status_code == 422


def test_get_one_and_404(client):
    assert client.get("/api/projects/17").json()["category"] == "anthropology"
    assert client.get("/api/projects/9999").status_code == 404


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
    assert len(listed) == 8
    assert created["id"] in {p["id"] for p in listed}
    assert created["id"] in ids(client.get("/api/projects", params={"q": "salmon"}))


def test_create_new_author(client):
    body = {**NEW_PROJECT, "author_name": "Lucy Hart", "author_role": "academic"}
    created = client.post("/api/projects", json=body, headers=ADMIN).json()
    assert created["original_language"] == "en"
    assert created["author"]["role"] == "academic"
    assert len(client.get("/api/authors").json()) == 8


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


def test_seed_is_idempotent(client):
    from app.db.session import engine
    from app.scripts.seed import seed

    seed(engine)
    assert len(client.get("/api/projects").json()) == 7
    assert len(client.get("/api/authors").json()) == 7


@pytest.mark.postgres
@pytest.mark.skipif(not IS_POSTGRES, reason="DATABASE_URL is not PostgreSQL")
def test_postgis_location_column(client):
    from sqlalchemy import text

    from app.db.session import engine

    with engine.connect() as conn:
        dist = conn.execute(
            text(
                "SELECT ST_Distance(location, ST_MakePoint(36.8172, -1.2864)::geography) / 1000 "
                "FROM projects WHERE id = 23"
            )
        ).scalar_one()
        has_index = conn.execute(
            text("SELECT 1 FROM pg_indexes WHERE tablename = 'projects' AND indexname = 'ix_projects_location'")
        ).scalar()
    assert 800 < dist < 900
    assert has_index == 1
    # Uploads after seeding must not collide with seeded ids (the sequence was advanced)
    assert client.post("/api/projects", json=NEW_PROJECT, headers=ADMIN).json()["id"] > 28
