"""Player API integration tests."""

from httpx import AsyncClient
import pytest


async def _create_branch_project(client: AsyncClient) -> tuple[str, str, str, str]:
    """Create project with start -> choice -> branch A flow. Returns ids."""
    char = await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {"name": "测试角色", "essence": "test", "tags": []},
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
            },
            "is_public": True,
        },
    )
    char.raise_for_status()
    char_id = char.json()["id"]

    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "pytest剧本", "description": "", "author_id": "pytest"},
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]

    scene = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes",
        json={"title": "场景1", "description": ""},
    )
    scene.raise_for_status()
    scene_body = scene.json()
    scene_id = scene_body["id"]
    start_id = next(
        n["id"]
        for n in scene_body["nodes"]
        if n["narrative_data"].get("title") == "开始"
    )

    n1 = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={
            "narrative_data": {
                "dialogue": "请选择。",
                "effects": [{"type": "flag", "key": "started", "value": True}],
            }
        },
    )
    n2 = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={
            "narrative_data": {
                "dialogue": "你选了 A。",
                "effects": [{"type": "memory", "key": "choice_a", "value": "picked"}],
            }
        },
    )
    n1.raise_for_status()
    n2.raise_for_status()
    n1_id = n1.json()["id"]
    n2_id = n2.json()["id"]

    await client.post(
        f"/api/v1/editor/projects/{proj_id}/edges",
        json=[
            {
                "source_node_id": start_id,
                "target_node_id": n1_id,
                "label": "继续",
            },
            {
                "source_node_id": n1_id,
                "target_node_id": n2_id,
                "label": "选A",
            },
        ],
    )

    await client.post(
        f"/api/v1/editor/projects/{proj_id}/roles",
        json={"character_ref_id": char_id, "importance": 2},
    )

    return proj_id, start_id, n1_id, n2_id


@pytest.mark.asyncio
async def test_player_branch_writes_memory_and_flag(client: AsyncClient):
    proj_id, start_id, n1_id, n2_id = await _create_branch_project(client)

    session = await client.post(
        "/api/v1/play/sessions",
        json={"project_id": proj_id, "player_name": "pytest"},
    )
    session.raise_for_status()
    session_id = session.json()["id"]

    # start anchor -> n1
    r1 = await client.post(
        f"/api/v1/play/sessions/{session_id}/complete",
        json={"node_id": start_id, "choice_label": "继续"},
    )
    r1.raise_for_status()
    node1 = r1.json()["available_nodes"][0]["node_id"]

    # n1 -> n2 via 选A
    r2 = await client.post(
        f"/api/v1/play/sessions/{session_id}/complete",
        json={"node_id": node1, "choice_label": "选A"},
    )
    r2.raise_for_status()
    assert "A" in (r2.json()["available_nodes"][0].get("dialogue") or "")

    # complete n2 to apply memory effect
    node2 = r2.json()["available_nodes"][0]["node_id"]
    assert node2 == n2_id

    await client.post(
        f"/api/v1/play/sessions/{session_id}/complete",
        json={"node_id": node2},
    )

    memories = await client.get(f"/api/v1/play/sessions/{session_id}/memories")
    flags = await client.get(f"/api/v1/play/sessions/{session_id}/flags")
    memories.raise_for_status()
    flags.raise_for_status()

    mem_keys = {m["key"] for m in memories.json()}
    flag_keys = {f["key"] for f in flags.json()}
    assert "choice_a" in mem_keys
    assert "started" in flag_keys
