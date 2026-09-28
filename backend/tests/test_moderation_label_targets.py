"""标注配额那条路（D26）：`/label-targets` 与 `order=axis` 排序。

为什么值得单独测：D25 量到"10 题里 8 题打不过常数预测器"之后，能改变它的只有标注量，
而标注量卡在"上千条待处置里该看哪几条"。这两个接口是那条路上唯一的新代码——
它们**只指路**（排序 + 计数），不产出任何真值，所以判据是"顺序对不对、
没给过答案的行有没有被悄悄当成 0"，不是"结论对不对"。
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.moderation.models import (
    ModerationCase,
    STATE_PENDING,
)
from app.domains.moderation.service import ModerationService

ADMIN = {"Authorization": "Bearer dev-admin"}
AXIS = "spam_promotion"


def _typed(p: float, *, with_raw: bool) -> dict:
    ans = {"type": "noul", "noul": round(p, 4), "confidence": round(p, 4)}
    if with_raw:
        ans["raw"] = {"type": "noul", "noul": round(p / 2, 4)}
    return {AXIS: ans}


async def _seed(db_session: AsyncSession, tag: str) -> dict:
    """三条可排序的 + 一条没有任何类型化答案的（词表案件长这样）。"""
    now = datetime.now(timezone.utc)
    spec = {"high": (0.90, True), "mid": (0.50, False), "low": (0.10, True)}
    subjects = {}
    for kind, (p, raw) in spec.items():
        sid = f"label-{kind}-{tag}"
        subjects[kind] = sid
        db_session.add(ModerationCase(
            id=uuid.uuid4(), subject_type="comment", subject_id=sid, author_id="a",
            fingerprint=f"fp-label-{tag}-{kind}", state=STATE_PENDING, engine="laya:sidecar",
            answers=_typed(p, with_raw=raw), reasons=[], clause_ids=[], created_at=now,
            policy_version="policy-1", questions_version="questions-3", lexicon_version="lex-1",
            authoritative=True, calibrated=True, confidence=p,
        ))
    subjects["bare"] = f"label-bare-{tag}"
    db_session.add(ModerationCase(
        id=uuid.uuid4(), subject_type="comment", subject_id=subjects["bare"], author_id="a",
        fingerprint=f"fp-label-{tag}-bare", state=STATE_PENDING, engine="lexicon",
        answers={}, reasons=[], clause_ids=["spam_promotion"], created_at=now,
        policy_version="policy-1", questions_version="questions-3", lexicon_version="lex-1",
        authoritative=False,
    ))
    await db_session.commit()
    return subjects


def _axis_entry(report: dict) -> dict:
    return next(a for a in report["axes"] if a["question"] == AXIS)


async def test_label_targets_ranks_candidates_and_never_treats_no_answer_as_zero(
        db_session: AsyncSession):
    tag = uuid.uuid4().hex[:8]
    subjects = await _seed(db_session, tag)
    # per_axis 开大：测试连的是真库，候选里排在我三条前面的可能有几百条真案件，
    # 截断窗口会让"我这行到底有没有被报出来"变成一件碰运气的事。
    report = await ModerationService(db_session).label_targets(per_axis=2000)
    entry = _axis_entry(report)

    # 词表案件对这条轴没给过概率，不能出现在候选里——那等于把"没测"当成"值得标"。
    listed = [r["subject_id"] for r in entry["top"]]
    assert subjects["bare"] not in listed
    # 只比自己那三条的相对顺序：测试连的是真库，别的案件在这条轴上可能给得更高，
    # 把"我这三条不在前三个"错当成缺陷，就是把局部当成了全局判据。
    mine = [s for s in listed if s in {subjects["high"], subjects["mid"], subjects["low"]}]
    assert mine == [subjects["high"], subjects["mid"], subjects["low"]]
    assert entry["pending_candidates"] >= 3
    assert report["pending_total"] >= 3

    # `has_raw` 决定这一行处置完之后拟合拿不拿得到样本，必须逐行报，不能用表级布尔代替。
    raws = {r["subject_id"]: r["has_raw"] for r in entry["top"]}
    assert raws[subjects["high"]] is True and raws[subjects["mid"]] is False

    # 测试栈里没有真温度表可问 → 判断力这一维是"看不见"，不是"没问题"。
    assert entry["informative"] is None
    assert report["engine"] == ""


async def test_queue_sorts_by_the_named_axis(client: AsyncClient, db_session: AsyncSession):
    """排序走真 HTTP：这条路是给运营点的，不是给 service 单测的。

    只筛自己那三条再比顺序——第一页不是全表，别的案件也可能有这条轴的答案。
    """
    tag = uuid.uuid4().hex[:8]
    subjects = await _seed(db_session, tag)
    res = await client.get("/api/v1/admin/moderation/queue",
                           params={"order": "axis", "axis": AXIS, "limit": 200, "offset": 0},
                           headers=ADMIN)
    assert res.status_code == 200, res.text
    total = res.json()["total"]
    seen = []
    offset = 0
    while True:
        page = res.json()
        seen += [c["subject_id"] for c in page["items"]]
        offset += 200
        # 三条都找到了就停：那条没答案的（bare）按 nulls last 一定在队尾，
        # 等它翻完等于把整张表翻一遍。
        if offset >= page["total"] or all(s in seen for s in (
                subjects["high"], subjects["mid"], subjects["low"])):
            break
        res = await client.get("/api/v1/admin/moderation/queue",
                               params={"order": "axis", "axis": AXIS, "limit": 200,
                                       "offset": offset}, headers=ADMIN)
        assert res.status_code == 200, res.text
    assert total >= 3
    order = [s for s in seen if s in {subjects["high"], subjects["mid"], subjects["low"]}]
    assert order == [subjects["high"], subjects["mid"], subjects["low"]], "按这条轴的可能性降序"


async def test_axis_sort_rejects_unknown_and_non_comparable_questions(client: AsyncClient):
    """未注册的题名与不是 noul 的题都必须被挡住。

    `severity` 的值在 `score` 键下、`age_rating` 在 `choice` 下——按它们排序要替运营选
    "看哪一档的概率"，那是另一个判断，不该藏在一个查询参数里悄悄发生。
    """
    for bad in ("nope", ""):
        res = await client.get("/api/v1/admin/moderation/queue",
                               params={"order": "axis", "axis": bad}, headers=ADMIN)
        assert res.status_code == 422, f"未注册题名 {bad!r} 必须 422，实际 {res.status_code}"
    for other in ("severity", "age_rating"):
        res = await client.get("/api/v1/admin/moderation/queue",
                               params={"order": "axis", "axis": other}, headers=ADMIN)
        assert res.status_code == 422, f"{other} 不是 noul 轴，不该被当成可排序"
