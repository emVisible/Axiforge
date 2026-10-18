"""Project editor API integration tests."""

import uuid

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


@pytest.mark.asyncio
async def test_sync_narrative_from_axs(client: AsyncClient):
    created = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "AXS同步测试", "author_id": "pytest"},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    axs_source = """# 开场
旁白：雨夜。

# 结局 [ending: 完]
旁白：故事结束。
"""
    synced = await client.put(
        f"/api/v1/editor/projects/{project_id}/narrative",
        json={
            "axs_source": axs_source,
            "nodes": [
                {
                    "editor_data": {"position": {"x": 100, "y": 80}},
                    "narrative_data": {
                        "title": "开场",
                        "script": [{"op": "narration", "text": "雨夜。"}],
                    },
                    "sort_order": 0,
                },
                {
                    "editor_data": {"position": {"x": 320, "y": 80}},
                    "narrative_data": {
                        "title": "结局",
                        "is_ending": True,
                        "ending_label": "完",
                        "script": [{"op": "narration", "text": "故事结束。"}],
                    },
                    "sort_order": 1,
                },
            ],
            "edges": [],
        },
    )
    assert synced.status_code == 200
    body = synced.json()
    assert body.get("axs_source", "").startswith("# 开场")
    assert len(body.get("nodes") or []) == 2


def test_narrative_prose_text_covers_both_stored_shapes():
    """库里两种节点形状并存，只认一种就会对另一半内容拿到空正文。

    实测 400 个节点：扁平 narration/dialogue 占多数，而新编辑器写的是
    `script: [{op, text}]`——审核接的是"读者会看到的文字"，漏掉 script
    不会报错，只会让新存档看起来永远干净。
    """
    from types import SimpleNamespace

    from app.domains.narrative.text import narrative_prose_text

    nodes = [
        SimpleNamespace(sort_order=1, narrative_data={
            "dialogue": "我把糖色炒过头了。", "narration": "她没回头。"}),
        SimpleNamespace(sort_order=0, narrative_data={
            "narration": "厨房很安静。", "trigger_condition": "x > 1"}),
        SimpleNamespace(sort_order=2, narrative_data={
            "script": [{"op": "bg", "image": "/uploads/a.png"},
                       {"op": "say", "text": "加微信领全新体验"},
                       {"op": "narration", "text": "她把手机扣在桌上。"},
                       {"op": "fx", "effect": "rain"}]}),
    ]
    text = narrative_prose_text(nodes)
    assert text.splitlines() == ["厨房很安静。", "她没回头。", "我把糖色炒过头了。",
                                 "加微信领全新体验", "她把手机扣在桌上。"], "按 sort_order 排序，只取旁白与台词"
    assert "/uploads/a.png" not in text and "rain" not in text and "trigger" not in text


@pytest.mark.asyncio
async def test_saving_a_project_narrative_reaches_the_review_queue(client: AsyncClient):
    """作品是平台的核心对象：判断层不接到保存路径上，就只是"审评论和角色"。"""
    admin = {"Authorization": "Bearer dev-admin"}
    created = await client.post(
        "/api/v1/editor/projects/",
        json={"title": "导流测试剧本", "author_id": "pytest-mod"},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    synced = await client.put(
        f"/api/v1/editor/projects/{project_id}/narrative",
        json={
            "axs_source": "# 开场\n旁白：加微信领全新体验。",
            "nodes": [{"narrative_data": {
                "script": [{"op": "narration", "text": "加微信领 全新体验，返利群拉你"}]},
                "sort_order": 0}],
            "edges": [],
        },
    )
    assert synced.status_code == 200

    from app.domains.moderation.background import drain_pending

    await drain_pending()  # 判定在后台：保存返回 ≠ 案件已落地
    # order=new 是必须的：队列默认按风险排序，本套件每跑一次就往 axiforge_test 里
    # 添一批案件，刚建的这条会排到某一页之外——那时「这一页没有它」会被读成「判定没落库」。
    # （读分页却当成全表，正是 D12 修掉的那类缺陷，这次打在我自己的测试上。）
    queue = await client.get("/api/v1/admin/moderation/queue",
                             params={"limit": 200, "order": "new"}, headers=admin)
    assert queue.status_code == 200
    cases = [c for c in queue.json()["items"] if c["subject_id"] == project_id]
    assert len(cases) == 1, "一次保存该留一条案件（ADR-028 的旁路留痕）"
    assert cases[0]["subject_type"] == "project"
    assert "spam_promotion" in cases[0]["clause_ids"]


@pytest.mark.asyncio
async def test_asset_ref_endpoints_hold_the_local_contract(client: AsyncClient):
    """S13-2c：桌面 SQLite 支的 add/remove 逐字照着这两个端点写，服务端就得守住同一口径——
    不去重（加两次留两条）、删除按 (工程, 引用) 认、工程不存在报 404 而不是让 FK 冒 500。"""

    async def new_project(title: str) -> str:
        created = await client.post(
            "/api/v1/editor/projects/",
            json={"title": title, "author_id": "pytest", "is_public": False},
        )
        assert created.status_code == 201
        return created.json()["id"]

    mine = await new_project("道具引用两端对照")
    other = await new_project("另一份工程")
    item_id = str(uuid.uuid4())  # 引用不校验道具本体是否存在，两端都不校验

    first = await client.post(
        f"/api/v1/editor/projects/{mine}/assets",
        json={"asset_type": "item", "asset_id": item_id},
    )
    second = await client.post(
        f"/api/v1/editor/projects/{mine}/assets",
        json={"asset_type": "item", "asset_id": item_id},
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] != second.json()["id"], "同一件道具加两次该留两条"

    detail = await client.get(f"/api/v1/editor/projects/{mine}")
    refs = {r["id"] for r in detail.json()["asset_refs"] if r["asset_id"] == item_id}
    assert refs == {first.json()["id"], second.json()["id"]}

    # 借自己工程的路径删别人的引用：删不动才算归属成立
    cross = await client.delete(
        f"/api/v1/editor/projects/{other}/assets/{first.json()['id']}"
    )
    assert cross.status_code == 404
    after_cross = await client.get(f"/api/v1/editor/projects/{mine}")
    assert len(after_cross.json()["asset_refs"]) == 2, "跨工程删失败，两条都该还在"

    gone = await client.delete(f"/api/v1/editor/projects/{mine}/assets/{first.json()['id']}")
    assert gone.status_code == 204
    again = await client.delete(f"/api/v1/editor/projects/{mine}/assets/{first.json()['id']}")
    assert again.status_code == 404, "重复删除该可见地失败，不是幂等成功"

    orphan = await client.post(
        f"/api/v1/editor/projects/{uuid.uuid4()}/assets",
        json={"asset_type": "item", "asset_id": item_id},
    )
    assert orphan.status_code == 404, "工程不存在该 404，而不是顶出 FK 500"
