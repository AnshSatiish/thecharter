"""Author lookup shared by the upload endpoint and the seed script."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Author


def get_or_create_author(db: Session, name: str, **fields: object) -> Author:
    """Return the author with this exact name, creating it from `fields` if missing.

    Existing authors are reused as-is; editing a profile is a separate admin action.
    """
    name = name.strip()
    author = db.scalar(select(Author).where(Author.name == name))
    if author is None:
        author = Author(name=name, **{k: v for k, v in fields.items() if v is not None})
        db.add(author)
        db.flush()
    return author
