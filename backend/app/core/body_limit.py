"""请求体大小限制中间件。"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

MAX_BODY_BYTES = 2 * 1024 * 1024  # 2MB（JSON API 够用；上传走 multipart 另路由）


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            cl = request.headers.get("content-length")
            if cl and int(cl) > MAX_BODY_BYTES:
                return JSONResponse(
                    {"detail": f"Request body too large (max {MAX_BODY_BYTES} bytes)"},
                    status_code=413,
                )
        return await call_next(request)
