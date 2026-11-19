"""FastAPI application: middleware, error handling and the public + admin routers."""
import logging
import threading
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import TimeoutError as PoolTimeout

from app.ai.embeddings import EmbedderUnavailable, get_embedder
from app.core.config import get_settings
from app.db.init_db import init_db
from app.db.session import engine
from app.routes import admin, public
from app.services.files.storage import URL_PREFIX


def _warm_up_embedder() -> None:
    try:
        get_embedder().embed(["warm up"])
    except EmbedderUnavailable as exc:
        logging.getLogger(__name__).warning("Semantic search is off: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    init_db(engine)

    if settings.semantic_search and settings.env != "test":
        # Load the sentence model in the background.
        threading.Thread(target=_warm_up_embedder, daemon=True).start()

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

    @app.exception_handler(PoolTimeout)
    async def busy(_: Request, __: PoolTimeout) -> JSONResponse:
        return JSONResponse(
            {"detail": "The server is busy. Try again in a moment."},
            status_code=503,
            headers={"Retry-After": "2"},
        )

    for router in public.routers:
        app.include_router(router, prefix="/api")
    app.include_router(admin.router, prefix="/api")

    # Uploaded photographs and PDFs. Object storage replaces this mount in production.
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount(URL_PREFIX, StaticFiles(directory=settings.upload_dir), name="files")

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok", "database": engine.dialect.name}

    return app


app = create_app()
