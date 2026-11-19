"""GET /api/geo/check. The country logic itself is unit-tested in tests/unit/test_countries.py."""


def test_geo_check_endpoint(client):
    ok = client.get("/api/geo/check", params={"lat": 18.1333, "lng": -96.8333, "place": "Sierra Mazateca, Oaxaca, Mexico"}).json()
    assert ok["status"] == "ok" and ok["country"] == "Mexico"
    bad = client.get("/api/geo/check", params={"lat": -96.8333, "lng": 18.1333, "place": "Oaxaca, Mexico"})
    assert bad.status_code == 422  # latitude out of range is rejected before the check
    swapped = client.get("/api/geo/check", params={"lat": 36.817, "lng": -1.286, "place": "Nairobi, Kenya"}).json()
    assert swapped["status"] == "mismatch" and "swapped" in swapped["message"]
