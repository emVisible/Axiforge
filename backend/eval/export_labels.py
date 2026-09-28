"""把已结案的人工处置导出成校准用的标注集。

为什么需要它：按 ADR-028 的门控，**未校准的置信度不允许执行不可逆动作**。
所以"自动判断"要真的自动，缺的不是代码而是温度表；而温度表要有标注才能拟合。
标注从哪来？就从中台自己的处置记录来——人工每点一次"确认处置/误报"，
都是在给当时的类型化答案打一个真实标签。

参照实现有 `eval/export.py` 做同样的事，但它导出的是扁平 JSON 文件里的结论；
这里导出的是 Postgres 里的案件，且只导出**带类型化答案**的那些
（词表结论没有答案，喂进拟合只会得到一个假的温度）。

用法：
    backend/.venv/bin/python eval/export_labels.py --out eval/moderation_labels.jsonl
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("TESTING", "1")

from sqlalchemy import select  # noqa: E402

from app.database import async_session  # noqa: E402
from app.domains.moderation.models import ModerationCase  # noqa: E402
from app.domains.moderation.questions import question_types  # noqa: E402

#: 人工结论 → 期望动作。dismissed 表示"机器报错了"，即该内容其实可放行。
OUTCOME_TO_EXPECTED = {"resolved": "reject", "dismissed": "approve"}


def case_payload(r: ModerationCase) -> dict:
    """一条导出行。**键名必须与 `eval/moderation_samples.jsonl` 一致**——
    拟合与评测读的是同一套键（`clauses` / `answers` / `expected`），
    这里少一个键，`calibrate.py` 不会报错而是**整行跳过**：
    它明写"没有条款标注的行不能凭空当成七条轴都不存在"。
    以前这份导出就从来没发过 `clauses`，于是"攒够标注 → 重拟"这条路
    真要跑起来会得到一份 0 样本的温度表。

    `clauses` 的语义是"人背书过的条款集合"，不是"机器报过的条款"：
    - `resolved`（确认处置）→ 机器当时标的条款被人认了 → 原样带出；
    - `dismissed`（判为误报）→ 那些条款被人否了 → 空集，于是这七条轴各记一个 0，
      这正是过报应当付出的代价。
    一个必须说清的偏差：这样得到的正样本永远只覆盖"机器自己想到的那些轴"，
    人没有逐轴打勾的入口，所以它**低估假阳性**、拟出来的温度偏乐观。
    要把这个偏差拿掉得给处置面板加逐轴勾选（ADR-028 §"还差什么"第 3 步的金集版本）。
    """
    return {
        "case_id": str(r.id),
        "subject_type": r.subject_type,
        "subject_id": r.subject_id,
        "engine": r.engine,
        "answers": r.answers,
        "clauses": list(r.clause_ids) if r.state == "resolved" else [],
        "expected": OUTCOME_TO_EXPECTED.get(r.state, "human_review"),
        "human_state": r.state,
        "policy_version": r.policy_version,
        "questions_version": r.questions_version,
        "calibrated_at_decide": r.calibrated,
    }


async def collect() -> list[dict]:
    """导出 (类型化答案, 人工标签) 对，供温度拟合。"""
    async with async_session() as db:
        rows = (
            await db.execute(
                select(ModerationCase).where(
                    ModerationCase.resolved_at.is_not(None),
                    ModerationCase.state.in_(("resolved", "dismissed")),
                )
            )
        ).scalars().all()

    out: list[dict] = []
    for r in rows:
        if not r.answers:
            # 词表结论没有答案；把"没有答案"的行喂进拟合会拟合出一个毫无意义的 T
            continue
        out.append(case_payload(r))
    return out


def fit_readiness(rows: list[dict]) -> dict[str, dict[str, int]]:
    """这份导出**能不能真的拟出东西**——在跑 `calibrate.py` 之前就说出来。

    存在的理由就是这一轮刚踩到的那个坑：`clauses` 键没导出时，拟合侧的行为是整行跳过，
    于是"导出 40 条标注"会一路顺利到拟出**一张空表**为止都没有任何红。
    noul 轴这里**直接调拟合侧的同一个函数**（`calibrate.binary_pairs`）而不是另写一套判据——
    两份判据迟早会一天只改一份，那时候 readiness 报绿灯而拟合仍拿到 0 样本。
    """
    from eval.calibrate import binary_pairs

    out: dict[str, dict[str, int]] = {}
    for name, qtype in question_types().items():
        if qtype == "noul":
            pairs = binary_pairs([(r, r.get("answers") or {}) for r in rows], name)
            out[name] = {"type_noul": 1, "samples": len(pairs),
                         "positives": sum(int(lab) for _, lab in pairs)}
        else:
            # choice/score 要的是整条分布：只有标量值的行拟不动（旧快照正是这样）。
            have = sum(1 for r in rows
                       if isinstance(((r.get("answers") or {}).get(name) or {}).get("probabilities"), dict))
            out[name] = {"type_noul": 0, "samples": have, "positives": 0}
    return out


def report_readiness(rows: list[dict]) -> None:
    ready = fit_readiness(rows)
    dead = [n for n, r in ready.items() if r["samples"] == 0]
    only_pos = [n for n, r in ready.items() if r["type_noul"] and r["samples"] and not r["positives"]]
    no_neg = [n for n, r in ready.items() if r["type_noul"] and r["samples"] and r["positives"] == r["samples"]]
    print("逐轴可拟样本（noul 轴用拟合侧同一个判据算，不是这里另算一遍）：")
    for name, r in sorted(ready.items()):
        print(f"  {name:<26} 样本 {r['samples']:>4}  正 {r['positives']:>4}"
              if r["type_noul"] else f"  {name:<26} 带分布 {r['samples']:>4}")
    if dead:
        print(f"⚠ 这几题一条样本都拟不动：{', '.join(dead)}"
              "——拟合会直接跳过它们，温度表上不会出现这些轴。")
    if only_pos:
        print(f"⚠ 只有负样本（全 0）：{', '.join(only_pos)}——需要有人处置出这些条款才会出现正样本。")
    if no_neg:
        print(f"⚠ 只有正样本（全 1）：{', '.join(no_neg)}——标定无法学到这轴的假阳性。")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent / "moderation_labels.jsonl"))
    args = ap.parse_args()

    rows = asyncio.run(collect())
    with open(args.out, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"导出 {len(rows)} 条标注 → {args.out}")
    if not rows:
        print("提示：还没有「带类型化答案且已人工结案」的案件。"
              "需要先起 laya sidecar 跑出一批判断，再由运营处置，才有可拟合的样本。")
        return 0
    # 温度拟合按题型要的东西不同：noul 只要标量，choice/score 要整条分布。
    # 只报"有多少条标注"会让人以为可以重拟全部 9 题，其实可能一条轴都拟不动。
    with_probs = sum(
        1 for r in rows
        if any(isinstance(a, dict) and isinstance(a.get("probabilities"), dict)
               for a in (r["answers"] or {}).values())
    )
    print(f"其中带概率向量的 {with_probs} 条——age_rating / severity 只能从这些里重拟。")
    if with_probs == 0:
        print("这批导出全部来自「快照未存向量」的旧案件，二元轴之外拟不出任何东西。")
    report_readiness(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
