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
    STATE_RESOLVED,
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


async def test_axis_label_counts_agree_with_the_fitters_own_ruling(db_session: AsyncSession):
    """面板报的「可拟样本」必须与导出／拟合那套判据同源，两端各算一遍迟早分家。

    两条刻意的差别，都在这条测试里钉住：
    - 逐轴勾过的行用 `human_clauses`（空列表＝"一条都不成立"），没勾的 resolved 才沿用机器条款；
    - **缺 `raw` 的行不算样本**：`calibrate --from-answers` 整行丢掉它，
      而 `fit_readiness`（读缩放后那份）会把它算进去。面板报的是生产那条路径能用到几条，
      所以取严的那个——处置十条旧形状的行，可拟样本照样是 0。
    """
    from app.domains.moderation.labels import axis_label_counts, case_payload
    from eval.calibrate import binary_pairs
    from eval.export_labels import fit_readiness

    now = datetime.now(timezone.utc)
    tag = uuid.uuid4().hex[:8]

    def mk(sid: str, p: float, clauses: list, *, raw: bool) -> ModerationCase:
        ans = {AXIS: {"type": "noul", "noul": float(p), "confidence": float(p)}}
        if raw:
            ans[AXIS]["raw"] = {"type": "noul", "noul": float(p) / 2}
        return ModerationCase(
            id=uuid.uuid4(), subject_type="comment", subject_id=sid, author_id="a",
            fingerprint=f"fp-count-{tag}-{sid}", state=STATE_RESOLVED, engine="laya:sidecar",
            answers=ans, reasons=[], clause_ids=clauses, created_at=now,
            policy_version="policy-1", questions_version="questions-3", lexicon_version="lex-1",
            authoritative=True, calibrated=True, confidence=p,
        )

    cases = [
        mk(f"pos-{tag}", 0.9, ["spam_promotion"], raw=True),      # 正样本
        mk(f"neg-{tag}", 0.1, [], raw=True),                      # 负样本（误报那类）
        mk(f"noraw-{tag}", 0.7, ["spam_promotion"], raw=False),   # 拟合拿不到
    ]
    for c in cases:
        db_session.add(c)
    await db_session.commit()

    counts = axis_label_counts(cases)[AXIS]
    assert counts == {"samples": 2, "positives": 1, "explicit": 0}
    # pending 不是"负样本"，是"没人看过"：把它算进去会凭空造出一批 0 标签。
    extra = mk(f"pend-{tag}", 0.8, ["spam_promotion"], raw=True)
    extra.state = STATE_PENDING
    assert axis_label_counts(cases + [extra])[AXIS] == counts

    # 与拟合侧那一个函数逐项相等（同样的行、同样带 raw 的那些）
    rows = [case_payload(c) for c in cases]
    usable = [r for r in rows if isinstance((r["answers"].get(AXIS) or {}).get("raw"), dict)]
    # answers 那一层是 {题名: 答案}，喂给 binary_pairs 的必须是"缩放后那份的替身"=raw
    pairs = binary_pairs([(r, {AXIS: r["answers"][AXIS]["raw"]}) for r in usable], AXIS)
    assert len(pairs) == counts["samples"]
    assert sum(lab for _, lab in pairs) == counts["positives"]

    # 反面对照：宽松的那个判据会把没有 raw 的行也算进来——面板不许跟着它一起乐观
    loose = fit_readiness(rows)[AXIS]
    assert loose["samples"] == 3 and loose["positives"] == 2

    # 全是旧形状时，面板该报 0 而不是"处置过 3 条"
    only_loose = axis_label_counts(cases[2:])[AXIS]
    assert only_loose["samples"] == 0 and only_loose["positives"] == 0


async def test_label_targets_reports_distinct_and_counts(db_session: AsyncSession):
    """去重后的候选数与案件数必须分开报：同一篇稿子看十遍，独立证据还是 1 篇。"""
    tag = uuid.uuid4().hex[:8]
    subjects = await _seed(db_session, tag)
    # 同一份答案再挂三条案件（不同主体坐标）——dev 库里正是这种形状
    for n in range(3):
        clone = ModerationCase(
            id=uuid.uuid4(), subject_type="comment", subject_id=f"label-dup{n}-{tag}",
            author_id="a", fingerprint=f"fp-label-{tag}-dup{n}", state=STATE_PENDING,
            engine="laya:sidecar", answers=_typed(0.90, with_raw=True), reasons=[],
            clause_ids=[], created_at=datetime.now(timezone.utc),
            policy_version="policy-1", questions_version="questions-3", lexicon_version="lex-1",
            authoritative=True, calibrated=True, confidence=0.9,
        )
        db_session.add(clone)
    await db_session.commit()

    report = await ModerationService(db_session).label_targets(per_axis=2000)
    entry = _axis_entry(report)
    listed = [r["subject_id"] for r in entry["top"]]
    # high 与三条 dup 的**答案快照完全相同**（同一台模型对同一份文本视图），
    # 去重后四条只留一条——留哪一条不重要，重要的是它们不再占四个队头位。
    same = [x for x in listed if x.startswith(("label-high", "label-dup"))]
    assert len(same) == 1, f"同一份答案快照只该占一个队头位，实际 {same}"
    assert subjects["mid"] in listed and subjects["low"] in listed
    assert entry["distinct_candidates"] < entry["pending_candidates"]


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
