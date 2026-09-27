"""拟合各题温度 T：持出 NLL 最小，产出 `eval/calibration.json` 供 sidecar 热加载。

    MODERATION_ENABLED=true LAYA_SIDECAR_URL=http://127.0.0.1:8685 \
      backend/.venv/bin/python eval/calibrate.py

为什么这一步是"自动判断"的真正前提：`gate()` 的第 4 道检查是"未校准不可执行"。
链里有权威引擎、答案全都合法、阈值放到 0.80 也照样 auto_rate=0——因为
`0.9` 与 `0.5` 在没有标定之前不是同一个量。这份脚本把这个量造出来。

与参照实现（`Clearance/eval/calibrate.py`）的四点差别：

1. 题目按 Axiforge 的题集（`questions.build_questions`），不是客服工单的六个键。
2. 标签来自**条款**而不是 expected：`clauses` 里出现该轴对应的条款才记 1，
   `expected==reject` 但某条轴不在 clauses 里记 0。参照实现用
   `expected==reject → 所有轴=1`，等于把"这条内容有问题"当成"每条轴都有问题"。
3. 二元轴按**条款**取标签并把 `human_review` 行算进来，量级轴（severity）才跳过它们；
   并且**逐题**判断样本是否两边都有，只有一边的题不写进表——
   写进去就是一个假的 T，而门控只看有没有表。
4. 报告 leave-one-out 持出 NLL。参照实现报的是同一批样本上的 in-sample NLL，
   在 n=24 时那几乎一定能"改善"，于是把过拟合读成了标定成功。
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("TESTING", "1")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sidecar"))
from calibration import (  # noqa: E402
    fit_temperature_binary,
    fit_temperature_categorical,
    nll_binary,
    scale_categorical,
)

from app.domains.moderation.questions import (  # noqa: E402
    BOOL_QUESTIONS,
    build_questions,
    clause_for,
)
from eval.moderation_eval import load_samples  # noqa: E402

SIDECAR = os.environ.get("LAYA_SIDECAR_URL", "http://127.0.0.1:8685")
OUT = Path(__file__).resolve().parent / "calibration.json"
MIN_ROWS = 4


def ask(kind: str, title: str, body: str, questions: dict) -> dict:
    """取**未标定**的原始分布：calibrate=False，否则是在已缩放的分布上再拟合一次。"""
    req = urllib.request.Request(
        SIDECAR + "/decide",
        data=json.dumps({"state": {"kind": kind, "title": title, "body": body},
                         "questions": questions, "calibrate": False},
                        ensure_ascii=False).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.load(r)
    except Exception as e:
        print(f"ERROR: sidecar 不可达（{e}）。先起 backend/sidecar/server.py，无模型拟合无意义。")
        raise SystemExit(1)
    if not res.get("ok"):
        print(f"ERROR: sidecar 失败：{res.get('error')}")
        raise SystemExit(1)
    return res["answers"]


def collect(questions: dict) -> List[Tuple[dict, dict]]:
    out = []
    for row in load_samples():
        out.append((row, ask(row["kind"], row.get("title", ""), row.get("body", ""), questions)))
    return out


def binary_pairs(samples, name: str) -> List[Tuple[float, int]]:
    """某条 noul 轴的 (概率, 标签)。标签来自条款，不是来自 expected。

    `human_review` 的行**要计入**：它的动作需要人判断，但"这段里有没有性描写"
    是一个有确定答案的事实（human-03 的 sexual_explicit 就是 1）。
    参照实现按 expected 打标签，等于把"这条内容有问题"当成"每条轴都有问题"，
    于是只在人工类里出现的轴（性、血腥）永远是 0 个正样本——永远标定不了。
    """
    clause = clause_for(name)
    pairs = []
    for row, answers in samples:
        if "clauses" not in row:
            continue  # 没有条款标注的行不能凭空当成"七条轴都不存在"
        ans = (answers.get(name) or {})
        if "noul" not in ans:
            continue
        pairs.append((float(ans["noul"]), 1 if clause in (row.get("clauses") or []) else 0))
    return pairs


def categorical_rows(samples, name: str, label_of) -> List[Tuple[dict, str]]:
    rows = []
    for row, answers in samples:
        ans = (answers.get(name) or {})
        probs = ans.get("probabilities")
        label = label_of(row)
        if not isinstance(probs, dict) or label is None:
            continue
        rows.append(({str(k): float(v) for k, v in probs.items()}, str(label)))
    return rows


def loo_binary(pairs: List[Tuple[float, int]]) -> Tuple[float, float]:
    """留一持出：每次用其余样本拟合 T，只在这一条上算 NLL。

    `nll_binary` 内部已按条数取平均，单条传入就是这一条的 NLL。
    """
    if len(pairs) < 2:
        return float("nan"), float("nan")
    total = 0.0
    Ts: List[float] = []
    for i, pair in enumerate(pairs):
        T, _, _ = fit_temperature_binary(pairs[:i] + pairs[i + 1:])
        Ts.append(T)
        total += nll_binary([pair], T)
    return total / len(pairs), sum(Ts) / len(Ts)


def main() -> int:
    questions = build_questions()
    samples = collect(questions)
    print(f"取到 {len(samples)} 条原始分布（sidecar 未标定路径）")

    table: Dict[str, dict] = {}
    for name in BOOL_QUESTIONS:
        pairs = binary_pairs(samples, name)
        pos = sum(1 for _, y in pairs if y == 1)
        if len(pairs) < MIN_ROWS or pos == 0 or pos == len(pairs):
            print(f"  {name:<24} 跳过（n={len(pairs)} 正={pos}）——不写进表，门控据此保持不可执行")
            continue
        T, before, after = fit_temperature_binary(pairs)
        loo, _ = loo_binary(pairs)
        table[name] = {"T": T, "n": len(pairs), "pos": pos,
                       "nll_in_before": round(before, 4), "nll_in_after": round(after, 4),
                       "nll_loo": round(loo, 4)}
        print(f"  {name:<24} T={T:<5} n={len(pairs):<3} 正={pos:<3} "
              f"in {before:.3f}→{after:.3f}  持出 {loo:.3f}")

    for name, label_of in (
        ("age_rating", lambda r: r.get("rating")),
        ("severity", lambda r: {"approve": 0, "reject": 2}.get(r["expected"])),
        # 单选条款的真值 = 该行"最主要的那一条"，约定取 clauses 的第一条
        # （与 eval/choice_probe.py 同一约定，两处必须一致，否则拟合与评测量的不是同一件事）。
        ("primary_clause", lambda r: (r.get("clauses") or ["none"])[0]),
    ):
        rows = categorical_rows(samples, name, label_of)
        if len(rows) < MIN_ROWS:
            print(f"  {name:<24} 跳过（n={len(rows)}）")
            continue
        T, before, after = fit_temperature_categorical(rows)
        loo_rows = [rows[:i] + rows[i + 1:] for i in range(len(rows))]
        loo = sum(scale_categorical(p, t, fit_temperature_categorical(rest)[0])[1] / len(rows)
                  for (p, t), rest in zip(rows, loo_rows))
        table[name] = {"T": T, "n": len(rows),
                       "nll_in_before": round(before, 4), "nll_in_after": round(after, 4),
                       "nll_loo": round(loo, 4)}
        print(f"  {name:<24} T={T:<5} n={len(rows):<3} in {before:.3f}→{after:.3f}  持出 {loo:.3f}")

    if not table:
        print("\n没有任何一题可标定：不写表。空表比假表好——门控会继续转人工。")
        return 1

    OUT.write_text(json.dumps(table, ensure_ascii=False, indent=2), encoding="utf-8")
    covered = sorted(table)
    missing = sorted(set(questions) - set(covered))
    print(f"\n写入 {OUT}（覆盖 {len(covered)}/{len(questions)} 题）")
    if missing:
        print(f"  未覆盖：{'、'.join(missing)} —— 客户端会因此判定整链未标定，仍转人工。")
    print("  注意：这是 34 行单人标注集上的拟合，持出 NLL 也只是留一，不是生产可用。")
    print("  生产温度表要用 eval/export_labels.py 导出的人工处置记录重拟。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
