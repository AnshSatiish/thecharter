"""Project logic: filtered listing, nearby search, create, edit, verify and photo uploads.

Routes in app/routes/ validate the request and call these; nothing here knows about URLs.
"""
import datetime as dt
from pathlib import PurePosixPath

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import String, and_, cast, or_, select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Author, Document, Project
from app.db.session import is_postgres
from app.schemas import ProjectIn, ProjectPatch
from app.services.authors import get_or_create_author
from app.services.files.storage import LocalStorage, safe_filename
from app.services.files.validation import image_extension, read_limited
from app.services.geo.distance import haversine_km, parse_bbox
from app.services.search.indexing import reindex_project


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_projects(
    db: Session,
    category: list[str] | None = None,
    sdg: list[str] | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    q: str | None = None,
    bbox: str | None = None,
) -> list[Project]:
    """Projects matching every filter given, newest first. Raises 422 on a malformed bbox."""
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
                cast(Project.captions, String).ilike(pattern, escape="\\"),
                Project.summary.ilike(pattern, escape="\\"),
                # Keyword search over the uploaded PDFs
                Project.documents.any(
                    or_(
                        Document.text.ilike(pattern, escape="\\"),
                        Document.title.ilike(pattern, escape="\\"),
                        cast(Document.keywords, String).ilike(pattern, escape="\\"),
                    )
                ),
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


def projects_near(db: Session, lat: float, lng: float, km: float) -> list[tuple[Project, float]]:
    """(project, distance in km) within `km` of a point, nearest first. PostGIS on PostgreSQL, haversine otherwise."""
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
        return [(projects[pid], d) for pid, d in distances.items()]
    scored = ((p, haversine_km(lat, lng, p.lat, p.lng)) for p in db.scalars(select(Project)).unique())
    return sorted((pair for pair in scored if pair[1] <= km), key=lambda pair: pair[1])


def create_project(db: Session, body: ProjectIn) -> Project:
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
    reindex_project(db, project.id)
    db.refresh(project)
    return project


def verify_project(db: Session, project_id: int) -> Project:
    """Give the project the blue "curated" mark."""
    project = get_project_or_404(db, project_id)
    project.verified = True
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: int, body: ProjectPatch) -> Project:
    """Edit title, description, summary, captions or keywords. Fields left out are unchanged."""
    project = get_project_or_404(db, project_id)
    changes = body.model_dump(exclude_unset=True)
    for field in ("title", "description", "captions", "keywords"):
        if field in changes and changes[field] is None:
            raise HTTPException(422, f"{field} cannot be null")
    for field, value in changes.items():
        setattr(project, field, value)
    db.commit()
    reindex_project(db, project.id)
    db.refresh(project)
    return project


def add_images(
    db: Session, storage: LocalStorage, project_id: int, files: list[UploadFile], captions: list[str] | None
) -> Project:
    """Add photographs (JPEG, PNG or WebP) with their narration. Nothing is saved unless every file is valid."""
    project = get_project_or_404(db, project_id)
    captions = captions or []
    if len(captions) > len(files):
        raise HTTPException(422, "More captions than files")

    validated: list[tuple[bytes, str]] = []
    for upload in files:
        data = read_limited(upload, get_settings().max_image_mb)
        extension = image_extension(data)
        if extension is None:
            raise HTTPException(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"{upload.filename}: only JPEG, PNG and WebP images are accepted"
            )
        # The stored extension follows the real content, whatever the client called the file.
        stem = PurePosixPath(safe_filename(upload.filename or "", default="image")).stem or "image"
        validated.append((data, stem + extension))

    paths = [storage.save(data, f"projects/{project_id}", name) for data, name in validated]
    images = list(project.images or [])
    existing = (list(project.captions or []) + [""] * len(images))[: len(images)]
    new_captions = [c.strip() for c in captions] + [""] * (len(files) - len(captions))
    # Reassign rather than mutate: plain JSON columns do not track in-place changes.
    project.images = images + [storage.url(p) for p in paths]
    project.captions = existing + new_captions
    try:
        db.commit()
    except Exception:
        for p in paths:
            storage.delete(p)
        raise
    reindex_project(db, project.id)
    db.refresh(project)
    return project
