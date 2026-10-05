"""Which country a coordinate falls in, and whether that agrees with a place name.

Used as a sanity check on project locations: it catches typos such as a swapped
latitude and longitude. Outlines are Natural Earth 1:50m (data/geo/countries.geojson),
so a point within a few kilometres of a border or coast can land on the wrong side;
the check allows for that with a tolerance instead of failing.
"""
import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.services.geo import haversine_km

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "geo" / "countries.geojson"
NEAR_KM = 60.0  # a point this close to a named country still counts (lakes, coasts, coarse borders)

# Names people write that differ from the dataset's names.
ALIASES = {
    "usa": "United States of America", "us": "United States of America", "u.s.": "United States of America",
    "united states": "United States of America", "america": "United States of America",
    "uk": "United Kingdom", "britain": "United Kingdom", "england": "United Kingdom",
    "drc": "Dem. Rep. Congo", "dr congo": "Dem. Rep. Congo", "democratic republic of congo": "Dem. Rep. Congo",
    "democratic republic of the congo": "Dem. Rep. Congo", "congo-kinshasa": "Dem. Rep. Congo",
    "ivory coast": "Côte d'Ivoire", "cote d'ivoire": "Côte d'Ivoire",
    "south korea": "South Korea", "north korea": "North Korea", "czech republic": "Czechia",
    "bosnia": "Bosnia and Herz.", "dominican republic": "Dominican Rep.", "south sudan": "S. Sudan",
    "central african republic": "Central African Rep.", "equatorial guinea": "Eq. Guinea",
    "palestine": "Palestine", "gaza": "Palestine", "west bank": "Palestine", "uae": "United Arab Emirates",
}

Ring = list[tuple[float, float]]


class Country:
    def __init__(self, name: str, polygons: list[list[Ring]]):
        self.name = name
        self.polygons = polygons
        xs = [x for poly in polygons for x, _ in poly[0]]
        ys = [y for poly in polygons for _, y in poly[0]]
        self.bbox = (min(xs), min(ys), max(xs), max(ys))

    def contains(self, lng: float, lat: float) -> bool:
        min_x, min_y, max_x, max_y = self.bbox
        if not (min_x <= lng <= max_x and min_y <= lat <= max_y):
            return False
        return any(_in_ring(lng, lat, poly[0]) and not any(_in_ring(lng, lat, hole) for hole in poly[1:]) for poly in self.polygons)

    def distance_km(self, lng: float, lat: float) -> float:
        """Distance to the nearest outline point (0 when inside). Good enough for a tolerance check."""
        if self.contains(lng, lat):
            return 0.0
        return min(haversine_km(lat, lng, y, x) for poly in self.polygons for x, y in poly[0])


def _in_ring(lng: float, lat: float, ring: Ring) -> bool:
    """Ray casting: count how many edges a ray going east from the point crosses."""
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


@lru_cache
def load_countries() -> tuple[Country, ...]:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return tuple(
        Country(f["properties"]["name"], [[[(x, y) for x, y in ring] for ring in poly] for poly in f["geometry"]["coordinates"]])
        for f in data["features"]
    )


def country_at(lat: float, lng: float) -> str | None:
    """Name of the country containing the point, or None over open water."""
    return next((c.name for c in load_countries() if c.contains(lng, lat)), None)


def _plain(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def countries_mentioned(place: str) -> list[str]:
    """Countries named in a free-text place such as "Lake Kivu, Rwanda/DRC"."""
    cleaned = re.sub(r"[^a-z0-9.' ]+", " ", _plain(place))
    text = f" {cleaned} "
    found: list[str] = []
    for country in load_countries():
        if f" {_plain(country.name)} " in text and country.name not in found:
            found.append(country.name)
    for alias, name in ALIASES.items():
        if f" {_plain(alias)} " in text and name not in found:
            found.append(name)
    return found


def check_location(lat: float, lng: float, place: str) -> dict:
    """Compare where the coordinates are with the countries the place name mentions.

    status: "ok" (they agree), "mismatch" (they disagree), "unknown" (nothing to compare).
    """
    country = country_at(lat, lng)
    mentioned = countries_mentioned(place or "")
    where = f"in {country}" if country else "over open water"
    if not mentioned:
        return {"country": country, "mentioned": [], "status": "unknown",
                "message": f"These coordinates are {where}. The place name does not mention a country to compare with."}
    by_name = {c.name: c for c in load_countries()}
    if country in mentioned or any(by_name[m].distance_km(lng, lat) <= NEAR_KM for m in mentioned):
        return {"country": country, "mentioned": mentioned, "status": "ok", "message": f"These coordinates are {where}, which matches the place name."}
    message = f"These coordinates are {where}, but the place name mentions {' and '.join(mentioned)}."
    if -90 <= lng <= 90 and (country_at(lng, lat) in mentioned or any(by_name[m].distance_km(lat, lng) <= NEAR_KM for m in mentioned)):
        message += " Latitude and longitude look swapped."
    return {"country": country, "mentioned": mentioned, "status": "mismatch", "message": message}
