"""Nexus API integration tests."""

import pytest
from httpx import AsyncClient

AUTHOR_ID = "pytest-nexus-author"


@pytest.mark.asyncio
async def test_nexus_note_crud(client: AsyncClient):
    created = await client.post(
        "/api/v1/nexus/notes",
        json={
            "author_id": AUTHOR_ID,
            "title": "测试笔记",
            "body": "Nexus 集成测试内容",
            "tags": ["test"],
            "status": "inbox",
        },
    )
    assert created.status_code == 201
    note = created.json()
    note_id = note["id"]

    listed = await client.get(
        "/api/v1/nexus/notes",
        params={"author_id": AUTHOR_ID},
    )
    assert listed.status_code == 200
    assert any(n["id"] == note_id for n in listed.json())

    updated = await client.put(
        f"/api/v1/nexus/notes/{note_id}",
        json={"status": "archived"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_nexus_distribute_to_project_play_meta(client: AsyncClient):
    project = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "Nexus分发测试", "author_id": AUTHOR_ID},
    )
    assert project.status_code == 201
    project_id = project.json()["id"]

    note = await client.post(
        "/api/v1/nexus/notes",
        json={
            "author_id": AUTHOR_ID,
            "title": "备忘",
            "body": "来自 Nexus 的策划备忘",
            "related_projects": [project_id],
        },
    )
    assert note.status_code == 201
    note_id = note.json()["id"]

    dist = await client.post(
        "/api/v1/nexus/distribute",
        json={
            "author_id": AUTHOR_ID,
            "note_id": note_id,
            "target_type": "project",
            "target_id": project_id,
        },
    )
    assert dist.status_code == 200
    assert dist.json()["ok"] is True

    fetched = await client.get(f"/api/v1/editor/projects/{project_id}")
    assert fetched.status_code == 200
    meta = fetched.json().get("play_meta") or {}
    entries = meta.get("nexus_notes") or []
    assert len(entries) == 1
    assert entries[0]["text"] == "来自 Nexus 的策划备忘"
    assert entries[0]["source"] == "nexus"
