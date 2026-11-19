"""SQLAlchemy models, one file per table.

Importing this package registers every table on `Base.metadata`, so `from app.db.models import ...`
is the one import the rest of the app needs.
"""
from app.db.models.author import Author
from app.db.models.base import CATEGORIES, ROLES, Base
from app.db.models.document import Document
from app.db.models.project import Project
from app.db.models.search_chunk import SearchChunk

__all__ = ["CATEGORIES", "ROLES", "Author", "Base", "Document", "Project", "SearchChunk"]
