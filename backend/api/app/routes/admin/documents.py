"""Admin PDF actions: upload a project document, delete one."""
from typing import Annotated

from fastapi import APIRouter, File, Form, Response, UploadFile, status

from app.core.deps import DB, Storage
from app.db.models import Document
from app.schemas import DocumentOut
from app.services import documents as service

router = APIRouter(tags=["admin: documents"])


@router.post("/projects/{project_id}/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: int,
    db: DB,
    storage: Storage,
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form(max_length=300)] = None,
    summary: Annotated[str | None, Form(max_length=5000)] = None,
) -> Document:
    """Save a PDF, its extracted text and the summary supplied by the administrator."""
    return service.add_document(db, storage, project_id, file, title, summary)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: DB, storage: Storage) -> Response:
    service.delete_document(db, storage, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
