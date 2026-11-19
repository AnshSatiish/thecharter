"""Location sanity check: does a coordinate fall in the country its place name mentions?

Advisory only (the admin can still publish). It catches typos such as a swapped latitude and longitude.
"""
from app.services.geo.countries import countries_mentioned, country_at, load_countries

NEAR_KM = 60.0  # a point this close to a named country still counts (lakes, coasts, coarse borders)


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
