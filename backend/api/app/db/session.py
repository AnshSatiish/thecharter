"""Engine and session factory."""
import json
from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def make_engine(url: str) -> Engine:
    sqlite = url.startswith("sqlite")
    settings = get_settings()
    # A full pool answers "503 busy" after db_pool_timeout seconds (app.main) instead of queueing requests.
    pool = {} if sqlite else {"pool_size": settings.db_pool_size, "max_overflow": settings.db_max_overflow,
                              "pool_timeout": settings.db_pool_timeout}
    # ensure_ascii=False keeps accented keywords searchable as typed (e.g. "Darién").
    return create_engine(
        url,
        connect_args={"check_same_thread": False} if sqlite else {},
        pool_pre_ping=True,
        json_serializer=lambda obj: json.dumps(obj, ensure_ascii=False),
        **pool,
    )


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_postgres(db: Session) -> bool:
    return db.get_bind().dialect.name == "postgresql"
