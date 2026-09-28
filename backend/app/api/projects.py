"""Project endpoints: list with filters, nearby search, detail, upload and verification."""
import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, and_, cast, func, or_, select, text
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.models import Author, Project
from app.db.session import get_db, is_postgres
from app.schemas import Category, ProjectIn, ProjectNearOut, ProjectOut
from app.services.authors import get_or_create_author
from app.services.geo import haversine_km, parse_bbox

router = APIRouter(prefix="/projects", tags=["projects"])
DB = Annotated[Session, Depends(get_db)]


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


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
    stmt = select(Project).join(Project.author)

    if category:
        stmt = stmt.where(Project.category.in_(category))
    if sdg:
        # JSON arrays are stored as text on both backends; matching the quoted code avoids SDG1 matching SDG10.
        sdgs_text = cast(Project.sdgs, String)
        stmt = stmt.where(or_(*(sdgs_text.like(f'%"{s.strip().upper()}"%') for s in sdg)))
    if year_from is not None:
        stmt = stmt.where(Project.date >= dt.date(year_from, 1, 1))
    if year_to is not None:
        stmt = stmt.where(Project.date <= dt.date(year_to, 12, 31))
    if q and q.strip():
        pattern = f"%{_escape_like(q.strip())}%"
        stmt = stmt.where(
            or_(
                Project.title.ilike(pattern, escape="\\"),
                Project.description.ilike(pattern, escape="\\"),
                Project.location_name.ilike(pattern, escape="\\"),
                Author.name.ilike(pattern, escape="\\"),
                cast(Project.keywords, String).ilike(pattern, escape="\\"),
            )
        )
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = parse_bbox(bbox)
        except ValueError as exc:
            raise HTTPException(422, f"Invalid bbox: {exc}") from exc
        lng_ok = (
            Project.lng.between(min_lng, max_lng)
            if min_lng <= max_lng
            else or_(Project.lng >= min_lng, Project.lng <= max_lng)
        )
        stmt = stmt.where(and_(Project.lat.between(min_lat, max_lat), lng_ok))

    return list(db.scalars(stmt.order_by(Project.date.desc(), Project.id)).unique())


@router.get("/near", response_model=list[ProjectNearOut])
def projects_near(
    db: DB,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    km: Annotated[float, Query(gt=0, le=20040)] = 500,
) -> list[ProjectNearOut]:
    """Projects within `km` of a point, nearest first. PostGIS on PostgreSQL, haversine otherwise."""
    if is_postgres(db):
        rows = db.execute(
            text(
                """
                SELECT id, ST_Distance(location, ST_MakePoint(:lng, :lat)::geography) / 1000.0 AS km
                FROM projects
                WHERE ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :meters)
                ORDER BY km
                """
            ),
            {"lat": lat, "lng": lng, "meters": km * 1000},
        ).all()
        distances = {row.id: row.km for row in rows}
        projects = {p.id: p for p in db.scalars(select(Project).where(Project.id.in_(distances))).unique()}
        ranked = [(projects[pid], d) for pid, d in distances.items()]
    else:
        scored = ((p, haversine_km(lat, lng, p.lat, p.lng)) for p in db.scalars(select(Project)).unique())
        ranked = sorted((pair for pair in scored if pair[1] <= km), key=lambda pair: pair[1])

    return [
        ProjectNearOut.model_validate({**ProjectOut.model_validate(p).model_dump(exclude={"year"}), "distance_km": round(d, 1)})
        for p, d in ranked
    ]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: DB) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_project(body: ProjectIn, db: DB) -> Project:
    """Admin upload. New projects start unverified until a curator gives the blue mark."""
    author = get_or_create_author(
        db,
        body.author_name,
        affiliation=body.author_affiliation,
        profession=body.author_profession,
        role=body.author_role,
        website=body.author_website,
    )
    data = body.model_dump(exclude={n for n in ProjectIn.model_fields if n.startswith("author_")})
    project = Project(**data, verified=False, author=author)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}/verify", response_model=ProjectOut, dependencies=[Depends(require_admin)])
def verify_project(project_id: int, db: DB) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    project.verified = True
    db.commit()
    db.refresh(project)
    return project
