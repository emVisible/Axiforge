"""审核判断层的可测量基线（ADR-028）。

参照实现在这里是**空的**：`eval/` 只有 8 条合成样本，README 里没有任何准确率数字，
只写着"auto_err 必须为 0"这个要求本身。所以这一份的定位有两层：
1. 给出可复现的数字，让"比参照更好"是一个可检验的命题而不是形容词；
2. 把"auto_err 必须为 0"从一句话变成一个会红的断言（`tests/test_moderation_eval.py`）。

一个诚实的限制：`moderation_samples.jsonl` 的 expected 是**按 ADR-018 条款口径撰写的标注**，
不是多人一致度量的金集。它能衡量"策略与实现是否自洽、失败时是否安全"，
不足以宣称模型准确率。等 sidecar 上线后，同一份集子跑 Laya 才有横向可比的准确率。

用法：
    backend/.venv/bin/python eval/moderation_eval.py            # 当前可用链
    backend/.venv/bin/python eval/moderation_eval.py --sweep    # 双阈值扫描
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ.setdefault("TESTING", "1")

from app.domains.moderation.contracts import (  # noqa: E402
    ACTION_APPROVE,
    ACTION_HUMAN,
    ACTION_REJECT,
    ModerationSubject,
    Policy,
)
from app.domains.moderation.engine import ModerationEngine  # noqa: E402
from app.domains.moderation.providers.lexicon import LexiconEngine  # noqa: E402
from app.domains.moderation.registry import build_chain  # noqa: E402

SAMPLES = Path(__file__).resolve().parent / "moderation_samples.jsonl"
LONG_BODY = "雨" * 7000


def load_samples() -> List[dict]:
    rows = []
    for line in SAMPLES.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if row["id"] == "adversarial-04":
            row["body"] = LONG_BODY
        rows.append(row)
    return rows


def subject_of(row: dict) -> ModerationSubject:
    return ModerationSubject(
        kind=row["kind"],
        object_id=row["id"],
        title=row.get("title", ""),
        body=row.get("body", ""),
        author_id="eval",
    )


async def run_chain(rows: List[dict], engine: ModerationEngine) -> List[dict]:
    out = []
    for row in rows:
        outcome = await engine.decide(subject_of(row))
        out.append(
            {
                "id": row["id"],
                "group": row["id"].split("-")[0],
                "expected": row["expected"],
                "actual": outcome.action,
                "via": outcome.via,
                "engine": outcome.verdict.engine,
                "clauses": outcome.verdict.clause_ids,
                "want_clauses": row.get("clauses") or [],
            }
        )
    return out


def score(results: List[dict]) -> Dict[str, object]:
    total = len(results)
    correct = [r for r in results if r["actual"] == r["expected"]]
    auto = [r for r in results if r["actual"] in (ACTION_APPROVE, ACTION_REJECT)]
    # auto_err：机器自己执行了、且执行错了。这是唯一会直接伤到用户的错误类型。
    auto_err = [r for r in auto if r["actual"] != r["expected"]]
    human = [r for r in results if r["actual"] == ACTION_HUMAN]

    confusion: Counter = Counter((r["expected"], r["actual"]) for r in results)
    clause_tp = clause_fp = clause_fn = 0
    for r in results:
        got, want = set(r["clauses"]), set(r["want_clauses"])
        clause_tp += len(got & want)
        clause_fp += len(got - want)
        clause_fn += len(want - got)

    by_group = defaultdict(lambda: [0, 0])
    for r in results:
        by_group[r["group"]][1] += 1
        if r["actual"] == r["expected"]:
            by_group[r["group"]][0] += 1

    prec = clause_tp / (clause_tp + clause_fp) if (clause_tp + clause_fp) else 0.0
    rec = clause_tp / (clause_tp + clause_fn) if (clause_tp + clause_fn) else 0.0
    return {
        "total": total,
        "accuracy": round(len(correct) / total, 4) if total else 0.0,
        "auto_rate": round(len(auto) / total, 4) if total else 0.0,
        "human_rate": round(len(human) / total, 4) if total else 0.0,
        "auto_err": len(auto_err),
        "auto_err_cases": [f"{r['id']}: {r['expected']} → {r['actual']}({r['via']})" for r in auto_err],
        "clause_precision": round(prec, 4),
        "clause_recall": round(rec, 4),
        "confusion": {f"{e}→{a}": c for (e, a), c in sorted(confusion.items())},
        "by_group": {g: f"{ok}/{n}" for g, (ok, n) in sorted(by_group.items())},
    }


async def collect(rows: List[dict]) -> List[dict]:
    """跑一次链，把每条样本的最终裁决留在内存里供后续离线复用。

    为什么必须先收一次：阈值扫描与规则变体改的都是**策略层**，模型输出并不变。
    原先的 sweep 每换一个阈值就重建一条链，16 个格子 = 16 次全量模型调用，
    既是 16 倍的等待，也让"扫阈值"看起来像在测模型（其实在重测模型的随机性）。
    """
    engine = ModerationEngine(build_chain(), Policy())
    snaps = []
    for row in rows:
        outcome = await engine.decide(subject_of(row))
        snaps.append({"row": row, "outcome": outcome})
    return snaps, engine


def variant_results(snaps: List[dict], *, rules=None, assume_calibrated: bool,
                    policy: Optional[Policy] = None) -> List[dict]:
    """用同一批模型答案，换一个策略层求值一遍。`rules=None` 表示用生产规则表。"""
    from app.domains.moderation import policy as policy_mod

    original = policy_mod.RULES
    pol = policy or Policy()
    try:
        if rules is not None:
            policy_mod.RULES = rules
        out = []
        for s in snaps:
            v = s["outcome"].verdict
            row = s["row"]
            new_v = policy_mod.decide_from_answers(
                v.answers, engine=v.engine, calibrated=assume_calibrated,
                extra_reasons=list(v.reasons),
            )
            action, via = policy_mod.gate(
                new_v, pol.resolved(row["kind"]), authoritative=s["outcome"].authoritative)
            out.append({
                "id": row["id"], "group": row["id"].split("-")[0],
                "expected": row["expected"], "actual": action, "via": via,
                "engine": new_v.engine, "clauses": new_v.clause_ids,
                "want_clauses": row.get("clauses") or [],
            })
        return out
    finally:
        policy_mod.RULES = original


def clause_false_positives(results: List[dict]) -> Dict[str, int]:
    """假阳性按条款×分组计数——总精度一个数字看不出是哪条轴在乱报。"""
    tally: Counter = Counter()
    for r in results:
        for c in set(r["clauses"]) - set(r["want_clauses"]):
            tally[f"{c}({r['group']})"] += 1
    return dict(sorted(tally.items(), key=lambda kv: -kv[1]))


def without_rule(rules, key):
    return tuple(r for r in rules if r.key != key)


def severity_as_amplifier(rules):
    """severity 只在已经有风险轴命中时才加码——量级轴不该自己制造案件。"""
    from app.domains.moderation.policy import RISK_PRESENT, Rule, _p

    replaced = []
    for r in rules:
        if r.key != "high_severity":
            replaced.append(r)
            continue
        replaced.append(Rule(
            key=r.key, action=r.action,
            when=lambda a: float(getattr(a.get("severity"), "value", 0) or 0) >= 1.0
            and any(_p(a, n) >= RISK_PRESENT for n in (
                "sexual_content", "violence_gore", "self_harm", "hate_targeted",
                "illegal_act_instruction", "pii_real_person", "spam_promotion")),
            clauses=r.clauses, evidence=r.evidence,
        ))
    return tuple(replaced)


async def sweep_from(snaps: List[dict], *, assume_calibrated: bool) -> List[dict]:
    """扫描线要往下探到"会出错"的地方，否则它只证明了一件事：线够高就不出错。

    参照实现的 README 写着 "auto_err 必须为 0"，然后只扫 0.86/0.88 两个高位——
    那张表里没有一行会红，于是它没有回答真正的问题：
    **线画到哪里才开始伤人**。这里把 0.55~0.75 也扫进来，并把误执行的样本 id 打出来。
    """
    grid = []
    for ap in (0.55, 0.65, 0.75, 0.80, 0.90, 0.95):
        for rj in (0.60, 0.85, 0.95):
            s = score(variant_results(snaps, assume_calibrated=assume_calibrated,
                                       policy=Policy(ap, rj, version=f"sweep-{ap}-{rj}")))
            grid.append(
                {"approve": ap, "reject": rj, "accuracy": s["accuracy"],
                 "auto_rate": s["auto_rate"], "auto_err": s["auto_err"],
                 "err_cases": s["auto_err_cases"]}
            )
    return grid


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sweep", action="store_true", help="双阈值扫描（复用一次模型调用）")
    ap.add_argument("--what-if", action="store_true",
                    help="反事实：假设温度表已拟合，各规则变体会执行出什么")
    args = ap.parse_args()

    rows = load_samples()
    snaps, engine = await collect(rows)
    results = [{"id": s["row"]["id"], "group": s["row"]["id"].split("-")[0],
                "expected": s["row"]["expected"], "actual": s["outcome"].action,
                "via": s["outcome"].via, "engine": s["outcome"].verdict.engine,
                "clauses": s["outcome"].verdict.clause_ids,
                "want_clauses": s["row"].get("clauses") or []} for s in snaps]
    measured = score(results)
    print(json.dumps(measured, ensure_ascii=False, indent=2))
    print("\n假阳性条款分布:", json.dumps(clause_false_positives(results), ensure_ascii=False))
    via = Counter(r["via"].split(" ")[0] for r in results)
    print("转人工原因分布:", json.dumps(dict(via.most_common()), ensure_ascii=False))
    print("\nengines:", engine.availability())

    calibrated_any = any(s["outcome"].verdict.calibrated for s in snaps)
    authoritative_any = any(s["outcome"].authoritative for s in snaps)
    if args.sweep or args.what_if:
        if not authoritative_any:
            # 链里没有权威引擎时，扫阈值得到的是一张全 0 的表——那会被误读成"阈值不敏感"，
            # 实际是"没有任何引擎有资格执行"。宁可拒绝出表。
            print("\n[sweep 跳过] 链里没有 authoritative 引擎；"
                  "起 laya sidecar 后重跑，否则扫出来的 auto_rate 恒为 0，是张假表。")
            return 0
        if not calibrated_any:
            print("\n[真实门控下的扫描无意义] 有权威引擎但没有温度表：gate 在第 4 道就转人工，"
                  "任何阈值的 auto_rate 都是 0。下面的数字全部来自**反事实**"
                  "（假设 calibrated=True），只能用来比较策略变体，不能当作线上预期。")
        if args.sweep:
            print("\n阈值扫描（approve 线 × reject 线，反事实）：")
            for g in await sweep_from(snaps, assume_calibrated=True):
                print(f"  approve>={g['approve']} reject>={g['reject']}  "
                      f"acc={g['accuracy']:.3f} auto={g['auto_rate']:.3f} auto_err={g['auto_err']}")
                if g["err_cases"]:
                    print(f"      误执行：{'；'.join(g['err_cases'][:4])}")
        if args.what_if:
            from app.domains.moderation.policy import RULES

            variants = [
                ("生产规则表 + 反事实校准", dict(rules=None, assume_calibrated=True)),
                ("去掉 high_severity", dict(rules=without_rule(RULES, "high_severity"),
                                            assume_calibrated=True)),
                ("high_severity 需与风险轴同时命中",
                 dict(rules=severity_as_amplifier(RULES), assume_calibrated=True)),
                ("生产规则表 + 不校准（= 线上现状）",
                 dict(rules=None, assume_calibrated=False)),
            ]
            print("\n反事实（同一批模型答案，只换策略层）：")
            for name, kw in variants:
                s = score(variant_results(snaps, **kw))
                print(f"  {name:<34} acc={s['accuracy']:.3f} auto={s['auto_rate']:.3f} "
                      f"auto_err={s['auto_err']} clauseP={s['clause_precision']:.2f} "
                      f"clauseR={s['clause_recall']:.2f} groups={s['by_group']}")
                if s["auto_err_cases"]:
                    print(f"  {'':<34} 误执行: {', '.join(s['auto_err_cases'][:6])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
