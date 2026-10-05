import pytest

from app.services.geo import haversine_km, in_bbox, parse_bbox


def test_haversine_zero():
    assert haversine_km(10, 20, 10, 20) == 0


def test_haversine_known_distances():
    # London to Paris is about 344 km; one degree of latitude about 111 km
    assert haversine_km(51.5074, -0.1278, 48.8566, 2.3522) == pytest.approx(343.5, abs=2)
    assert haversine_km(0, 0, 1, 0) == pytest.approx(111.2, abs=0.2)
    # Across the antimeridian the distance is short, not half the planet
    assert haversine_km(0, 179.5, 0, -179.5) == pytest.approx(111.2, abs=0.2)


def test_haversine_symmetric_and_antipodal():
    assert haversine_km(-1.28, 36.8, 32.5, -117.0) == pytest.approx(haversine_km(32.5, -117.0, -1.28, 36.8))
    assert haversine_km(0, 0, 0, 180) == pytest.approx(20015, abs=5)


def test_in_bbox():
    assert in_bbox(0, 10, 0, -5, 20, 5)
    assert not in_bbox(0, 30, 0, -5, 20, 5)
    assert in_bbox(0, 175, 170, -5, -170, 5)
    assert in_bbox(0, -175, 170, -5, -170, 5)
    assert not in_bbox(0, 0, 170, -5, -170, 5)


@pytest.mark.parametrize("raw", ["1,2,3", "a,b,c,d", "0,0,200,10", "0,10,5,0"])
def test_parse_bbox_rejects_bad_input(raw):
    with pytest.raises(ValueError):
        parse_bbox(raw)
