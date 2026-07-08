"""内存滑动窗口限流（单实例开发/小规模部署）。"""

import time
from collections import defaultdict, deque
from typing import Deque, DefaultDict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# path_prefix -> (max_requests, window_seconds)
LIMITS: dict[str, tuple[int, int]] = {
    "/api/v1/report": (20, 3600),
    "/api/v1/play": (120, 60),
}

_buckets: DefaultDict[str, Deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    token = request.headers.get("x-player-token") or request.query_params.get("player_token") or ""
    return f"{ip}:{token[:32]}"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        rule = next((v for prefix, v in LIMITS.items() if path.startswith(prefix)), None)
        if not rule:
            return await call_next(request)

        max_req, window = rule
        key = f"{path.split('/')[1:4]}:{_client_key(request)}"
        now = time.monotonic()
        bucket = _buckets[key]
        while bucket and bucket[0] <= now - window:
            bucket.popleft()
        if len(bucket) >= max_req:
            return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
        bucket.append(now)
        return await call_next(request)
