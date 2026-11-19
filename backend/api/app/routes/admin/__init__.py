"""Admin routes. `router` carries require_admin once, so no admin route can be left unprotected by accident.

The URLs are the same ones the frontend already calls (POST /api/projects, PATCH /api/projects/{id}, ...).
Moving them under /api/admin/ is a separate change that needs the frontend updated in the same PR.
"""
from fastapi import APIRouter, Depends

from app.core.security import require_admin
from app.routes.admin import ai, documents, projects

router = APIRouter(dependencies=[Depends(require_admin)])
router.include_router(projects.router)
router.include_router(documents.router)
router.include_router(ai.router)
