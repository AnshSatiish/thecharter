"""Local file storage: safe names, staying inside the upload folder."""
import pytest

from app.services.files.storage import LocalStorage, safe_filename


def test_safe_filename():
    assert safe_filename("../../etc/passwd") == "passwd"
    assert safe_filename("C:\\Users\\x\\Informe final (2).PDF") == "Informe-final-2-.PDF"
    assert safe_filename("señal.pdf") == "senal.pdf"
    assert safe_filename("...") == "file"


def test_local_storage_stays_inside_root(tmp_path):
    storage = LocalStorage(tmp_path / "uploads")
    path = storage.save(b"data", "projects/1", "../../escape.txt")
    assert path.startswith("projects/1/") and path.endswith("-escape.txt")
    assert (tmp_path / "uploads" / path).read_bytes() == b"data"
    assert storage.url(path) == f"/files/{path}"
    assert storage.save(b"data", "projects/1", "escape.txt") != path  # unique names

    with pytest.raises(ValueError):
        storage.save(b"data", "../outside", "a.txt")
    (tmp_path / "secret.txt").write_text("keep")
    with pytest.raises(ValueError):
        storage.delete("../secret.txt")
    assert (tmp_path / "secret.txt").exists()
    storage.delete(path)
    storage.delete(path)  # deleting a missing file is not an error
    assert not (tmp_path / "uploads" / path).exists()
