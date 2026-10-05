"""Build backend/data/geo/countries.geojson from the Natural Earth 1:50m TopoJSON the globe uses.

Run from backend/inference/:  python -m app.scripts.build_countries
The output is committed, so this only needs rerunning when the outline file changes.
"""
import json
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[3]
SOURCE = BACKEND.parent / "frontend" / "countries-50m.json"
TARGET = BACKEND / "data" / "geo" / "countries.geojson"


def decode_arcs(topology: dict) -> list[list[tuple[float, float]]]:
    """TopoJSON arcs are delta-encoded integers; apply the transform to get lng/lat."""
    (sx, sy), (tx, ty) = topology["transform"]["scale"], topology["transform"]["translate"]
    arcs = []
    for arc in topology["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x, y = x + dx, y + dy
            points.append((round(x * sx + tx, 3), round(y * sy + ty, 3)))
        arcs.append(points)
    return arcs


def ring(arc_ids: list[int], arcs: list[list[tuple[float, float]]]) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for i in arc_ids:
        part = arcs[i] if i >= 0 else arcs[~i][::-1]
        points.extend(part if not points else part[1:])
    return points


def main() -> None:
    topology = json.loads(SOURCE.read_text(encoding="utf-8"))
    arcs = decode_arcs(topology)
    features = []
    for geom in topology["objects"]["countries"]["geometries"]:
        if geom["type"] == "Polygon":
            polygons = [geom["arcs"]]
        elif geom["type"] == "MultiPolygon":
            polygons = geom["arcs"]
        else:
            continue
        coords = [[ring(r, arcs) for r in polygon] for polygon in polygons]
        features.append({
            "type": "Feature",
            "properties": {"name": geom["properties"]["name"]},
            "geometry": {"type": "MultiPolygon", "coordinates": coords},
        })
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(features)} countries to {TARGET} ({TARGET.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
