"""Types shared by several schemas."""
from typing import Annotated, Literal

from pydantic import Field

Category = Literal["wildlife", "anthropology", "urban", "border", "news"]
Role = Literal["academic", "journalist"]
Lat = Annotated[float, Field(ge=-90, le=90)]
Lng = Annotated[float, Field(ge=-180, le=180)]
Sdg = Annotated[str, Field(pattern=r"^SDG([1-9]|1[0-7])$")]
