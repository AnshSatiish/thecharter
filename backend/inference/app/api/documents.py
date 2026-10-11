"""PDF documents attached to a project: upload, list and delete."""
from pathlib import PurePosixPath
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_admin
from app.db.models import Document, Project
from app.db.session import get_db
from app.schemas import DocumentOut
from app.services.search_index import reindex_project
from app.services.storage import LocalStorage, get_storage, safe_filename
from app.services.text import extract_keywords, extract_pdf_text, summarize
from app.services.uploads import is_pdf, read_limited

router = APIRouter(tags=["documents"])
DB = Annotated[Session, Depends(get_db)]
Storage = Annotated[LocalStorage, Depends(get_storage)]


def _project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def read_pdf(upload: UploadFile) -> tuple[bytes, str, int]:
    """Validate an uploaded PDF and return (bytes, extracted text, pages)."""
    data = read_limited(upload, get_settings().max_pdf_mb)
    if not is_pdf(data):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only PDF files are accepted")
    try:
        text, pages = extract_pdf_text(data)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return data, text, pages


@router.post(
    "/projects/{project_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def upload_document(
    project_id: int,
    db: DB,
    storage: Storage,
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form(max_length=300)] = None,
) -> Document:
    """Save a project PDF, extract its text, and suggest a summary and keywords from it."""
    project = _project_or_404(db, project_id)
    data, text, pages = read_pdf(file)
    filename = safe_filename(file.filename or "", default="document.pdf")
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"

    path = storage.save(data, f"projects/{project_id}/documents", filename)
    document = Document(
        project=project,
        title=(title or "").strip() or PurePosixPath(filename).stem,
        filename=filename,
        path=path,
        size_bytes=len(data),
        pages=pages,
        text=text,
        summary=summarize(text) or None,
        keywords=extract_keywords(text),
    )
    if not project.summary and document.summary:
        project.summary = document.summary
    try:
        db.add(document)
        db.commit()
    except Exception:
        storage.delete(path)
        raise
    reindex_project(db, project_id)
    db.refresh(document)
    return document


@router.get("/projects/{project_id}/documents", response_model=list[DocumentOut])
def list_documents(project_id: int, db: DB) -> list[Document]:
    return _project_or_404(db, project_id).documents


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_document(document_id: int, db: DB, storage: Storage) -> Response:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    path, project_id = document.path, document.project_id
    db.delete(document)
    db.commit()
    reindex_project(db, project_id)
    storage.delete(path)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
