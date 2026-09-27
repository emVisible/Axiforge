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
    """翻完整个队列再筛——只看第一页会把"看不见"误报成"没建案"。

    先 `drain_pending()`：保存路径的判定现在是后台派发的，请求返回时案件**允许还没落地**。
    这不是测试的取巧，异步化之后"最终会有"就是这条链对外的一致性级别。
    """
    from app.domains.moderation.background import drain_pending

    await drain_pending()
    out = []
    offset = 0
    while True:
        res = await client.get(
            "/api/v1/admin/moderation/queue",
            params={"limit": 200, "offset": offset}, headers=ADMIN)
        assert res.status_code == 200, res.text
        page = res.json()
        out += [c for c in page["items"] if c["subject_id"] == subject_id]
        offset += 200
        if offset >= page["total"]:
            return out


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
    # 依据文本本身也得是可读的——把 `spam_promotion` 直接拼进理由，
    # 就等于让后端在最该说人话的地方继续说内部 id。
    joined = " ".join(case["reasons"])
    assert "导流垃圾" in joined
    assert "spam_promotion" not in joined
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
    # 必须**另起一次请求**再读：响应体来自同一会话里的 ORM 对象，
    # 服务层只 flush 不 commit 时它照样显示 dismissed，而库里根本没写进去。
    # （这里曾经真漏过一次提交，只有跨请求重读能抓到。）
    reread = await client.get(f"/api/v1/admin/moderation/cases/{case['id']}", headers=ADMIN)
    assert reread.status_code == 200
    assert reread.json()["state"] == "dismissed", "处置没落库=运营白点一次，温度表也永远攒不到标注"
    assert reread.json()["resolved_by"] == "admin-role"

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


@pytest.mark.asyncio
async def test_label_export_only_emits_rows_that_can_be_fitted(db_session):
    """校准需要标注，标注来自处置过的**带答案**案件。

    空导出会一路绿灯地骗过所有人：脚本跑通了、0 条也打印得出来。
    所以这里直接造一条有类型化答案的已结案案件，证明映射真的发生。
    用完即删——测试库不自动回滚，留着下次撞唯一约束。
    """
    from datetime import datetime, timezone

    from sqlalchemy import delete

    from app.domains.moderation.models import ModerationCase
    from eval.export_labels import collect

    sid_fitted = f"c-label-{uuid.uuid4().hex[:8]}"
    sid_empty = f"c-label-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    try:
        db_session.add_all(
            [
                ModerationCase(
                    subject_type="comment", subject_id=sid_fitted, author_id="a1",
                    fingerprint=f"fp-{uuid.uuid4().hex[:8]}", state="resolved",
                    engine="laya:sidecar",
                    answers={"spam_promotion": {"type": "noul", "value": 0.91, "confidence": 0.91}},
                    calibrated=False, decided_at=now, resolved_at=now, resolved_by="admin-role",
                    policy_version="policy-1", questions_version="questions-2",
                ),
                # 词表案件没有答案：它进不了拟合，必须被过滤掉而不是产出一行垃圾标签
                ModerationCase(
                    subject_type="comment", subject_id=sid_empty, author_id="a1",
                    fingerprint=f"fp-{uuid.uuid4().hex[:8]}", state="dismissed",
                    engine="lexicon", answers={}, resolved_at=now,
                ),
            ]
        )
        await db_session.commit()

        rows = await collect()
        mine = [r for r in rows if r["subject_id"] == sid_fitted]
        assert len(mine) == 1
        assert mine[0]["expected"] == "reject", "人工确认处置应对应期望动作 reject"
        assert mine[0]["answers"]["spam_promotion"]["value"] == 0.91
        assert not any(r["subject_id"] == sid_empty for r in rows), "无答案的行不得进入拟合"
    finally:
        await db_session.execute(
            delete(ModerationCase).where(
                ModerationCase.subject_id.in_([sid_fitted, sid_empty])
            )
        )
        await db_session.commit()


@pytest.mark.asyncio
async def test_rejudge_rereads_the_full_content_not_the_panel_excerpt(client: AsyncClient,
                                                                     db_session):
    """「现在重判一次」要拿全文，且这条动作真的落库。

    审阅面板那份是 280 字摘录；若重判复用它，长内容会被"看起来判过了"地截断判定。
    这里用一段 400 字的正文，断言取回的 body 没有被截。
    """
    from app.domains.moderation.content import load_subject_content

    body = "加微信领 全新体验，返利群拉你。" + ("这段废话用来把正文撑长。" * 20)
    comment_id = await post_comment(client, body)
    cases = await queue_for(client, comment_id)
    assert len(cases) == 1

    again = await client.post(
        f"/api/v1/admin/moderation/cases/{cases[0]['id']}/rejudge", headers=ADMIN)
    assert again.status_code == 200, again.text
    assert again.json()["state"] == "pending"
    assert "spam_promotion" in again.json()["clause_ids"]

    title, loaded, author = await load_subject_content(
        db_session, subject_type="comment", subject_id=comment_id)
    assert loaded == body, "重判取的是全文，不是摘录"
    assert author == "creator-mod-01"


@pytest.mark.asyncio
async def test_queue_pages_are_disjoint_and_cover_the_whole_state(client: AsyncClient):
    """队列必须能翻完。此前 `limit` 就是硬上限：第 200 条以后的案件在界面上不存在。

    断言写成一页页读到的序列**等于**一次读全量切出来的前缀，而不是"看起来有 total"：
    末级排序键不稳时（同一事务插入的多行 `created_at` 相同）翻页会重复或漏项，
    而那只有把两页拼起来跟全量对一遍才照得出来。
    """
    ids = [await post_comment(client, f"加微信领 全新体验 {i}") for i in range(6)]

    async def page(offset: int, limit: int = 3) -> dict:
        res = await client.get(
            "/api/v1/admin/moderation/queue",
            params={"limit": limit, "offset": offset, "state": "pending"}, headers=ADMIN)
        assert res.status_code == 200, res.text
        return res.json()

    first, second = await page(0), await page(3)
    whole = await page(0, limit=200)

    assert first["total"] == second["total"] == whole["total"], "同一状态下 total 不该随页变化"
    assert whole["total"] >= 6, f"前提：队列里至少 6 条（实测 {whole['total']}）"
    p1 = [c["id"] for c in first["items"]]
    p2 = [c["id"] for c in second["items"]]
    assert len(p1) == 3 and len(p2) == 3
    assert not set(p1) & set(p2), "两页不许重复同一案件"
    assert p1 + p2 == [c["id"] for c in whole["items"]][:6], "翻页拼起来必须等于按序读全量"
    assert all(c["state"] == "pending" for c in first["items"])


@pytest.mark.asyncio
async def test_vocabulary_covers_every_clause_and_rule_it_ships(client: AsyncClient):
    """中台读的那份词汇表必须与后端定义**逐项相等**。

    漂移的形态是静默的：加一条轴、忘了发短名，界面就打印 `spam_promotion` 这种
    内部 id，而没有任何一端会报错。这条测试就是那"另一端"。
    """
    from app.domains.moderation.policy import RULES
    from app.domains.moderation.questions import REGISTERED_CLAUSES

    assert (await client.get("/api/v1/admin/moderation/vocabulary")).status_code == 401

    res = await client.get("/api/v1/admin/moderation/vocabulary", headers=ADMIN)
    assert res.status_code == 200, res.text
    body = res.json()
    assert set(body["clauses"]) == set(REGISTERED_CLAUSES), "条款短名与条款注册表漂移"
    assert all(body["clauses"].values())
    assert set(body["rules"]) == {r.key for r in RULES}, "规则表与短名表漂移"
    assert all(body["rules"].values())
    assert set(body["actions"]) == {"approve", "reject", "human_review"}
    from app.domains.moderation.questions import build_questions

    assert set(body["questions"]) == set(build_questions()), "问题短名与题集漂移"
    assert set(body["human_only_clauses"]) <= set(REGISTERED_CLAUSES), \
        "策略引用了一个没定义过的条款"
    # `none` 是单选题的一档，不是条款：它只能出现在建议表里
    assert body["suggestions"]["none"] == "无问题"
    assert "none" not in body["clauses"]
    assert body["questions_version"].startswith("questions-")


@pytest.mark.asyncio
async def test_rejudge_unknown_case_is_404(client: AsyncClient):
    res = await client.post(
        "/api/v1/admin/moderation/cases/00000000-0000-0000-0000-000000000000/rejudge",
        headers=ADMIN)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_report_and_rejudge_judge_the_same_text_as_the_save_path(client: AsyncClient,
                                                                       db_session):
    """保存、举报、重判三个入口必须判同一份文本。

    评论正文允许 4000 字，举报入口从前取的是面板那份 500 字摘录，而案件身份是
    内容指纹——摘录和全文两个指纹，于是同一条评论挂着两个案件，每份结论看起来
    都"判过了"。这里用一个必然超过摘录长度的正文，走完整圈后断言只剩一个案件，
    且它的指纹就是全文的指纹。
    """
    from sqlalchemy import select

    from app.domains.moderation.models import ModerationCase
    from app.domains.moderation.service import content_sha

    body = "加微信领 全新体验，返利群拉你。" + ("这段废话用来把正文撑长。" * 60)
    assert len(body) > 500
    comment_id = await post_comment(client, body)

    reported = await client.post(
        "/api/v1/report/",
        json={
            "target_type": "comment",
            "target_id": comment_id,
            "reason": "疑似导流",
            "reporter_token": "reporter-1",
        },
    )
    assert reported.status_code in (200, 201), reported.text
    cases = await queue_for(client, comment_id)
    assert len(cases) == 1, "举报没有按摘录另开一个案件"

    again = await client.post(
        f"/api/v1/admin/moderation/cases/{cases[0]['id']}/rejudge", headers=ADMIN)
    assert again.status_code == 200, again.text

    rows = (
        await db_session.execute(
            select(ModerationCase).where(ModerationCase.subject_id == comment_id))
    ).scalars().all()
    assert len(rows) == 1, f"三个入口判的应是同一份文本，实际 {len(rows)} 个案件"
    assert rows[0].fingerprint == content_sha("", body)
