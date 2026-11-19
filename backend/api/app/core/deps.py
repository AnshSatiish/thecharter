"""FastAPI dependencies shared by the routes: `db: DB` and `storage: Storage` in a route signature."""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.files.storage import LocalStorage, get_storage

DB = Annotated[Session, Depends(get_db)]
Storage = Annotated[LocalStorage, Depends(get_storage)]
