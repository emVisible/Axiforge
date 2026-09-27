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


async def sweep(rows: List[dict]) -> List[dict]:
    """双阈值扫描。参照实现只扫一条线（AUTO_THRESHOLD），
    而通过线与驳回线的代价不对称：误伤作者 vs 漏放违规，必须分开扫。"""
    grid = []
    for ap in (0.80, 0.85, 0.90, 0.95):
        for rj in (0.85, 0.90, 0.95, 0.97):
            eng = ModerationEngine(build_chain(), Policy(ap, rj, version=f"sweep-{ap}-{rj}"))
            s = score(await run_chain(rows, eng))
            grid.append(
                {"approve": ap, "reject": rj, "accuracy": s["accuracy"],
                 "auto_rate": s["auto_rate"], "auto_err": s["auto_err"]}
            )
    return grid


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sweep", action="store_true")
    args = ap.parse_args()

    rows = load_samples()
    engine = ModerationEngine(build_chain(), Policy())
    results = await run_chain(rows, engine)
    print(json.dumps(score(results), ensure_ascii=False, indent=2))
    print("\nengines:", engine.availability())
    if args.sweep:
        if not any(a for _, _, a in engine.availability()):
            # 链里没有权威引擎时，扫阈值得到的是一张全 0 的表——那会被误读成"阈值不敏感"，
            # 实际是"没有任何引擎有资格执行"。宁可拒绝出表。
            print("\n[sweep 跳过] 链里没有 authoritative 引擎；"
                  "起 laya sidecar 后重跑，否则扫出来的 auto_rate 恒为 0，是张假表。")
            return 0
        print("\n阈值扫描（approve 线 × reject 线）：")
        for g in await sweep(rows):
            print(f"  approve>={g['approve']} reject>={g['reject']}  "
                  f"acc={g['accuracy']:.3f} auto={g['auto_rate']:.3f} auto_err={g['auto_err']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
