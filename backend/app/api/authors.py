"""Author (researcher / journalist) endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Author
from app.db.session import get_db
from app.schemas import AuthorDetail, AuthorOut

router = APIRouter(prefix="/authors", tags=["authors"])
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[AuthorOut])
def list_authors(db: DB) -> list[Author]:
    return list(db.scalars(select(Author).order_by(Author.name)))


@router.get("/{author_id}", response_model=AuthorDetail)
def get_author(author_id: int, db: DB) -> Author:
    author = db.get(Author, author_id, options=[selectinload(Author.projects)])
    if author is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Author not found")
    return author
