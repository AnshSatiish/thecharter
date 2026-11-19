"""Admin project actions: create, verify, edit and add photographs."""
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status

from app.core.deps import DB, Storage
from app.db.models import Project
from app.schemas import ProjectIn, ProjectOut, ProjectPatch
from app.services import projects as service

router = APIRouter(prefix="/projects", tags=["admin: projects"])


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectIn, db: DB) -> Project:
    """Admin upload. New projects start unverified until a curator gives the blue mark."""
    return service.create_project(db, body)


@router.patch("/{project_id}/verify", response_model=ProjectOut)
def verify_project(project_id: int, db: DB) -> Project:
    return service.verify_project(db, project_id)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, body: ProjectPatch, db: DB) -> Project:
    """Edit title, description, summary, captions or keywords. Fields left out are unchanged."""
    return service.update_project(db, project_id, body)


@router.post("/{project_id}/images", response_model=ProjectOut)
def upload_images(
    project_id: int,
    db: DB,
    storage: Storage,
    files: Annotated[list[UploadFile], File()],
    captions: Annotated[list[str] | None, Form(description="Admin-written narration, matched to files by order")] = None,
) -> Project:
    """Add photographs (JPEG, PNG or WebP) with their narration. Nothing is saved unless every file is valid."""
    return service.add_images(db, storage, project_id, files, captions)
