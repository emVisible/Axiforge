"""审核案件落库与中台 API 的集成测试（ADR-028）。

覆盖的是"跨层是否真的通了"：评论创建 → 案件落库 → 中台队列读到 → 人工处置 → 回退。
引擎层的判断正确性在 `test_moderation_engine.py`，这里不重复；这里只回答
"用户/运营摸不摸得到这条链"。
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

ADMIN = {"Authorization": "Bearer dev-admin"}


async def post_comment(client: AsyncClient, body: str) -> str:
    res = await client.post(
        "/api/v1/comments",
        json={
            "content_type": "project",
            "content_id": f"proj-moderation-{uuid.uuid4().hex[:8]}",
            "author_id": "creator-mod-01",
            "body": body,
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


async def queue_for(client: AsyncClient, subject_id: str) -> list:
    res = await client.get("/api/v1/admin/moderation/queue", params={"limit": 200}, headers=ADMIN)
    assert res.status_code == 200, res.text
    return [c for c in res.json() if c["subject_id"] == subject_id]


@pytest.mark.asyncio
async def test_moderation_api_requires_admin(client: AsyncClient):
    res = await client.get("/api/v1/admin/moderation/queue")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_lexicon_hit_on_comment_becomes_a_pending_case(client: AsyncClient):
    """评论 → 词表命中 → 案件落库 → 中台读得到。整条链任何一环没接上，这里就红。"""
    comment_id = await post_comment(client, "加微信领 全新体验返利群")
    cases = await queue_for(client, comment_id)
    assert len(cases) == 1, "命中条款的评论必须留下一条待人工案件"
    case = cases[0]
    assert case["subject_type"] == "comment"
    assert case["state"] == "pending"
    assert case["final_action"] == "human_review"
    assert "spam_promotion" in case["clause_ids"]
    # 判断依据外露：运营在一屏里要能回答"为什么这条进来了"
    assert case["reasons"]
    assert case["questions_version"].startswith("questions-")
    assert case["policy_version"].startswith("policy-")
    # 词表不权威 → 它不可能把内容自动放走或自动驳回
    assert case["authoritative"] is False


@pytest.mark.asyncio
async def test_clean_comment_does_not_open_a_case(client: AsyncClient):
    """默认配置下链里只有词表。"没命中"不是"需要人看"，建案会把人工队列灌满。"""
    comment_id = await post_comment(client, "第三章的转折写得很克制，喜欢。")
    assert await queue_for(client, comment_id) == []


@pytest.mark.asyncio
async def test_resolve_then_reopen_roundtrip(client: AsyncClient):
    comment_id = await post_comment(client, "点击链接注册送 大额返利")
    case = (await queue_for(client, comment_id))[0]

    dismissed = await client.post(
        f"/api/v1/admin/moderation/cases/{case['id']}/resolve",
        json={"outcome": "dismissed", "note": "误报：是站内活动文案"},
        headers=ADMIN,
    )
    assert dismissed.status_code == 200, dismissed.text
    assert dismissed.json()["state"] == "dismissed"
    # 处置人来自鉴权层，不接受请求体自报；也不能是 token 原文
    assert dismissed.json()["resolved_by"] == "admin-role"
    assert "dev-admin" not in dismissed.text

    reopened = await client.post(
        f"/api/v1/admin/moderation/cases/{case['id']}/reopen",
        params={"note": "复核后确认仍需处理"},
        headers=ADMIN,
    )
    assert reopened.status_code == 200
    assert reopened.json()["state"] == "pending", "终态必须能回退——误判要有回去的路"


@pytest.mark.asyncio
async def test_resolve_rejects_unknown_outcome(client: AsyncClient):
    comment_id = await post_comment(client, "伪造身份证代办")
    case = (await queue_for(client, comment_id))[0]
    res = await client.post(
        f"/api/v1/admin/moderation/cases/{case['id']}/resolve",
        json={"outcome": "approve"},
        headers=ADMIN,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_stats_reports_engine_authoritativeness(client: AsyncClient):
    res = await client.get("/api/v1/admin/moderation/stats", headers=ADMIN)
    assert res.status_code == 200
    body = res.json()
    engines = {e["name"]: e for e in body["engines"]}
    assert "lexicon" in engines
    assert engines["lexicon"]["authoritative"] is False
    assert "by_state" in body


@pytest.mark.asyncio
async def test_repeating_same_comment_body_does_not_duplicate_the_case(client: AsyncClient):
    """幂等靠内容指纹，不靠调用方自觉（参照实现声明了 idempotency 却每次发新 UUID）。"""
    body = "安眠药致死量 教程"
    first = await post_comment(client, body)
    second = await post_comment(client, body)
    # 两条评论各自成案（不同 subject_id），但同一 subject 重复审同一指纹不新增案件
    cases_a = await queue_for(client, first)
    assert len(cases_a) == 1
    again = await queue_for(client, second)
    assert len(again) == 1


@pytest.mark.asyncio
async def test_publishing_with_moderation_off_still_succeeds(client: AsyncClient):
    """审核是旁路，不是新闸门：ADR-018:23 的"发布只跑规则校验"必须继续成立。"""
    created = await client.post(
        "/api/v1/characters/",
        json={
            "name": "审核旁路角色",
            "author_id": "creator-mod-01",
            "is_public": True,
            "character_data": {
                "anchor": {"name": "审核旁路角色", "essence": "测试公开不被审核挡住", "tags": []}
            },
        },
    )
    assert created.status_code in (200, 201), created.text
    assert created.json()["is_public"] is True


@pytest.mark.asyncio
async def test_report_arrives_with_the_machine_finding_attached(client: AsyncClient):
    """举报的价值不在于排队，而在于运营点开时已经有一版判断。

    这条测的是整条融合链：建一个描述含导流话术的作品 → 举报它 →
    中台的 moderation context 里就该带着机器结论与命中条款。
    """
    created = await client.post(
        "/api/v1/editor/projects/",
        json={
            "title": "被举报的作品",
            "description": "加微信领 全新体验，点击链接注册送 888",
            "author_id": "creator-mod-02",
        },
    )
    assert created.status_code in (200, 201), created.text
    project_id = created.json()["id"]

    reported = await client.post(
        "/api/v1/report/",
        json={
            "target_type": "project",
            "target_id": project_id,
            "reason": "疑似导流",
            "reporter_token": "reporter-1",
        },
    )
    assert reported.status_code in (200, 201), reported.text

    ctx = await client.get(
        "/api/v1/admin/moderation/context",
        params={"target_type": "project", "target_id": project_id},
        headers=ADMIN,
    )
    assert ctx.status_code == 200, ctx.text
    judgement = ctx.json()["auto_judgement"]
    assert judgement is not None, "举报之后 context 里必须带着机器结论"
    assert "spam_promotion" in judgement["clause_ids"]
    assert judgement["final_action"] == "human_review"
    # 词表不权威：它可以把东西递到人面前，但不能自己把作品判死
    assert judgement["authoritative"] is False
