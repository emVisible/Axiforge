"""身份绑定与 AI 草稿测试"""

import pytest
from httpx import AsyncClient

from app.services.ai_draft import prose_to_script, suggest_character_layers


def test_prose_to_script_rules():
    script = prose_to_script(
        "【旁白：夜色降临。】\n堰纱：你来了。\n> 点头 | 沉默",
        role_names=["堰纱"],
    )
    ops = [s["op"] for s in script]
    assert "narration" in ops
    assert "say" in ops
    assert ops[-1] == "choice"


def test_suggest_character_layers():
    layers = suggest_character_layers("测试", "背负秘密的少女", ["RN"])
    assert layers["anchor"]["name"] == "测试"
    assert layers["psyche"]["desire"]


@pytest.mark.asyncio
async def test_user_session_and_profile(client: AsyncClient):
    body = {
        "creator_id": "creator-test-user-001",
        "player_token": "player-test-user-001",
    }
    r = await client.post("/api/v1/users/session", json=body)
    r.raise_for_status()
    assert r.json()["creator_id"] == body["creator_id"]

    upd = await client.put(
        "/api/v1/users/profile",
        json={**body, "email": "user@example.com", "display_name": "测试用户"},
    )
    upd.raise_for_status()
    assert upd.json()["display_name"] == "测试用户"

    resolved = await client.get(
        "/api/v1/users/resolve", params={"email": "user@example.com"}
    )
    resolved.raise_for_status()
    assert len(resolved.json()["profiles"]) >= 1


@pytest.mark.asyncio
async def test_identity_link_and_resolve(client: AsyncClient):
    link = await client.post(
        "/api/v1/identity/link-email",
        json={
            "local_id": "creator-test-uuid-001",
            "email": "test@example.com",
            "kind": "creator",
        },
    )
    link.raise_for_status()
    assert link.json()["email"] == "test@example.com"

    resolved = await client.get(
        "/api/v1/identity/resolve", params={"email": "test@example.com"}
    )
    resolved.raise_for_status()
    assert len(resolved.json()["links"]) >= 1


@pytest.mark.asyncio
async def test_ai_prose_endpoint(client: AsyncClient):
    r = await client.post(
        "/api/v1/editor/ai/prose-to-script",
        json={"prose": "旁白：风起了。\n角色A：你好。", "role_names": ["角色A"]},
    )
    r.raise_for_status()
    assert r.json()["script"]


@pytest.mark.asyncio
async def test_report_placeholder(client: AsyncClient):
    r = await client.post(
        "/api/v1/report/",
        json={
            "target_type": "project",
            "target_id": "00000000-0000-0000-0000-000000000001",
            "reason": "测试举报占位",
        },
    )
    r.raise_for_status()
    assert r.json()["id"]
