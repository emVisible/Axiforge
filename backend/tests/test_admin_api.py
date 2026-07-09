"""Admin API integration tests."""

import pytest
from httpx import AsyncClient

ADMIN_HEADERS = {"Authorization": "Bearer dev-admin"}


@pytest.mark.asyncio
async def test_admin_requires_token(client: AsyncClient):
    res = await client.get("/api/v1/admin/dashboard/stats")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_dashboard_stats(client: AsyncClient):
    res = await client.get("/api/v1/admin/dashboard/stats", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert "pending_reports" in body
    assert "total_users" in body


@pytest.mark.asyncio
async def test_admin_moderation_context_project(client: AsyncClient):
    created = await client.post(
        "/api/v1/editor/projects/",
        json={
            "title": "审核上下文测试",
            "description": "用于 moderation context",
            "author_id": "pytest-admin",
            "is_public": True,
        },
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    ctx = await client.get(
        "/api/v1/admin/moderation/context",
        params={"target_type": "project", "target_id": project_id},
        headers=ADMIN_HEADERS,
    )
    assert ctx.status_code == 200
    body = ctx.json()
    preview = body["target_preview"]
    assert preview["exists"] is True
    assert preview["title"] == "审核上下文测试"
    assert preview["author_id"] == "pytest-admin"


@pytest.mark.asyncio
async def test_admin_list_projects_search(client: AsyncClient):
    unique = "管理搜索专用标题XYZ"
    await client.post(
        "/api/v1/editor/projects/",
        json={"title": unique, "author_id": "pytest-admin"},
    )
    res = await client.get(
        "/api/v1/admin/projects",
        params={"q": "搜索专用", "limit": 20, "offset": 0},
        headers=ADMIN_HEADERS,
    )
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(unique in p["title"] for p in items)
