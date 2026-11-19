"""Location check response."""
from typing import Literal

from pydantic import BaseModel


class LocationCheckOut(BaseModel):
    country: str | None
    mentioned: list[str]
    status: Literal["ok", "mismatch", "unknown"]
    message: str
