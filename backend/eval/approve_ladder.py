"""approve 这条路的置信度**口径**对照（影子读数，不改生产）。

为什么要跑这个：门控的比较式是 `verdict.confidence >= auto_approve_threshold`，
而那个 confidence 目前等于「八条负面证据里最弱的一条」（`policy._no_risk_confidence`）。
2026-09-28 在 dev 台账（当时 505 条 laya 案件）实测：confidence 上限 **0.787**、
`>=0.90` 是 **0 条**、中位数 0.545。也就是说"自动通过"不是被阈值挡住的——
**是那个数在结构上到不了线**：八条轴取 min 是个合取判据，只要有一条轴对干净内容给到 0.45，
整篇的"清白置信"就封顶 0.55。
（同一批口径在 76 行对照语料、重拟之后的表上是 中位 0.70 / 上限 0.85——见 ADR-028 D29。）

这个脚本把几种口径放在**同一批 Laya 真实答案**上对比，每条线报四个数：
① 会放行几条；② 其中几条标注不是"可放行"（**误放**，唯一真正贵的那个）；
③ 标注可放行却没够到线的有几条（**还压在人这里的量**）；
④ 过线但根本没人判过的有几条（**无从验证的量**）。
只有 ②一直守住 0，①才是收益而不是运气；④ 占满的时候，这张表证不了任何事——
而 `--from-db` 那一栏实测就是这么空的。

一条必须说清的限制：`moderation_samples.jsonl` 的 expected 是**单人按 ADR-018 题面撰写的标注**，
76 行、无第二人复核。它能回答"哪种口径在这批证据上更不自洽"，不足以回答"上线后误放率是多少"。
所以这里的结论只用来**选口径**，不用来**批准上线**。
其中 42 行是 D29 加的**对照三元组**（每条 noul 轴一组"该报 / 不该报 / 边界"，带 `pair` 与 `role`，
边界项必须写 `note` 交代立场）。它们的作用不是让数字变好看，而是让"模型与人在同一行上不同意"
这件事被读数抓出来——实测已经抓到一条（见 ADR-028 D29）。

用法：
    uv run python eval/approve_ladder.py              # 语料全部行（第一次真问 Laya，每行一次 decide）
    uv run python eval/approve_ladder.py --fresh      # 丢掉缓存重问
    uv run python eval/approve_ladder.py --from-db     # 改读队列里已落库的答案，标注＝人工处置
缓存默认 `/tmp/approve_ladder_cache.json`（拟合类产物不入库，缓存同理）。
"""

from __future__ import annotations

import argparse
import json
import math
import os
import statistics
import sys
from pathlib import Path
from typing import Callable, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("TESTING", "1")

from app.domains.moderation.contracts import ModerationSubject  # noqa: E402
from app.domains.moderation.policy import (  # noqa: E402
    _RISK_AXES,
    _event_p,
    _no_risk_confidence,
    decide_from_answers,
)
from app.domains.moderation.questions import normalize_answers  # noqa: E402
from app.domains.moderation.service import _answer_snapshot  # noqa: E402

SAMPLES = Path(__file__).resolve().parent / "moderation_samples.jsonl"
DEFAULT_CACHE = Path("/tmp/approve_ladder_cache.json")
LINES = (0.90, 0.85, 0.80, 0.75)

#: 负面证据集合与生产口径同源：七条风险轴 + 成人档。**不含 severity**（理由见 policy 的 docstring）。
_NEGATIVE = list(_RISK_AXES) + ["age_rating"]


def _clear_p(answers: Dict, name: str) -> float:
    """「这条轴说没事」的概率。"""
    return 1.0 - _event_p(answers, name)


def _none_p(answers: Dict) -> float:
    """单选题「最主要一条 = 无问题」的概率。模型自己的整体判断，不是逐轴之和。"""
    a = answers.get("primary_clause")
    if a is None:
        return 0.0
    probs = a.raw if isinstance(a.raw, dict) else None
    if probs:
        return max(0.0, min(1.0, float(probs.get("none", 0.0))))
    return 1.0 if a.value == "none" else 0.0


def _agg(answers: Dict) -> List[float]:
    return [_clear_p(answers, n) for n in _NEGATIVE if n in answers]


def _min_over(names: List[str]) -> Callable[[Dict], float]:
    """和现行口径同构，只是换掉参与取 min 的轴集合。缺任何一条仍归零，不做乐观兜底。"""
    def fn(a: Dict) -> float:
        if any(n not in a for n in names):
            return 0.0
        return min(_clear_p(a, n) for n in names)
    return fn


CANDIDATES: Dict[str, Callable[[Dict], float]] = {
    # 生产现行口径（policy._no_risk_confidence）：八条负面证据取 min，缺任何一条归零。
    "min8=现行": _no_risk_confidence,
    # 逐轴分离度实测：压住 approve 的那条轴就是 illegal_act_instruction（12 行里 9 行由它决定），
    # 而它在可放行(0.63)与该人工(0.57)两组之间**没有分离力**。下面两条就是把它/再连年龄分级
    # 一起移出取 min 的集合，看"瓶颈是这条轴而不是聚合方式"这个判断成不成立。
    "min7(去违法教程)": _min_over([n for n in _NEGATIVE if n != "illegal_act_instruction"]),
    "min6(再去年龄分级)": _min_over([n for n in _NEGATIVE
                                    if n not in ("illegal_act_instruction", "age_rating")]),
    "mean8": lambda a: (sum(_agg(a)) / len(_agg(a))) if len(_agg(a)) == len(_NEGATIVE) else 0.0,
    "geo8": lambda a: (
        statistics.geometric_mean(_agg(a)) if len(_agg(a)) == len(_NEGATIVE) and all(x > 0 for x in _agg(a))
        else 0.0),
    "prod8": lambda a: (
        math.prod(_agg(a)) if len(_agg(a)) == len(_NEGATIVE) else 0.0),
    "min9(含无问题)": lambda a: min(
        [_no_risk_confidence(a), _none_p(a)]) if "primary_clause" in a else 0.0,
    "mean8⊕无问题": lambda a: (
        0.5 * (sum(_agg(a)) / len(_agg(a))) + 0.5 * _none_p(a))
        if len(_agg(a)) == len(_NEGATIVE) else 0.0,
    "none=模型自评": _none_p,
}


def fetch_answers(cache: Path, fresh: bool) -> Dict[str, dict]:
    """样本集全部行 → 每行的类型化答案快照（与落库同形，能被 normalize_answers 读回来）。

    缓存里必须带上 `clauses`：报出"某行会被误放"之后，如果只能看到模型的答案、
    看不到当初那条标注是什么，这个读数就没法被查账（2026-09-28 找 human-09 时撞上的）。
    """
    if cache.exists() and not fresh:
        return json.loads(cache.read_text(encoding="utf-8"))
    from app.domains.moderation.providers.laya_sidecar import LayaSidecarEngine

    engine = LayaSidecarEngine()
    if not engine.health_check():
        raise SystemExit("sidecar 不可达：先起 :8685，这个脚本不代替它编数")
    out: Dict[str, dict] = {}
    for row in _rows():
        v = engine.moderate(ModerationSubject(
            kind=row["kind"], object_id=row["id"], title=row["title"], body=row["body"]))
        if v.abstained:
            print(f"  跳过 {row['id']}：{v.reasons[:2]}")
            continue
        out[row["id"]] = {
            "expected": row["expected"],
            "answers": _answer_snapshot(v),
            "clauses": row.get("clauses") or [],
        }
        print(f"  {row['id']} expected={row['expected']} 答 {len(out[row['id']]['answers'])} 题")
    cache.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    return out


def _rows() -> List[dict]:
    return [json.loads(line) for line in SAMPLES.read_text(encoding="utf-8").splitlines() if line.strip()]


def axis_report(per_row: List[tuple]) -> None:
    """逐轴的分离度：min8 的天花板到底是谁压的，以及那一条轴本身有没有判断力。

    这一步是这个脚本的存在理由。聚合方式（mean/geo/prod）只是把同一个信息换个算法，
    如果八条轴在这批内容上本来就分不开"可放行"与"该人工"，**换聚合换不出判别力**，
    只会把不该放行的那些一起抬过线（实测 mean8 正是这样：0.85 线上 21 放行 9 误放）。
    所以真正要回答的是：压住 min8 的那条轴，它自己能不能把两组分开。
    """
    clean = [r for r in per_row if r[2] == "approve"]
    hard = [r for r in per_row if r[2] and r[2] != "approve"]
    if not clean or not hard:
        print("\n[逐轴] 两组里有一组是空的，分离度无从谈起"
              f"（可放行 {len(clean)} 行、有标注的反例 {len(hard)} 行）")
        return

    print(f"\n[逐轴分离度] 落在 approve 分支的 {len(per_row)} 行里"
          f"：标注可放行 {len(clean)} 行、标注该人工/驳回 {len(hard)} 行\n")
    binding: Dict[str, int] = {}
    for _, a, exp in per_row:
        if exp != "approve":
            continue
        weakest = min(_NEGATIVE, key=lambda n: _clear_p(a, n))
        binding[weakest] = binding.get(weakest, 0) + 1

    print(f"{'轴':<24}{'可放行中位':>11}{'该人工中位':>11}{'谁被 min 压住':>14}{'单轴最优(放/误)':>18}")
    print("-" * 78)

    for name in _NEGATIVE:
        cs = sorted(_clear_p(a, name) for _, a, _ in clean)
        hs = sorted(_clear_p(a, name) for _, a, _ in hard)
        # 单轴能做到的最好操作点：只在这条轴上设线，取所有候选线里「误放 0 且放行最多」的那个。
        best = (0, 0, 0.0)
        for line in sorted({v for v in cs + hs}, reverse=True):
            passed_clean = sum(1 for v in cs if v >= line)
            passed_hard = sum(1 for v in hs if v >= line)
            if passed_hard == 0 and passed_clean > best[0]:
                best = (passed_clean, passed_hard, line)
        cap = f"{best[0]}/{best[1]} @{best[2]:.2f}" if best[2] else "无线可分"
        print(f"{name:<24}{statistics.median(cs):>11.2f}{statistics.median(hs):>11.2f}"
              f"{binding.get(name, 0):>14}{cap:>18}")

    print("\n「谁被 min 压住」= 可放行那组里由这条轴决定 min8 的行数；"
          "「单轴最优」= 只在这条轴上设线能做到的 放行/误放 及其线。")
    return None


def db_rows(limit: int) -> Dict[str, dict]:
    """从**真队列**里取可回放的案件，形状与 `fetch_answers` 一致。

    为什么需要这个口径：34 行自标注集只够选口径，够不着"换了你今天会少处理几条"。
    两处刻意的自律：
    ① **按答案快照去重**。dev 库实测 505 条 laya 案件其实只对应一小撮不同稿子，
       不去重就是把同一篇稿子数十几遍，然后拿那个数去支撑挪线。
    ② **人工结论才当标注**：`resolved`→这条该下架（不是 approve）、`dismissed`→机器误报
       （等价于可放行）、`pending`→**没有标注**。第三种必须单独计数，
       因为它才是"自动化率"真正被什么卡住：不是判据不够好，是没人给过反馈。
    """
    import asyncio
    import json as _json

    from sqlalchemy import select

    from app.database import async_session
    from app.domains.moderation.models import (
        STATE_DISMISSED,
        STATE_RESOLVED,
        ModerationCase,
    )
    from app.domains.moderation.questions import QUESTIONS_VERSION

    async def _fetch():
        stmt = (select(ModerationCase)
                .where(ModerationCase.questions_version == QUESTIONS_VERSION)
                .order_by(ModerationCase.created_at.desc(), ModerationCase.id.desc())
                .limit(limit))
        async with async_session() as db:
            return (await db.execute(stmt)).scalars().all()

    out: Dict[str, dict] = {}
    seen: set = set()
    total_cases = 0
    for c in asyncio.run(_fetch()):
        if not c.engine.startswith("laya") or not c.answers:
            continue
        total_cases += 1
        key = _json.dumps(c.answers, sort_keys=True, ensure_ascii=False)
        if key in seen:
            continue
        seen.add(key)
        # 标注词表与样本集同一套：人下架过＝reject、人判为误报＝approve、没判过＝空串。
        expected = ("reject" if c.state == STATE_RESOLVED else
                    "approve" if c.state == STATE_DISMISSED else "")
        out[str(c.id)[:8]] = {"expected": expected, "answers": c.answers}
    print(f"[approve-ladder] 队列回放了 {total_cases} 条案件，按答案快照去重后 {len(out)} 种内容")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=str(DEFAULT_CACHE))
    ap.add_argument("--fresh", action="store_true", help="丢掉缓存重问模型")
    ap.add_argument("--from-db", action="store_true",
                    help="改读真队列里已落库的答案（人工处置＝标注，pending＝无标注）")
    ap.add_argument("--scan", type=int, default=2000, help="--from-db 时最多回看多少条案件")
    args = ap.parse_args()

    if args.from_db:
        data = db_rows(args.scan)
        note = "队列口径：标注来自人工处置，未处置的行没有标注"
    else:
        data = fetch_answers(Path(args.cache), args.fresh)
        note = f"缓存 {args.cache} 可用样本 {len(data)} 行（单人标注，只用于选口径）"
    print(f"\n[approve-ladder] {note}")

    scored: Dict[str, List[tuple]] = {}
    per_row: List[tuple] = []          # (样本 id, answers, expected)——只收落到 approve 分支的行
    reached = 0
    for sid, item in data.items():
        answers, problems = normalize_answers(item["answers"])
        if problems or not answers:
            print(f"  {sid} 回放不出来：{problems[:2]}")
            continue
        verdict = decide_from_answers(answers, engine="laya:sidecar", calibrated=True)
        if verdict.rule != "no_risk":
            continue  # 这条压根不会走 approve 分支，与口径无关
        reached += 1
        per_row.append((sid, answers, item["expected"]))
        for name, fn in CANDIDATES.items():
            try:
                conf = float(fn(answers))
            except (KeyError, TypeError, ValueError) as exc:
                print(f"  {sid} 在 {name} 上算不出：{exc}")
                conf = 0.0
            scored.setdefault(name, []).append((sid, conf, item["expected"]))

    print(f"[approve-ladder] {len(data)} 行里落到「没有任何一条轴报警」分支的：{reached} 行"
          f"（其余 {len(data) - reached} 行由规则直接决定，换聚合方式不影响）\n")

    hdr = f"{'口径':<18}" + "".join(f"{f'线 {l:.2f}':>22}" for l in LINES) + f"{'中位':>7}{'上限':>7}"
    print(hdr)
    print("-" * len(hdr))
    for name, pairs in scored.items():
        cells = []
        for line in LINES:
            passed = [p for p in pairs if p[1] >= line]
            wrong = [p for p in passed if p[2] and p[2] != "approve"]
            unlabeled = [p for p in passed if not p[2]]
            missed = [p for p in pairs if p[1] < line and p[2] == "approve"]
            cells.append(f"{len(passed):>3}放/{len(wrong):>2}误/{len(missed):>2}留/{len(unlabeled):>3}未")
        confs = sorted(p[1] for p in pairs)
        med = statistics.median(confs) if confs else 0.0
        top = confs[-1] if confs else 0.0
        print(f"{name:<18}" + "".join(f"{c:>22}" for c in cells) + f"{med:>7.2f}{top:>7.2f}")
    print("\n（放=会放行｜误=其中标注不是 approve（**唯一真正贵的那一项**）｜"
          "留=标注可放行却没够到线｜未=过线但根本没人判过，无从验证）")

    axis_report(per_row)

    # 逐行明细只报分歧处：一条口径在某行上与现行口径结论相反，才值得人去看。
    base = {sid: conf for sid, conf, _ in scored.get("min8=现行", [])}
    exp = {sid: item["expected"] for sid, item in data.items()}
    for name, pairs in scored.items():
        if name == "min8=现行":
            continue
        flips = [(sid, conf, base.get(sid, 0.0)) for sid, conf, _ in pairs
                 if (conf >= 0.90) != (base.get(sid, 0.0) >= 0.90)]
        if not flips:
            continue
        print(f"\n[{name}] 与现行口径在 0.90 线上分歧的 {len(flips)} 行：")
        for sid, conf, old in sorted(flips, key=lambda x: -x[1]):
            tag = "误放风险" if conf > old and exp[sid] and exp[sid] != "approve" else (
                "多放行(其中无人判过)" if conf > old and not exp[sid] else (
                "多放行" if conf > old and exp[sid] == "approve" else "收回到人工"))
            print(f"  {sid:<12} expected={exp[sid]:<8} 现行 {old:.2f} → {conf:.2f}  {tag}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
