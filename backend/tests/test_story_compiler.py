"""Story Compiler / IR 端点集成测试（ADR-008）"""

from uuid import uuid4

from httpx import AsyncClient
import pytest


async def _create_branch_project(client: AsyncClient):
    char = await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {"name": "编译测试角色", "essence": "test", "tags": []},
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
        json={"title": "编译剧本", "description": "", "author_id": "pytest", "is_public": True},
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
                "speaker": "编译测试角色",
                "dialogue": "请选择一条路。",
                "effects": [{"type": "flag", "key": "started", "value": True}],
            }
        },
    )
    n2 = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={"narrative_data": {"dialogue": "你选了 A。"}},
    )
    n3 = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={"narrative_data": {"dialogue": "你选了 B。"}},
    )
    n1.raise_for_status()
    n2.raise_for_status()
    n3.raise_for_status()
    n1_id, n2_id, n3_id = n1.json()["id"], n2.json()["id"], n3.json()["id"]

    await client.post(
        f"/api/v1/editor/projects/{proj_id}/edges",
        json=[
            {"source_node_id": start_id, "target_node_id": n1_id, "label": "继续"},
            {"source_node_id": n1_id, "target_node_id": n2_id, "label": "选A"},
            {"source_node_id": n1_id, "target_node_id": n3_id, "label": "选B"},
        ],
    )
    await client.post(
        f"/api/v1/editor/projects/{proj_id}/roles",
        json={"character_ref_id": char_id, "importance": 2},
    )
    return proj_id, start_id, n1_id, n2_id, n3_id


@pytest.mark.asyncio
async def test_compile_story_package(client: AsyncClient):
    proj_id, start_id, n1_id, n2_id, n3_id = await _create_branch_project(client)

    resp = await client.get(f"/api/v1/play/story/{proj_id}")
    resp.raise_for_status()
    pkg = resp.json()

    # 基本结构
    assert pkg["irVersion"] == 1
    assert pkg["projectId"] == proj_id
    assert pkg["title"] == "编译剧本"

    # 角色引用被解析
    assert any(c["name"] == "编译测试角色" for c in pkg["characters"])

    beats = {b["id"]: b for b in pkg["beats"]}
    assert start_id in beats and n1_id in beats

    # 起始 Beat：无入边的 开始 节点
    assert pkg["startBeatId"] == start_id

    # 单句节点 → say 指令（含 speaker）
    n1 = beats[n1_id]
    say = next(i for i in n1["script"] if i["op"] == "say")
    assert say["text"] == "请选择一条路。"
    assert say["speaker"] == "编译测试角色"
    # speaker 名称匹配角色 → characterId 被填充
    assert say["characterId"] is not None

    # 效果透传
    assert n1["effects"] == [{"type": "flag", "key": "started", "value": True}]

    # 两条出边 → choice 指令，含 to 目标
    choice = next(i for i in n1["script"] if i["op"] == "choice")
    labels = {o["label"]: o["to"] for o in choice["options"]}
    assert labels == {"选A": n2_id, "选B": n3_id}

    # 结局节点标记
    assert beats[n2_id]["isEnding"] is True
    assert beats[n3_id]["isEnding"] is True

    # 转场表
    assert len(pkg["transitions"]) == 3


@pytest.mark.asyncio
async def test_compile_instruction_set_v1(client: AsyncClient):
    """节点自带 v1 演出脚本（新指令）应被编译器原样校验透传（ADR-009 / v1.3 桥2）"""
    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "演出v1剧本", "description": "", "author_id": "pytest", "is_public": True},
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]

    scene = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes",
        json={"title": "序章", "description": ""},
    )
    scene.raise_for_status()
    scene_id = scene.json()["id"]

    script = [
        {"op": "bg", "image": "/uploads/bg.png"},
        {"op": "transition", "kind": "fade", "ms": 400},
        {"op": "camera", "action": "zoom", "scale": 1.3, "ms": 300},
        {"op": "fx", "effect": "rain", "ms": 1000},
        {"op": "voice", "sound": "/uploads/v.ogg"},
        {"op": "narration", "text": "雨夜。", "rich": True},
        {"op": "move", "characterId": "c1", "position": "left", "ms": 250},
        {"op": "say", "characterId": None, "text": "……", "rich": False},
    ]
    node = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={"narrative_data": {"title": "开场演出", "script": script}},
    )
    node.raise_for_status()

    resp = await client.get(f"/api/v1/play/story/{proj_id}")
    resp.raise_for_status()
    pkg = resp.json()

    beat = next(b for b in pkg["beats"] if b["id"] == node.json()["id"])
    ops = [i["op"] for i in beat["script"]]
    assert ops == [
        "bg",
        "transition",
        "camera",
        "fx",
        "voice",
        "narration",
        "move",
        "say",
    ]
    camera = next(i for i in beat["script"] if i["op"] == "camera")
    assert camera["action"] == "zoom" and camera["scale"] == 1.3
    narration = next(i for i in beat["script"] if i["op"] == "narration")
    assert narration["rich"] is True


@pytest.mark.asyncio
async def test_compile_character_sprites_to_expressions(client: AsyncClient):
    """character_data.sprites 表情差分应持久化并编译进 CharacterRef.expressions（桥5·v1.3）"""
    char = await client.post(
        "/api/v1/characters/",
        json={
            "character_data": {
                "anchor": {"name": "差分角色", "essence": "test", "tags": []},
                "contour": {},
                "demeanor": {},
                "psyche": {},
                "trace": {},
                "bond": {},
                "sprites": {
                    "smile": "/uploads/smile.png",
                    "angry": "/uploads/angry.png",
                },
            },
            "is_public": True,
        },
    )
    char.raise_for_status()
    char_id = char.json()["id"]

    # sprites 通过 API 往返未被丢弃
    assert char.json()["character_data"]["sprites"]["smile"] == "/uploads/smile.png"

    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "差分剧本", "description": "", "author_id": "pytest", "is_public": True},
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]
    await client.post(
        f"/api/v1/editor/projects/{proj_id}/roles",
        json={"character_ref_id": char_id, "importance": 2},
    )

    resp = await client.get(f"/api/v1/play/story/{proj_id}")
    resp.raise_for_status()
    pkg = resp.json()

    ref = next(c for c in pkg["characters"] if c["name"] == "差分角色")
    assert ref["expressions"] == {
        "smile": "/uploads/smile.png",
        "angry": "/uploads/angry.png",
    }


@pytest.mark.asyncio
async def test_compile_glossary_and_manual_ending(client: AsyncClient):
    """play_meta.glossary 与手动 is_ending 应编译进 StoryPackage（v1.4）"""
    proj = await client.post(
        "/api/v1/editor/projects/",
        json={
            "title": "世界观剧本",
            "description": "",
            "author_id": "pytest",
            "world_setting": "近未来都市",
            "is_public": True,
        },
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]

    await client.put(
        f"/api/v1/editor/projects/{proj_id}",
        json={
            "play_meta": {
                "glossary": [
                    {"id": "t1", "term": "源石", "definition": "神秘矿物"}
                ]
            }
        },
    )

    scene = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes",
        json={"title": "终章", "description": ""},
    )
    scene.raise_for_status()
    scene_id = scene.json()["id"]

    node = await client.post(
        f"/api/v1/editor/projects/{proj_id}/scenes/{scene_id}/nodes",
        json={
            "narrative_data": {
                "title": "真结局",
                "dialogue": "结束了。",
                "is_ending": True,
                "ending_label": "True End",
            }
        },
    )
    node.raise_for_status()
    node_id = node.json()["id"]

    resp = await client.get(f"/api/v1/play/story/{proj_id}")
    resp.raise_for_status()
    pkg = resp.json()
    assert pkg["worldSetting"] == "近未来都市"
    assert pkg["glossary"][0]["term"] == "源石"
    beat = next(b for b in pkg["beats"] if b["id"] == node_id)
    assert beat["isEnding"] is True
    assert beat["endingLabel"] == "True End"


@pytest.mark.asyncio
async def test_private_project_play_gate(client: AsyncClient):
    """私有剧本未带 author_id 应被拒（v1.5 门禁）；作者本人可访问。"""
    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "私有剧本", "description": "", "author_id": "owner-a"},
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]

    # 匿名访问 → 403
    denied = await client.get(f"/api/v1/play/story/{proj_id}")
    assert denied.status_code == 403

    # 非作者 → 403
    other = await client.get(
        f"/api/v1/play/story/{proj_id}", params={"author_id": "someone-else"}
    )
    assert other.status_code == 403

    # 作者本人 → 200
    owner = await client.get(
        f"/api/v1/play/story/{proj_id}", params={"author_id": "owner-a"}
    )
    owner.raise_for_status()


@pytest.mark.asyncio
async def test_fork_and_templates(client: AsyncClient):
    """公开剧本可 Fork（保留 fork_from、默认私有）；元剧本进模板列表（v1.5）。"""
    proj = await client.post(
        "/api/v1/editor/projects/",
        json={
            "title": "示范作",
            "description": "官方模板",
            "author_id": "official",
            "is_public": True,
            "is_meta": True,
        },
    )
    proj.raise_for_status()
    proj_id = proj.json()["id"]

    # 出现在模板列表
    templates = await client.get("/api/v1/editor/projects/templates")
    templates.raise_for_status()
    assert any(t["id"] == proj_id for t in templates.json())

    # Fork
    forked = await client.post(
        f"/api/v1/editor/projects/{proj_id}/fork",
        json={"author_id": "creator-x", "new_title": "我的改编"},
    )
    forked.raise_for_status()
    body = forked.json()
    assert body["fork_from"] == proj_id
    assert body["author_id"] == "creator-x"
    assert body["is_public"] is False
    assert body["title"] == "我的改编"
    # 结构被复制（默认场景 + 起止节点）
    assert len(body["scenes"]) >= 1

    # 私有剧本不可 Fork
    priv = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "私有", "author_id": "u1"},
    )
    priv.raise_for_status()
    denied = await client.post(
        f"/api/v1/editor/projects/{priv.json()['id']}/fork",
        json={"author_id": "u2"},
    )
    assert denied.status_code == 400


@pytest.mark.asyncio
async def test_compiled_story_carries_item_refs(client: AsyncClient):
    """道具引用进运行时清单。

    TS 侧的投影层在 S13-2c 之前恒写 `items: []`，于是编排台挂上的道具在桌面试玩里
    一个都不出现，而同一份数据经后端编译却有——两端分叉。这条用例把 Python 的
    规则写死，TS 的三条断言（`packages/core/src/compiler.test.ts`）照着同一规则摆：
    逐字段映射、按引用顺序、不去重、本体已删即缺席。
    """
    item = await client.post(
        "/api/v1/editor/assets/items",
        json={
            "name": "铜钥匙", "description": "开地窖", "category": "关键道具",
            "image_path": "/uploads/key.png", "author_id": "pytest",
        },
    )
    assert item.status_code == 201
    item_id = item.json()["id"]

    proj = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "道具编译", "author_id": "pytest", "is_public": True},
    )
    assert proj.status_code == 201
    pid = proj.json()["id"]

    for _ in range(2):
        added = await client.post(
            f"/api/v1/editor/projects/{pid}/assets",
            json={"asset_type": "item", "asset_id": item_id},
        )
        assert added.status_code == 201
    ghost = await client.post(
        f"/api/v1/editor/projects/{pid}/assets",
        json={"asset_type": "item", "asset_id": str(uuid4())},
    )
    assert ghost.status_code == 201

    pkg = (await client.get(f"/api/v1/play/story/{pid}")).json()
    assert [i["name"] for i in pkg["items"]] == ["铜钥匙", "铜钥匙"], "不去重，且不给悬空引用占位"
    assert pkg["items"][0] == {
        "id": item_id, "name": "铜钥匙", "category": "关键道具",
        "imagePath": "/uploads/key.png",  # IR 出 JSON 走 camelCase 别名，与 TS 侧同一形状
    }
