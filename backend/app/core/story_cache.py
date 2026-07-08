"""StoryPackage 进程内 LRU 缓存（ETag 随 project.updated_at 失效）。"""

from __future__ import annotations

import hashlib
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional


@dataclass
class _Entry:
    etag: str
    payload: dict[str, Any]


class StoryPackageCache:
    def __init__(self, max_size: int = 64) -> None:
        self._max = max_size
        self._store: OrderedDict[str, _Entry] = OrderedDict()

    @staticmethod
    def etag_for(project_id: str, updated_at: datetime) -> str:
        raw = f"{project_id}:{updated_at.isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def get(self, project_id: str, etag: str) -> Optional[dict[str, Any]]:
        entry = self._store.get(project_id)
        if not entry or entry.etag != etag:
            return None
        self._store.move_to_end(project_id)
        return entry.payload

    def set(self, project_id: str, etag: str, payload: dict[str, Any]) -> None:
        self._store[project_id] = _Entry(etag=etag, payload=payload)
        self._store.move_to_end(project_id)
        while len(self._store) > self._max:
            self._store.popitem(last=False)

    def invalidate(self, project_id: str) -> None:
        self._store.pop(project_id, None)


story_cache = StoryPackageCache()
