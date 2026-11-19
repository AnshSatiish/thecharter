"""Admin authorisation and the settings it depends on (app/core/security.py, app/core/config.py)."""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import DEV_ADMIN_TOKEN, Settings
from app.core.security import require_admin


def test_missing_token_is_401():
    with pytest.raises(HTTPException) as err:
        require_admin(None)
    assert err.value.status_code == 401


@pytest.mark.parametrize("token", ["wrong", "test-admin-token ", "TEST-ADMIN-TOKEN", ""])
def test_wrong_token_is_rejected(token):
    with pytest.raises(HTTPException) as err:
        require_admin(token)
    assert err.value.status_code in (401, 403)


def test_correct_token_passes():
    assert require_admin("test-admin-token") is None  # conftest sets ADMIN_TOKEN


def test_production_refuses_to_start_without_a_token():
    with pytest.raises(ValidationError, match="ADMIN_TOKEN must be set"):
        Settings(env="production", admin_token=None)


def test_development_falls_back_to_the_dev_token():
    assert Settings(env="development", admin_token=None).admin_token == DEV_ADMIN_TOKEN


def test_postgres_urls_are_pointed_at_psycopg3():
    assert Settings(database_url="postgresql://u:p@h/db").database_url == "postgresql+psycopg://u:p@h/db"
    assert Settings(database_url="postgres://u:p@h/db").is_postgres


def test_cors_origins_are_split_and_trimmed():
    assert Settings(cors_origins=" http://a.test , ,http://b.test").cors_origin_list == ["http://a.test", "http://b.test"]
