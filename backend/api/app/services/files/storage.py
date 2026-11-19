"""File storage for uploaded photographs and PDFs.

LocalStorage writes under UPLOAD_DIR and is served by the API at /files. The
production plan is an S3/R2-compatible class with the same interface
(save, delete, url), so the routes do not change when storage does.
"""
import re
import unicodedata
import uuid
from pathlib import Path, PurePosixPath

from app.core.config import get_settings

URL_PREFIX = "/files"
_UNSAFE = re.compile(r"[^A-Za-z0-9._-]+")


def safe_filename(name: str, default: str = "file") -> str:
    """Reduce a client-supplied name to a harmless basename (no directories, ASCII only)."""
    base = name.replace("\\", "/").rsplit("/", 1)[-1]
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode()
    base = _UNSAFE.sub("-", base).strip(".-_")
    return base[-120:] or default


class LocalStorage:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def _resolve(self, relative: str) -> Path:
        target = (self.root / relative).resolve()
        if not target.is_relative_to(self.root) or target == self.root:
            raise ValueError("Path escapes the upload directory")
        return target

    def save(self, data: bytes, subdir: str, original_name: str) -> str:
        """Write `data` under `subdir` with a unique safe name; returns the path relative to the root."""
        name = f"{uuid.uuid4().hex[:12]}-{safe_filename(original_name)}"
        relative = (PurePosixPath(subdir.strip("/")) / name).as_posix()
        target = self._resolve(relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return relative

    def delete(self, path: str) -> None:
        self._resolve(path).unlink(missing_ok=True)

    def url(self, path: str) -> str:
        return f"{URL_PREFIX}/{path}"


def get_storage() -> LocalStorage:
    return LocalStorage(get_settings().upload_dir)
