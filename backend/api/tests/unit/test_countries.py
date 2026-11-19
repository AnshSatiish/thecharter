"""Coordinates against country outlines: the sample data must sit where its place names say."""
import json

import pytest

from app.core.config import BACKEND_ROOT
from app.services.geo.countries import countries_mentioned, country_at
from app.services.geo.location_check import check_location

SAMPLES = json.loads((BACKEND_ROOT / "data" / "samples" / "projects.json").read_text(encoding="utf-8"))


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
