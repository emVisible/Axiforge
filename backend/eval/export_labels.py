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

# 换算规则在 domain 里（`app.domains.moderation.labels`），这里只搬运不重定义：
# 面板报的「有几个可拟样本」与导出／拟合实际拿到的条数，必须是同一个函数算出来的。
from app.domains.moderation.labels import case_payload  # noqa: E402


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
    kinds = [r.get("label_kind") for r in rows]
    explicit = sum(1 for k in kinds if k == "explicit")
    print(f"标注来源：逐轴勾过 {explicit} 条 · 沿用机器条款 {len(rows) - explicit} 条")
    if explicit == 0:
        print("⚠ 全部是「沿用机器条款」：这批数据里没有一条是人逐轴确认过的，"
              "正样本只能覆盖机器自己想到的轴，拟出的温度偏乐观。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
