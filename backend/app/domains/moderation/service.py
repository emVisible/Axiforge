"""审核案件服务：裁决落库、队列、人工处置与回退。

与调用方的关系是刻意的弱耦合：**审核失败绝不能让发布失败**。
ADR-018:23 说发布只跑规则校验、不做前置人工审核，所以本模块是旁路留痕——
它不抛异常给调用方，也不在发布的事务边界里做阻塞判断。

一处诚实的说明：`review()` 返回 `None` 表示"审核未启用"，
**不等于"内容通过"**。调用方不能拿 None 当放行依据（参照实现里
"引擎没说话"和"引擎说没问题"是同一个返回值，那是缺陷 1 的根）。
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from dataclasses import replace
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.moderation.contracts import (
    ACTION_HUMAN,
    CalibrationReporter,
    ModerationSubject,
    Verdict,
)
from app.domains.moderation.engine import ModerationEngine, Outcome
from app.domains.moderation.models import (
    ModerationCase,
    ModerationDecisionLog,
    STATE_AUTO_CLOSED,
    STATE_DISMISSED,
    STATE_PENDING,
    STATE_RESOLVED,
)
from app.domains.moderation.providers.lexicon import LEXICON_VERSION
from app.domains.moderation.questions import QUESTIONS_VERSION
from app.domains.moderation.registry import get_engine

logger = logging.getLogger(__name__)

#: 三种题型各自把标量值放在哪个键下——与 sidecar 的返回形状同源。
_VALUE_KEY = {"noul": "noul", "score": "score", "choice": "choice"}


def content_sha(title: str, body: str) -> str:
    return hashlib.sha256(f"{title or ''}\n{body or ''}".encode("utf-8")).hexdigest()


def _conf(v: object) -> Optional[float]:
    """落库前的最后一道裁剪。引擎层已经作废过越界值，这里再挡一次：
    参照实现把 conf=9.00 原样写进了存储。"""
    try:
        f = float(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if f != f:
        return None
    return max(0.0, min(1.0, f))


def _answer_snapshot(verdict: Verdict) -> dict:
    """落库的答案快照。

    必须带 `probabilities`：温度拟合要的就是原始分布，而 `export_labels.py` 是从
    这张表里取标注的。只存标量值的话，choice/score 两类轴在生产上永远无法重拟——
    那正是现在最需要的东西（人工每处置一次，本该给温度表添一格真实证据）。
    """
    out = {}
    for name, a in verdict.answers.items():
        # 键名用引擎自己的那一套（`noul`/`score`/`choice`），不另造一个 `value` 镜像：
        # 这份快照不是给人看的摘要，是给 `normalize_answers` 读回来的。两边形状一致
        # 才能拿已落库的答案重放策略（阈值假设计算、改判据后的复算都靠它）。
        row = {"type": a.qtype, _VALUE_KEY[a.qtype]: a.value, "confidence": round(a.confidence, 4)}
        if isinstance(a.raw, dict):
            row["probabilities"] = {str(k): round(float(v), 6) for k, v in a.raw.items()}
        out[name] = row
    return out


def _outcome_snapshot(outcome: Optional[Outcome]) -> dict:
    """这一次调用**实际得出**的结论，映射到案件上的字段名。

    单独一个函数是因为两处都要用、且必须同源：幂等判断比较的是它，
    写决策日志记的也是它；分成两份字面量就会有一天只改一份。
    """
    if outcome is None:
        return {}
    v = outcome.verdict
    return {
        "suggested_action": v.action,
        "final_action": outcome.action,
        "via": outcome.via,
        # 与列的精度对齐，否则浮点尾差会被读成"结论变了"
        "confidence": _conf(v.confidence),
        "engine": v.engine,
        "authoritative": bool(outcome.authoritative),
        "calibrated": bool(v.calibrated),
        "clause_ids": list(v.clause_ids),
        "answers": _answer_snapshot(v),
        "reasons": list(v.reasons),
        "policy_version": outcome.policy_version,
        "questions_version": outcome.questions_version,
        "lexicon_version": LEXICON_VERSION,
    }


def _conclusion_diff(existing: ModerationCase, outcome: Optional[Outcome]) -> dict:
    """新结论相对案件上旧结论的变化字段；空 = 真的幂等命中。"""
    fresh = _outcome_snapshot(outcome)
    if not fresh:
        return {}
    return {k: val for k, val in fresh.items() if getattr(existing, k) != val}


class ModerationService:
    def __init__(self, db: AsyncSession, engine: Optional[ModerationEngine] = None) -> None:
        self.db = db
        self._engine = engine

    @property
    def engine(self) -> ModerationEngine:
        if self._engine is None:
            self._engine = get_engine()
        return self._engine

    async def review(
        self,
        *,
        subject_type: str,
        subject_id: str,
        title: str,
        body: str,
        author_id: str = "",
    ) -> Optional[ModerationCase]:
        """审一条内容并留痕。返回 None 只表示审核未启用或引擎全部故障。"""
        if not self.engine.providers:
            return None

        sha = content_sha(title, body)
        subject = ModerationSubject(
            kind=subject_type,
            object_id=str(subject_id),
            title=title or "",
            body=body or "",
            author_id=author_id or "",
            content_sha256=sha,
        )

        try:
            outcome = await self.engine.decide(subject)
        except Exception as exc:  # 审核不可用 ≠ 内容有问题；留一条 pending 给人工
            outcome = None
            error_note = f"审核引擎异常：{type(exc).__name__}"
        else:
            error_note = ""

        # 全链没说话（既没命中条款也没给出结论）时**不开案件**。
        # 默认配置下链里只有词表，若"无信号"也建案，人工队列会被干净内容灌满，
        # 而队列的价值恰恰是"这里需要人看一眼"。引擎整体故障仍会建案（outcome is None）。
        #
        # 引擎**主动拒绝**（正文超窗等）同样不开案件：那条内容的真实状态是
        # "机器根本没看"，它既不需要人处置，也不该占一个人工名额——
        # 尤其在这条链已经接到作品保存路径上之后，长稿是常态而非例外。
        if outcome is not None and (
            outcome.verdict.engine == "chain" or outcome.verdict.refusal
        ):
            return None

        existing = (
            await self.db.execute(
                select(ModerationCase).where(
                    ModerationCase.subject_type == subject_type,
                    ModerationCase.subject_id == str(subject_id),
                    ModerationCase.fingerprint == sha,
                )
            )
        ).scalar_one_or_none()

        if existing is not None:
            snap = _outcome_snapshot(outcome)
            stale = _conclusion_diff(existing, outcome)
            # 降级判定不许覆盖权威结论。真机测过：sidecar 崩着的时候点一次
            # 「让模型重判」，案件上的 answers / confidence / clause_ids 会被
            # 换成词表的空值——那条内容真正的风险信号就此从案件上消失，
            # 队列的风险排序也把它挪到后面。这一次尝试只留一条备注。
            downgrade = bool(stale) and bool(existing.authoritative) and (
                outcome is not None and not outcome.authoritative
                and bool(outcome.engine_silence)
            )
            if downgrade:
                notes = [line for line in outcome.engine_silence
                         if line not in (existing.reasons or [])]
                if notes:
                    existing.reasons = list(existing.reasons or []) + notes
            elif stale and existing.state in (STATE_PENDING, STATE_AUTO_CLOSED):
                # 命中同一内容指纹不等于"结论相同"：策略版、题集版、温度表都可能已经变了。
                # 旧代码在这里原样返回旧案件，这一次模型调用被整个丢掉，
                # 于是队列里那条内容永远挂着旧裁决。人已结案的（resolved/dismissed）
                # 不覆盖——机器的新意见不该重开人的决定。
                for field, value in stale.items():
                    setattr(existing, field, value)
                existing.decided_at = datetime.now(timezone.utc)
                existing.state = (
                    STATE_AUTO_CLOSED if snap["final_action"] != ACTION_HUMAN
                    else STATE_PENDING
                )
            # 这一次调用得出了什么就记什么；引擎异常（snap 为空）时记案件现状，
            # 因为这一次确实没有产生新结论。
            src = snap or {
                "final_action": existing.final_action, "via": existing.via,
                "confidence": existing.confidence, "engine": existing.engine,
                "reasons": existing.reasons,
                "policy_version": existing.policy_version,
                "questions_version": existing.questions_version,
            }
            self.db.add(
                ModerationDecisionLog(
                    case_id=existing.id, dedupe_hit=not stale,
                    action=src["final_action"], via=src["via"],
                    confidence=src["confidence"], engine=src["engine"],
                    # 这一列存的是"问了哪几台引擎"，建案分支存的也是它。
                    # 从前这里塞的是 reasons——同一个列两种含义，
                    # 于是决策日志在复盘时分不清"哪几台被调用"和"为什么这么判"。
                    engines_tried=list(outcome.engines_tried) if outcome else [],
                    policy_version=src["policy_version"],
                    questions_version=src["questions_version"],
                )
            )
            await self.db.flush()
            return existing

        verdict = outcome.verdict if outcome else Verdict.abstain("chain", error_note)
        auto_executed = bool(outcome) and outcome.action != ACTION_HUMAN
        case = ModerationCase(
            subject_type=subject_type,
            subject_id=str(subject_id),
            author_id=author_id or "",
            fingerprint=sha,
            state=STATE_AUTO_CLOSED if auto_executed else STATE_PENDING,
            suggested_action=verdict.action,
            final_action=outcome.action if outcome else "",
            via=outcome.via if outcome else "engine_unavailable",
            confidence=_conf(verdict.confidence),
            engine=verdict.engine,
            authoritative=bool(outcome.authoritative) if outcome else False,
            calibrated=bool(verdict.calibrated),
            clause_ids=list(verdict.clause_ids),
            answers=_answer_snapshot(verdict),
            reasons=list(verdict.reasons),
            policy_version=outcome.policy_version if outcome else "",
            questions_version=outcome.questions_version if outcome else "",
            lexicon_version=LEXICON_VERSION,
            latency_ms=verdict.latency_ms,
            decided_at=datetime.now(timezone.utc) if outcome else None,
        )
        self.db.add(case)
        await self.db.flush()

        if outcome:
            self.db.add(
                ModerationDecisionLog(
                    case_id=case.id, dedupe_hit=False,
                    action=outcome.action, via=outcome.via,
                    confidence=_conf(outcome.confidence), engine=verdict.engine,
                    engines_tried=list(outcome.engines_tried),
                    policy_version=outcome.policy_version,
                    questions_version=outcome.questions_version,
                )
            )
            await self.db.flush()
        return case

    async def queue(self, state: Optional[str] = None, limit: int = 50,
                    order: str = "risk", offset: int = 0) -> dict:
        """人工队列（分页）。默认按"最该先看"排，不是按最新排。

        第一级排序键是**有没有明确条款**——这是一个事实（某条规则确实指认了内容），
        不是自报数。必须用它，因为实测词表案件的 `confidence` 全是 0.0：
        只按 confidence 排，在默认（未开模型）配置下会退化成"按时间"，
        于是交付一个不起作用的控件。第二级才是 confidence（支撑结论的最弱证据概率），
        第三级是时间。

        两条诚实的前提：① 词表与模型的置信度不同量纲，跨引擎比较只配当"先看哪条"的提示，
        不配当风险度量；② 模型条款归属在高置信档仍会错（ADR-028 实测 57% / 18%），
        所以这是**排序**，不是**结论**——界面必须把这句话显示出来。
        """
        clause_weight = func.coalesce(func.jsonb_array_length(ModerationCase.clause_ids), 0)
        base = select(ModerationCase)
        count_q = select(func.count()).select_from(ModerationCase)
        if state:
            base = base.where(ModerationCase.state == state)
            count_q = count_q.where(ModerationCase.state == state)
        # 末级键必须是确定性的：同一事务里插入的多行 `created_at` 完全相同
        # （PG 的 now() 取事务开始时间），只排到时间会在翻页时重复或漏项。
        if order == "new":
            base = base.order_by(ModerationCase.created_at.desc(), ModerationCase.id.desc())
        else:
            base = base.order_by(clause_weight.desc(),
                                 ModerationCase.confidence.desc().nulls_last(),
                                 ModerationCase.created_at.desc(),
                                 ModerationCase.id.desc())
        total = (await self.db.execute(count_q)).scalar_one()
        rows = (
            await self.db.execute(base.offset(offset).limit(limit))
        ).scalars().all()
        return {"items": list(rows), "total": int(total)}

    async def get(self, case_id: UUID) -> Optional[ModerationCase]:
        return await self.db.get(ModerationCase, case_id)

    async def resolve(
        self, case_id: UUID, *, outcome: str, actor: str, note: str = ""
    ) -> Optional[ModerationCase]:
        """人工处置，outcome ∈ resolved | dismissed。

        `actor` 必须由鉴权层提供，不接受客户端自报：参照实现让客户端传 actor
        且默认 `"admin"`（`server.py:201`），任何调用方都能冒充管理员结案。
        """
        if outcome not in ("resolved", "dismissed"):
            return None
        case = await self.db.get(ModerationCase, case_id)
        if not case:
            return None
        case.state = STATE_RESOLVED if outcome == "resolved" else STATE_DISMISSED
        case.resolved_at = datetime.now(timezone.utc)
        case.resolved_by = actor
        case.resolution_note = note or None
        # 顶层用例自己提交：`get_db` 只 close 不 commit，只 flush 的话
        # 会话结束就回滚——运营点了"确认处置"看到 200，库里其实还是 pending。
        # 中台其它写路径（admin_service 的六个动作）都是这个约定，这里曾是唯一的例外。
        await self.db.commit()
        return case

    async def reopen(self, case_id: UUID, *, actor: str, note: str = "") -> Optional[ModerationCase]:
        """终态回退：误判必须有一条回去的路（参照实现的终态是单向的）。"""
        case = await self.db.get(ModerationCase, case_id)
        if not case:
            return None
        case.state = STATE_PENDING
        case.resolved_at = None
        case.resolved_by = actor
        case.resolution_note = note or None
        await self.db.commit()   # 同 resolve：不提交的话回退也只活在内存里
        return case

    async def stats(self) -> dict:
        by_state = (
            await self.db.execute(
                select(ModerationCase.state, func.count()).group_by(ModerationCase.state)
            )
        ).all()
        by_engine = (
            await self.db.execute(
                select(ModerationCase.engine, func.count()).group_by(ModerationCase.engine)
            )
        ).all()
        return {
            "by_state": {str(s): int(c) for s, c in by_state},
            "by_engine": {(e or "-"): int(c) for e, c in by_engine},
            "engines": [
                {"name": n, "healthy": h, "authoritative": a}
                for n, h, a in self.engine.availability()
            ],
            "policy": {
                "version": self.engine.policy.version,
                "auto_approve": self.engine.policy.auto_approve_threshold,
                "auto_reject": self.engine.policy.auto_reject_threshold,
                "human_band": self.engine.policy.human_band,
            },
            "calibration": await self._calibration_reports(),
            "staleness": await self._staleness(),
        }

    async def _staleness(self) -> dict:
        """队列里有多少条结论**是在旧版本上判的**，以及有多少条根本没走到模型那一层。

        存在的理由：判定只在内容被保存的那一刻发生，题集/词表/温度表改版之后，
        队列里的旧结论不会自己变——`§12` 的幂等键保证了"重新送审会重算"，
        但没人触发就没人重算。少了这个数，"队列里有 994 条待处置"看起来像
        994 条同等新鲜的证据，而实测其中 264 条是 `questions-2` 时代判的。
        """
        total, stale_q, stale_lex, never_asked = (
            await self.db.execute(
                select(
                    func.count(),
                    func.count().filter(ModerationCase.questions_version != QUESTIONS_VERSION),
                    func.count().filter(ModerationCase.lexicon_version != LEXICON_VERSION),
                    func.count().filter(ModerationCase.authoritative.is_(False)),
                )
            )
        ).one()
        return {
            "total": int(total),
            "stale_questions": int(stale_q),
            "stale_lexicon": int(stale_lex),
            "current_questions": QUESTIONS_VERSION,
            "current_lexicon": LEXICON_VERSION,
            #: 这次结论不是权威引擎给的（词表判的、或全体弃权）。它是"自动判断
            #: 到底覆盖了多少内容"的真分母——比 auto_rate 更早的一环。
            "without_authoritative_verdict": int(never_asked),
        }

    async def whatif(self, *, approve: float, reject: float, scan: int) -> dict:
        """阈值假设：读最近 ``scan`` 条案件，在它们**已落库的答案**上重放假定的线。

        `scan` 不设默认值：窗口大小只在路由那一处声明（`Query(default=2000)`），
        这里再写一份就是两个真相源，改一个忘一个时界面读的窗宽会静默变化。

        `population` 一起回：窗口截断必须在读数的同一屏说出来。这条队列实测有 900+ 条待处置，
        而默认只看最新 500 条——少了这个数，"这条线只影响 3 条"其实是"在我看得见的 500 条里
        影响 3 条"，两者差一倍以上（参照实现的 what-if 连样本量都不报）。
        """
        from app.domains.moderation.whatif import evaluate

        rows = (
            await self.db.execute(
                select(ModerationCase)
                .order_by(ModerationCase.decided_at.desc().nulls_last(),
                          ModerationCase.id.desc())
                .limit(scan)
            )
        ).scalars().all()
        population = (await self.db.execute(
            select(func.count()).select_from(ModerationCase))).scalar_one()
        return replace(
            evaluate(list(rows), approve=approve, reject=reject),
            population=int(population or 0),
        )

    async def _calibration_reports(self) -> List[dict]:
        """能报标定覆盖面的引擎各报一条。词表没有温度表，所以它不在列表里——
        这是"能力缺席"而不是"覆盖为 0"，两者混起来会让界面显示一个假的红色缺口。

        客户端是阻塞的 urllib，与 `moderate` 同样丢给 `to_thread`；
        报不出来时留一条带错误名的记录，而不是整个 stats 失败或悄悄跳过。
        """
        reports: List[dict] = []
        for provider in self.engine.providers:
            if not isinstance(provider, CalibrationReporter):
                continue
            try:
                data = await asyncio.to_thread(provider.calibration)
            except Exception as exc:  # 覆盖面探测失败不该让中台打不开
                data = {"reachable": False, "error": type(exc).__name__}
            reports.append({"engine": provider.name, **data})
        return reports


async def advisory_review(
    db: AsyncSession,
    *,
    subject_type: str,
    subject_id: object,
    title: str,
    body: str,
    author_id: str = "",
) -> Optional[ModerationCase]:
    """发布/评论路径上的旁路留痕：**任何情况下都不向调用方抛异常**。

    ADR-018:23 定的是发布只跑规则校验、不做前置人工审核。所以审核挂在这里
    只能是"顺便记一笔"，不能变成新的发布闸门——sidecar 停了、模型答歪了、
    甚至本模块自己写库失败，都不能让一个作者发不出作品。

    写包在 SAVEPOINT 里：失败只回滚审核行，不污染调用方尚未提交的事务。
    """
    try:
        async with db.begin_nested():
            return await ModerationService(db).review(
                subject_type=subject_type,
                subject_id=str(subject_id),
                title=title,
                body=body,
                author_id=author_id,
            )
    except Exception as exc:
        logger.warning("moderation advisory skipped (%s/%s): %s", subject_type, subject_id, exc)
        return None
