"""List a project's PDFs. Uploading and deleting are admin routes (routes/admin/documents.py)."""
from fastapi import APIRouter

from app.core.deps import DB
from app.db.models import Document
from app.schemas import DocumentOut
from app.services import documents as service

router = APIRouter(tags=["documents"])


@router.get("/projects/{project_id}/documents", response_model=list[DocumentOut])
def list_documents(project_id: int, db: DB) -> list[Document]:
    return service.list_documents(db, project_id)
