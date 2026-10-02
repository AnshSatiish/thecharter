"""Coordinates against country outlines: the sample data must sit where its place names say."""
import json
from pathlib import Path

import pytest

from app.services.countries import check_location, countries_mentioned, country_at

SAMPLES = json.loads((Path(__file__).resolve().parents[2] / "data" / "samples" / "projects.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize(("lat", "lng", "expected"), [
    (5.360, -4.008, "Côte d'Ivoire"),      # Abidjan
    (-1.286, 36.817, "Kenya"),             # Nairobi
    (43.653, -79.383, "Canada"),           # Toronto
    (1.352, 103.820, "Singapore"),         # missing from the coarser 1:110m outlines
    (-33.869, 151.209, "Australia"),       # Sydney
    (0.0, -30.0, None),                    # mid-Atlantic
])
def test_country_at(lat, lng, expected):
    assert country_at(lat, lng) == expected


def test_countries_mentioned_handles_aliases_and_accents():
    assert set(countries_mentioned("Lake Kivu, Rwanda/DRC")) == {"Rwanda", "Dem. Rep. Congo"}
    assert set(countries_mentioned("US-Mexico Border, Tijuana & Ciudad Juárez")) == {"United States of America", "Mexico"}
    assert countries_mentioned("Abidjan, Ivory Coast") == ["Côte d'Ivoire"]
    assert countries_mentioned("Abidjan, Cote d'Ivoire") == ["Côte d'Ivoire"]
    assert countries_mentioned("Somewhere unnamed") == []
    assert "Niger" not in countries_mentioned("Lagos, Nigeria")


@pytest.mark.parametrize("project", SAMPLES, ids=lambda p: f"{p['id']}-{p['location_name'][:24]}")
def test_every_sample_project_sits_where_its_place_name_says(project):
    result = check_location(project["lat"], project["lng"], project["location_name"])
    assert result["status"] == "ok", result["message"]


def test_swapped_latitude_and_longitude_is_caught():
    # Nairobi with the two numbers the wrong way round
    result = check_location(36.817, -1.286, "Nairobi, Kenya")
    assert result["status"] == "mismatch"
    assert "swapped" in result["message"]


def test_wrong_country_is_caught_and_unknown_is_not_an_error():
    assert check_location(48.857, 2.352, "Nairobi, Kenya")["status"] == "mismatch"   # Paris
    assert check_location(48.857, 2.352, "A market at dawn")["status"] == "unknown"


def test_geo_check_endpoint(client):
    ok = client.get("/api/geo/check", params={"lat": 18.1333, "lng": -96.8333, "place": "Sierra Mazateca, Oaxaca, Mexico"}).json()
    assert ok["status"] == "ok" and ok["country"] == "Mexico"
    bad = client.get("/api/geo/check", params={"lat": -96.8333, "lng": 18.1333, "place": "Oaxaca, Mexico"})
    assert bad.status_code == 422  # latitude out of range is rejected before the check
    swapped = client.get("/api/geo/check", params={"lat": 36.817, "lng": -1.286, "place": "Nairobi, Kenya"}).json()
    assert swapped["status"] == "mismatch" and "swapped" in swapped["message"]
