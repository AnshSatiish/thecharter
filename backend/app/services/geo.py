"""Geographic helpers used when PostGIS is not available (SQLite)."""
from math import asin, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points, in kilometres."""
    p1, p2 = radians(lat1), radians(lat2)
    dlat, dlng = p2 - p1, radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(p1) * cos(p2) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(min(1.0, sqrt(a)))


def in_bbox(lat: float, lng: float, min_lng: float, min_lat: float, max_lng: float, max_lat: float) -> bool:
    """Point-in-bbox test. A bbox with min_lng > max_lng crosses the antimeridian."""
    if not min_lat <= lat <= max_lat:
        return False
    if min_lng <= max_lng:
        return min_lng <= lng <= max_lng
    return lng >= min_lng or lng <= max_lng


def parse_bbox(raw: str) -> tuple[float, float, float, float]:
    """Parse "minLng,minLat,maxLng,maxLat"; raises ValueError when malformed or out of range."""
    parts = [float(p) for p in raw.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox needs 4 numbers: minLng,minLat,maxLng,maxLat")
    min_lng, min_lat, max_lng, max_lat = parts
    if not (-180 <= min_lng <= 180 and -180 <= max_lng <= 180):
        raise ValueError("bbox longitudes must be within [-180, 180]")
    if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90) or min_lat > max_lat:
        raise ValueError("bbox latitudes must be within [-90, 90] with minLat <= maxLat")
    return min_lng, min_lat, max_lng, max_lat
