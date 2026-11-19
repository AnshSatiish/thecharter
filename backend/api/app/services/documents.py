"""Project PDFs: save one with its extracted text and keywords, list them, delete one."""
from pathlib import PurePosixPath

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.ai.keywords import extract_keywords
from app.db.models import Document
from app.services.files.storage import LocalStorage, safe_filename
from app.services.files.validation import read_pdf
from app.services.projects import get_project_or_404
from app.services.search.indexing import reindex_project


def add_document(
    db: Session, storage: LocalStorage, project_id: int, file: UploadFile, title: str | None, summary: str | None
) -> Document:
    """Save a PDF, its extracted text and the summary supplied by the administrator."""
    project = get_project_or_404(db, project_id)
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
        summary=(summary or "").strip() or None,
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


def list_documents(db: Session, project_id: int) -> list[Document]:
    return get_project_or_404(db, project_id).documents


def delete_document(db: Session, storage: LocalStorage, document_id: int) -> None:
    """Remove the database row, rebuild the project's search index, then delete the file."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    path, project_id = document.path, document.project_id
    db.delete(document)
    db.commit()
    reindex_project(db, project_id)
    storage.delete(path)
