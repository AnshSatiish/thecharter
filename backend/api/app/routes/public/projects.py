"""Project endpoints for the map: list with filters, nearby search and detail."""
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import DB
from app.db.models import Project
from app.schemas import Category, ProjectNearOut, ProjectOut
from app.services import projects as service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: DB,
    category: Annotated[list[Category] | None, Query()] = None,
    sdg: Annotated[list[str] | None, Query(description='Match any, e.g. sdg=SDG10&sdg=SDG13')] = None,
    year_from: int | None = None,
    year_to: int | None = None,
    q: Annotated[str | None, Query(max_length=200)] = None,
    bbox: Annotated[str | None, Query(description="minLng,minLat,maxLng,maxLat (minLng > maxLng crosses the antimeridian)")] = None,
) -> list[Project]:
    return service.list_projects(db, category, sdg, year_from, year_to, q, bbox)


@router.get("/near", response_model=list[ProjectNearOut])
def projects_near(
    db: DB,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    km: Annotated[float, Query(gt=0, le=20040)] = 500,
) -> list[ProjectNearOut]:
    """Projects within `km` of a point, nearest first. PostGIS on PostgreSQL, haversine otherwise."""
    out = []
    for project, distance in service.projects_near(db, lat, lng, km):
        project.distance_km = round(distance, 1)  # transient attribute, read by the schema
        out.append(ProjectNearOut.model_validate(project))
    return out


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: DB) -> Project:
    return service.get_project_or_404(db, project_id)
