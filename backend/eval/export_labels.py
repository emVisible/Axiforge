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

#: 人工结论 → 期望动作。dismissed 表示"机器报错了"，即该内容其实可放行。
OUTCOME_TO_EXPECTED = {"resolved": "reject", "dismissed": "approve"}


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
        out.append(
            {
                "case_id": str(r.id),
                "subject_type": r.subject_type,
                "subject_id": r.subject_id,
                "engine": r.engine,
                "answers": r.answers,
                "expected": OUTCOME_TO_EXPECTED.get(r.state, "human_review"),
                "human_state": r.state,
                "policy_version": r.policy_version,
                "questions_version": r.questions_version,
                "calibrated_at_decide": r.calibrated,
            }
        )
    return out


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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
