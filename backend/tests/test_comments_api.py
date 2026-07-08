"""Comment API integration tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_comment_thread_crud(client: AsyncClient):
    author = "creator-test-01"
    create = await client.post(
        "/api/v1/comments",
        json={
            "content_type": "project",
            "content_id": "proj-1",
            "author_id": author,
            "body": "主线讨论",
        },
    )
    assert create.status_code == 201
    root = create.json()
    root_id = root["id"]

    reply = await client.post(
        "/api/v1/comments",
        json={
            "content_type": "project",
            "content_id": "proj-1",
            "author_id": author,
            "body": "同意！",
            "parent_id": root_id,
        },
    )
    assert reply.status_code == 201

    listed = await client.get(
        "/api/v1/comments",
        params={"content_type": "project", "content_id": "proj-1", "sort": "recent"},
    )
    assert listed.status_code == 200
    data = listed.json()
    assert data["total"] == 1
    assert len(data["items"][0]["replies"]) == 1

    deleted = await client.delete(
        f"/api/v1/comments/{root_id}",
        params={"author_id": author},
    )
    assert deleted.status_code == 204
