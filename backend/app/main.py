"""FastAPI application and router setup."""
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import ai, authors, documents, projects
from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.session import engine
from app.services.storage import URL_PREFIX


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db(engine)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="The Charter API",
        description="Map-based library of verified photojournalism and social science research.",
        version="0.2.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(projects.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(authors.router, prefix="/api")
    app.include_router(ai.router, prefix="/api")

    # Uploaded photographs and PDFs. Object storage replaces this mount in production.
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount(URL_PREFIX, StaticFiles(directory=settings.upload_dir), name="files")

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok", "database": engine.dialect.name}

    return app


app = create_app()
