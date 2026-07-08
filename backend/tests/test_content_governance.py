"""Phase E 治理组件单测。"""

from app.core.content_validate import validate_publish_text
from app.core.story_cache import StoryPackageCache
from datetime import datetime, timezone


def test_validate_publish_rejects_empty_title():
    errors = validate_publish_text("", "desc")
    assert errors


def test_validate_publish_accepts_normal_title():
    assert not validate_publish_text("正常标题", "简介")


def test_story_cache_etag_roundtrip():
    cache = StoryPackageCache(max_size=2)
    pid = "00000000-0000-0000-0000-000000000001"
    updated = datetime(2026, 1, 1, tzinfo=timezone.utc)
    etag = cache.etag_for(pid, updated)
    cache.set(pid, etag, {"title": "t"})
    assert cache.get(pid, etag) == {"title": "t"}
    cache.invalidate(pid)
    assert cache.get(pid, etag) is None
