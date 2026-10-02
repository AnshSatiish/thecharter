"""Location sanity check: does a coordinate fall in the country its place name mentions?"""
from typing import Annotated, Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.countries import check_location

router = APIRouter(prefix="/geo", tags=["geo"])


class LocationCheckOut(BaseModel):
    country: str | None
    mentioned: list[str]
    status: Literal["ok", "mismatch", "unknown"]
    message: str


@router.get("/check", response_model=LocationCheckOut)
def check(
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    place: Annotated[str, Query(max_length=300)] = "",
) -> LocationCheckOut:
    """Advisory only: the admin can still publish. Outlines are 1:50m, so borders are approximate."""
    return LocationCheckOut(**check_location(lat, lng, place))
