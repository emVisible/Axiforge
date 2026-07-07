"""跨作品 IP 账本（Player Codex）集成测试"""

import uuid

from httpx import AsyncClient
import pytest


@pytest.mark.asyncio
async def test_codex_upsert_and_query(client: AsyncClient):
    token = f"player-codex-{uuid.uuid4().hex[:8]}"
    char_id = "char-aaa-bbbb"

    empty = await client.get(
        "/api/v1/play/codex",
        params={"player_token": token, "character_ids": char_id},
    )
    empty.raise_for_status()
    assert empty.json()["ledger"] == {}

    put = await client.put(
        "/api/v1/play/codex",
        json={
            "player_token": token,
            "ledger": {char_id: {"met_before": True, "affection": 42}},
        },
    )
    put.raise_for_status()
    body = put.json()["ledger"]
    assert body[char_id]["met_before"] is True
    assert body[char_id]["affection"] == 42

    got = await client.get(
        "/api/v1/play/codex",
        params={"player_token": token},
    )
    got.raise_for_status()
    assert got.json()["ledger"][char_id]["affection"] == 42

    # 合并更新
    await client.put(
        "/api/v1/play/codex",
        json={
            "player_token": token,
            "ledger": {char_id: {"affection": 80, "route": "true_end"}},
        },
    )
    merged = await client.get(
        "/api/v1/play/codex",
        params={"player_token": token, "character_ids": char_id},
    )
    merged.raise_for_status()
    bucket = merged.json()["ledger"][char_id]
    assert bucket["affection"] == 80
    assert bucket["route"] == "true_end"
    assert bucket["met_before"] is True
