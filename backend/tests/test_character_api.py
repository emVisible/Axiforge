"""Character API integration tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_character(client: AsyncClient):
    created = await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {
                    "name": "API测试角色",
                    "essence": "用于集成测试",
                    "tags": ["test"],
                },
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
            },
            "is_public": True,
        },
    )
    assert created.status_code == 201
    body = created.json()
    char_id = body["id"]
    assert body["name"] == "API测试角色"
    assert body["is_public"] is True

    fetched = await client.get(f"/api/v1/characters/{char_id}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == char_id


@pytest.mark.asyncio
async def test_list_user_characters_by_author_id(client: AsyncClient):
    author_id = "creator-test-001"
    created = await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {
                    "name": "私有角色",
                    "essence": "仅作者可见",
                    "tags": [],
                },
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
            },
            "is_public": False,
            "author_id": author_id,
        },
    )
    assert created.status_code == 201
    assert created.json()["author_id"] == author_id

    listed = await client.get(f"/api/v1/characters/user/{author_id}")
    assert listed.status_code == 200
    items = listed.json()
    assert any(c["name"] == "私有角色" for c in items)

    other = await client.get("/api/v1/characters/user/other-creator")
    assert other.status_code == 200
    assert all(c["author_id"] != author_id for c in other.json())

    await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {"name": "公开角色", "essence": "x", "tags": []},
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
            },
            "is_public": True,
        },
    )

    response = await client.get("/api/v1/characters/public")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1
