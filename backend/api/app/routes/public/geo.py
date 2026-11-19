"""Location sanity check: does a coordinate fall in the country its place name mentions?"""
from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas import LocationCheckOut
from app.services.geo.location_check import check_location

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/check", response_model=LocationCheckOut)
def check(
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    place: Annotated[str, Query(max_length=300)] = "",
) -> LocationCheckOut:
    """Advisory only: the admin can still publish. Outlines are 1:50m, so borders are approximate."""
    return LocationCheckOut(**check_location(lat, lng, place))
