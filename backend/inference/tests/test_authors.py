def test_list_authors(client):
    data = client.get("/api/authors").json()
    assert len(data) == 9
    names = [a["name"] for a in data]
    assert names == sorted(names)
    assert {"region_lat", "region_lng", "google_scholar"} <= set(data[0])


def test_author_detail_with_projects(client):
    author = next(a for a in client.get("/api/authors").json() if a["name"] == "Jean-Baptiste Munyankindi")
    detail = client.get(f"/api/authors/{author['id']}").json()
    assert detail["role"] == "journalist"
    assert detail["affiliation"] == "University of Rwanda"
    assert detail["projects"] == [
        {
            "id": 23,
            "title": "The Lake Has Fallen Silent",
            "lat": -1.7167,
            "lng": 29.2333,
            "location_name": "Lake Kivu, Rwanda/DRC",
            "date": "2024-08-10",
            "category": "wildlife",
        }
    ]


def test_author_404(client):
    assert client.get("/api/authors/9999").status_code == 404
