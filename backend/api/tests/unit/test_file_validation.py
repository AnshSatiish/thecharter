"""Upload checks on the actual bytes (app/services/files/validation.py)."""
import io

import pytest
from fastapi import HTTPException, UploadFile

from app.services.files.validation import MB, image_extension, is_pdf, read_limited, read_pdf
from tests.conftest import make_pdf


def upload(data: bytes, name: str = "file.bin") -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=name)


@pytest.mark.parametrize(("data", "expected"), [
    (b"\xff\xd8\xff\xe0" + b"\x00" * 16, ".jpg"),
    (b"\x89PNG\r\n\x1a\n" + b"\x00" * 16, ".png"),
    (b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 16, ".webp"),
    (b"GIF89a" + b"\x00" * 16, None),
    (b"%PDF-1.4", None),
    (b"", None),
])
def test_image_extension_reads_magic_bytes(data, expected):
    assert image_extension(data) == expected


def test_is_pdf():
    assert is_pdf(b"%PDF-1.7 ...")
    assert not is_pdf(b"<html>%PDF-")


def test_read_limited_returns_the_bytes():
    assert read_limited(upload(b"hello"), max_mb=1) == b"hello"


def test_read_limited_refuses_empty_files():
    with pytest.raises(HTTPException) as err:
        read_limited(upload(b"", "empty.jpg"), max_mb=1)
    assert err.value.status_code == 422 and "empty.jpg" in err.value.detail


def test_read_limited_refuses_files_over_the_limit():
    with pytest.raises(HTTPException) as err:
        read_limited(upload(b"x" * (MB + 1), "big.jpg"), max_mb=1)
    assert err.value.status_code == 413


def test_read_pdf_extracts_text_and_pages():
    data, text, pages = read_pdf(upload(make_pdf(["Lake Kivu report", ""]), "r.pdf"))
    assert data.startswith(b"%PDF-") and "Lake Kivu report" in text and pages == 2


def test_read_pdf_refuses_other_files():
    with pytest.raises(HTTPException) as err:
        read_pdf(upload(b"\xff\xd8\xff not a pdf"))
    assert err.value.status_code == 415


def test_read_pdf_refuses_a_broken_pdf():
    with pytest.raises(HTTPException) as err:
        read_pdf(upload(b"%PDF-1.4 this is not really a pdf"))
    assert err.value.status_code == 422
