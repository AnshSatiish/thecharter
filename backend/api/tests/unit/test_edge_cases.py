"""Additional edge cases 
"""

import io

import pytest
from fastapi import UploadFile

from app.services.files.storage import LocalStorage, safe_filename
from app.services.files.validation import MB, read_limited
from app.services.geo.distance import in_bbox, parse_bbox


# Filename edge cases not covered by test_storage.py

def test_safe_filename_handles_an_empty_name():
    assert safe_filename("") == "file"


def test_safe_filename_truncates_extremely_long_names():
    result = safe_filename("a" * 300 + ".pdf")
    assert len(result) <= 120
    assert result.endswith(".pdf")


# Symlink traversal is different from the existing ../ traversal test.

def test_storage_rejects_save_through_symlink_outside_upload_root(tmp_path):
    root = tmp_path / "uploads"
    root.mkdir()
    outside = tmp_path / "outside"
    outside.mkdir()
    (root / "linked").symlink_to(outside, target_is_directory=True)

    storage = LocalStorage(root)
    with pytest.raises(ValueError, match="escapes"):
        storage.save(b"must not be written", "linked", "payload.txt")

    assert list(outside.iterdir()) == []


def test_storage_rejects_delete_through_symlink_outside_upload_root(tmp_path):
    root = tmp_path / "uploads"
    root.mkdir()
    outside_file = tmp_path / "keep.txt"
    outside_file.write_text("keep me", encoding="utf-8")
    (root / "linked.txt").symlink_to(outside_file)

    storage = LocalStorage(root)
    with pytest.raises(ValueError, match="escapes"):
        storage.delete("linked.txt")

    assert outside_file.read_text(encoding="utf-8") == "keep me"


# Boundary-specific geographic cases not covered by test_geo_distance.py.

@pytest.mark.parametrize(
    ("lat", "lng"),
    [
        (0, 0),    # lower-left corner
        (10, 10),  # upper-right corner
        (5, 0),    # left edge
        (5, 10),   # right edge
        (0, 5),    # bottom edge
        (10, 5),   # top edge
    ],
)
def test_bbox_includes_all_edges_and_corners(lat, lng):
    assert in_bbox(lat, lng, 0, 0, 10, 10)


@pytest.mark.parametrize("raw", ["-10,-91,10,10", "-10,-10,10,91"])
def test_parse_bbox_rejects_latitudes_outside_valid_range(raw):
    with pytest.raises(ValueError):
        parse_bbox(raw)


@pytest.mark.parametrize("raw", ["-181,-10,10,10", "-10,-10,181,10"])
def test_parse_bbox_rejects_longitudes_outside_valid_range(raw):
    with pytest.raises(ValueError):
        parse_bbox(raw)


# Exact upper boundary of the configured upload limit.

def test_read_limited_accepts_file_exactly_at_size_limit():
    upload = UploadFile(file=io.BytesIO(b"x" * MB), filename="at-limit.bin")
    assert read_limited(upload, max_mb=1) == b"x" * MB
