"""Admin Bearer token 校验（ADR-018）。"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_bearer = HTTPBearer(auto_error=False)


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    token = settings.admin_token
    if not token:
        raise HTTPException(503, "Admin API disabled (ADMIN_TOKEN not set)")
    if not credentials or credentials.credentials != token:
        raise HTTPException(401, "Invalid admin token")
    return credentials.credentials
