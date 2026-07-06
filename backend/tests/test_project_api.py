"""Project editor API integration tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project_with_default_scene(client: AsyncClient):
    created = await client.post(
        "/api/v1/editor/projects/",
        json={
            "title": "API测试剧本",
            "description": "集成测试用",
            "author_id": "pytest",
            "is_public": True,
        },
    )
    assert created.status_code == 201
    body = created.json()
    project_id = body["id"]
    assert body["title"] == "API测试剧本"

    fetched = await client.get(f"/api/v1/editor/projects/{project_id}")
    assert fetched.status_code == 200
    project = fetched.json()
    assert len(project["scenes"]) >= 1
    scene = project["scenes"][0]
    assert len(scene["nodes"]) >= 2
    titles = {n["narrative_data"].get("title") for n in scene["nodes"]}
    assert "开始" in titles
    assert "结束" in titles


@pytest.mark.asyncio
async def test_global_search_includes_characters(client: AsyncClient):
    unique_name = "搜索专用角色XYZ"
    await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {"name": unique_name, "essence": "search", "tags": []},
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
            },
            "is_public": True,
        },
    )

    response = await client.get("/api/v1/search/all", params={"q": "搜索专用"})
    assert response.status_code == 200
    results = response.json()["results"]
    types = {item["type"] for item in results}
    assert "角色" in types
