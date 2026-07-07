"""存档槽持久化集成测试（桥4 第二层·持久记忆，ADR-011）"""

from httpx import AsyncClient
import pytest


async def _create_project(client: AsyncClient) -> str:
    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "存档剧本", "description": "", "author_id": "pytest"},
    )
    proj.raise_for_status()
    return proj.json()["id"]


def _sample_state(affection: int) -> dict:
    return {
        "currentBeatId": "beat_a",
        "cursor": 2,
        "vars": {
            "memory": {"met_alice": True},
            "flags": {"intro_done": True},
            "characters": {"c1": {"affection": affection, "mood": "happy"}},
        },
        "completedBeats": ["intro"],
        "status": "active",
        "pendingChoiceLabel": None,
        "pendingChoiceTarget": None,
    }


@pytest.mark.asyncio
async def test_save_upsert_get_clear(client: AsyncClient):
    proj_id = await _create_project(client)
    token = "player-abc"

    # 无存档 → 404
    miss = await client.get(f"/api/v1/play/save/{proj_id}", params={"player_token": token})
    assert miss.status_code == 404

    # 首次写入
    put = await client.put(
        f"/api/v1/play/save/{proj_id}",
        json={
            "player_token": token,
            "state": _sample_state(20),
            "summary": "爱丽丝: 你好",
            "beat_id": "beat_a",
        },
    )
    put.raise_for_status()
    body = put.json()
    assert body["player_token"] == token
    assert body["slot"] == 0
    assert body["state"]["vars"]["characters"]["c1"]["affection"] == 20

    # 读回：关系值持久化（跨会话存活）
    got = await client.get(f"/api/v1/play/save/{proj_id}", params={"player_token": token})
    got.raise_for_status()
    assert got.json()["state"]["vars"]["characters"]["c1"]["affection"] == 20
    assert got.json()["summary"] == "爱丽丝: 你好"

    # 再次写入同槽 → 覆盖而非新增
    put2 = await client.put(
        f"/api/v1/play/save/{proj_id}",
        json={"player_token": token, "state": _sample_state(55), "beat_id": "beat_b"},
    )
    put2.raise_for_status()
    assert put2.json()["id"] == body["id"]  # 同一行被更新
    assert put2.json()["state"]["vars"]["characters"]["c1"]["affection"] == 55

    # 不同玩家 token 互不干扰
    other = await client.get(
        f"/api/v1/play/save/{proj_id}", params={"player_token": "player-xyz"}
    )
    assert other.status_code == 404

    # 清档
    dele = await client.delete(
        f"/api/v1/play/save/{proj_id}", params={"player_token": token}
    )
    assert dele.status_code == 204
    after = await client.get(
        f"/api/v1/play/save/{proj_id}", params={"player_token": token}
    )
    assert after.status_code == 404


@pytest.mark.asyncio
async def test_list_saves_multi_slot(client: AsyncClient):
    proj_id = await _create_project(client)
    token = "player-multi"

    for slot in (0, 1, 2):
        resp = await client.put(
            f"/api/v1/play/save/{proj_id}",
            json={
                "player_token": token,
                "state": _sample_state(10 + slot),
                "summary": f"槽{slot}",
                "slot": slot,
                "thumb_path": f"/uploads/thumb{slot}.png",
            },
        )
        resp.raise_for_status()

    listed = await client.get(
        f"/api/v1/play/save/{proj_id}/list", params={"player_token": token}
    )
    listed.raise_for_status()
    body = listed.json()
    assert len(body) == 3
    slots = {s["slot"] for s in body}
    assert slots == {0, 1, 2}
    thumb = next(s for s in body if s["slot"] == 1)
    assert thumb["thumb_path"] == "/uploads/thumb1.png"
    resp = await client.put(
        "/api/v1/play/save/00000000-0000-0000-0000-000000000000",
        json={"player_token": "t", "state": _sample_state(1)},
    )
    assert resp.status_code == 404
