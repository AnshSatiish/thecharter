"""Declarative base and the fixed value lists the tables check against."""
from sqlalchemy.orm import DeclarativeBase

CATEGORIES = ("wildlife", "anthropology", "urban", "border", "news")
ROLES = ("academic", "journalist")


class Base(DeclarativeBase):
    pass
