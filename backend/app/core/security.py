"""Admin authorisation (scaffold).

Admin-only endpoints currently require an `X-Admin-Token` header matching the
ADMIN_TOKEN setting. In development the token defaults to "dev-admin-token";
with ENV=production the app refuses to start unless ADMIN_TOKEN is set.

This is a deliberate placeholder, not the final design. Per the README it will be
replaced by JWT sessions, bcrypt-hashed passwords and an admin-controlled
institutional email allowlist, with per-user roles instead of one shared token.
"""
import secrets

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    """FastAPI dependency: 401 when the header is missing, 403 when it is wrong."""
    if not x_admin_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing X-Admin-Token header")
    expected = get_settings().admin_token or ""
    if not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid admin token")
