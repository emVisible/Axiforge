"""官方示范作种子测试"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_seed_showcase_idempotent(client: AsyncClient):
    r1 = await client.post("/api/v1/editor/projects/seed/showcase")
    r1.raise_for_status()
    body1 = r1.json()
    assert "projects" in body1
    assert len(body1["projects"]) == 3
    assert body1["projects"][0]["status"] in ("created", "exists")

    r2 = await client.post("/api/v1/editor/projects/seed/showcase")
    r2.raise_for_status()
    body2 = r2.json()
    assert all(p["status"] == "exists" for p in body2["projects"])


@pytest.mark.asyncio
async def test_showcase_projects_compile(client: AsyncClient):
    await client.post("/api/v1/editor/projects/seed/showcase")
    templates = await client.get("/api/v1/editor/projects/templates")
    templates.raise_for_status()
    titles = {p["title"] for p in templates.json()}
    assert "【示范】序章·交汇" in titles
    assert "【示范】缘起·选择" in titles
    assert "【示范】再会·记忆" in titles

    for proj in templates.json():
        if not proj["title"].startswith("【示范】"):
            continue
        story = await client.get(f"/api/v1/play/story/{proj['id']}")
        story.raise_for_status()
        pkg = story.json()
        assert pkg["beats"]
        assert pkg["startBeatId"]
