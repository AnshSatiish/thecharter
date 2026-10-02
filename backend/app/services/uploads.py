"""Upload validation: size limits and file-type checks on the actual bytes.

The client's filename and Content-Type are never trusted to decide what a file is.
"""
from fastapi import HTTPException, UploadFile

MB = 1024 * 1024


def read_limited(upload: UploadFile, max_mb: int) -> bytes:
    """Read an upload fully, refusing empty files and anything over `max_mb`."""
    data = upload.file.read(max_mb * MB + 1)
    if len(data) > max_mb * MB:
        raise HTTPException(413, f"{upload.filename}: larger than {max_mb} MB")
    if not data:
        raise HTTPException(422, f"{upload.filename}: empty file")
    return data


def image_extension(data: bytes) -> str | None:
    """Extension for JPEG, PNG or WebP content, judged by magic bytes; None for anything else."""
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return None


def is_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"
