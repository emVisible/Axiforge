"""D3 的前置探针：单选题能不能治好"七条 noul 一起饱和"。

为什么单独一个脚本而不是改 `questions.py`：判断层的题集一旦换版（questions-3），
所有已测过的行为、温度表与幂等键都跟着动。而**假设本身**不需要那些前提就能量——
同一个 sidecar、同一段文本，多问一题 choice 就行。数字站得住再提升为生产题集。

被对比的两种条款归属方式，输入是同一批模型输出：
  · noul 侧：七条独立概率取最大（≥0.5 才算有；全低=none）——这就是生产现在的做法
  · choice 侧：九档单选（八条款 + "无问题"），各档互斥地竞争同一个概率额度

判据（写死，不看顺眼就算过）：`primary_clause` 的命中率。
标签用 `moderation_samples.jsonl` 的 `clauses`；多条款样本取其第一条作为"最主要"，
这条约定对两种方法一视同仁，所以横向可比。

用法：
    LAYA_SIDECAR_URL=http://127.0.0.1:8685 backend/.venv/bin/python eval/choice_probe.py
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

from app.domains.moderation.questions import (  # noqa: E402
    BOOL_QUESTIONS, clause_for,
)
from eval.moderation_eval import load_samples  # noqa: E402

SIDECAR = os.environ.get("LAYA_SIDECAR_URL", "http://127.0.0.1:8685")

#: choice 的档位描述**复用 noul 题面的原文**，不另起一套措辞——
#: 两套词汇表迟早会长成两个含义，而这里要比的只是"互斥还是独立"这一个变量。
_NONE = "none"


def probe_questions() -> Dict[str, dict]:
    criteria = {clause_for(n): q for n, q in
                ((n, _instruction(n)) for n in BOOL_QUESTIONS)}
    criteria[_NONE] = "没有上述任何问题：正常创作内容或正常交流"
    return {
        "primary_clause": {"type": "choice",
                           "instructions": "这篇内容最主要的一个问题属于哪一类？只选一个。",
                           "criteria": criteria},
        **{n: {"type": "noul", "instructions": _instruction(n)} for n in BOOL_QUESTIONS},
    }


_INST_CACHE: Dict[str, str] = {}


def _instruction(name: str) -> str:
    if not _INST_CACHE:
        from app.domains.moderation.questions import build_questions
        for k, v in build_questions().items():
            _INST_CACHE[k] = v["instructions"]
    return _INST_CACHE[name]


def ask(title: str, body: str, kind: str) -> dict:
    req = urllib.request.Request(
        SIDECAR + "/decide",
        data=json.dumps({"state": {"kind": kind, "title": title, "body": body},
                         "questions": probe_questions(), "calibrate": False},
                        ensure_ascii=False).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    if not data.get("ok"):
        raise SystemExit(f"sidecar 失败：{data.get('error')}")
    return data["answers"]


def want_clause(row: dict) -> str:
    clauses = row.get("clauses") or []
    return clauses[0] if clauses else _NONE


def noul_pick(answers: dict) -> Tuple[str, float]:
    best, best_p = _NONE, 0.0
    for n in BOOL_QUESTIONS:
        p = float((answers.get(n) or {}).get("noul") or 0.0)
        if p > best_p:
            best, best_p = clause_for(n), p
    return (best if best_p >= 0.5 else _NONE), best_p


def bands(samples: List[Tuple[str, str, float]]) -> str:
    """按预测置信度分层的命中率（风险-覆盖曲线）。

    "整体 52.9%" 不能用来决定能不能自动执行——自动动作只发生在它特别有把握的那一档，
    所以要问的是那一档里错几条。n=34 时每档都是个位数，只当方向看。
    """
    lines = []
    for lo in (0.5, 0.7, 0.8, 0.9):
        picked = [s for s in samples if s[2] >= lo]
        if not picked:
            lines.append(f"    >={lo}: 无样本")
            continue
        hit = sum(1 for c, w, _ in picked if c == w)
        # 拆开报，因为两个方向的动作与代价完全不同：判成"有问题"会被驳回（误伤作者），
        # 判成"没问题"会被自动放行（漏放违规）。合成一个数字就看不出哪个还能用。
        bad = [s for s in picked if s[0] != _NONE]
        clean = [s for s in picked if s[0] == _NONE]
        bad_hit = sum(1 for c, w, _ in bad if c == w)
        clean_hit = sum(1 for c, w, _ in clean if c == w)
        lines.append(
            f"    >={lo}: {hit}/{len(picked)} = {hit/len(picked):.0%}"
            f" ｜ 判有问题 {bad_hit}/{len(bad)}"
            + (f" = {bad_hit/len(bad):.0%}" if bad else "")
            + f" ｜ 判干净 {clean_hit}/{len(clean)}"
            + (f" = {clean_hit/len(clean):.0%}" if clean else ""))
    return "\n".join(lines)


def main() -> int:
    rows = load_samples()
    rec: List[Tuple[str, str, float]] = []      # (choice 预测, 标签, 该档概率)
    noul_rec: List[Tuple[str, str, float]] = []
    b_only = c_only = 0                          # 配对不一致里各自正确的条数
    for row in rows:
        ans = ask(row.get("title", ""), row.get("body", ""), row["kind"])
        want = want_clause(row)
        n_pick, n_p = noul_pick(ans)
        ch = ans.get("primary_clause") or {}
        c_pick = ch.get("choice") or _NONE
        flag = "" if c_pick == n_pick else "  ← 两者不一致"
        rec.append((c_pick, want, float((ch.get("probabilities") or {}).get(c_pick) or 0.0)))
        noul_rec.append((n_pick, want, max(n_p, 0.0)))
        ok_c, ok_n = c_pick == want, n_pick == want
        b_only += int(ok_c and not ok_n)
        c_only += int(ok_n and not ok_c)
        print(f"{row['id']:<16} want={want:<20} noul={n_pick:<20}({n_p:.2f}) "
              f"choice={c_pick:<20}({float((ch.get('probabilities') or {}).get(c_pick) or 0):.2f}){flag}")
    n = len(rows)
    ch_hits = sum(1 for c, w, _ in rec if c == w)
    no_hits = sum(1 for c, w, _ in noul_rec if c == w)
    print(f"\n条款归属命中率（n={n}）：noul argmax {no_hits/n:.1%}  |  单选 choice {ch_hits/n:.1%}")
    print(f"配对不一致：只有单选对 {b_only} 条 ｜ 只有 noul 对 {c_only} 条"
          f" ｜ 两法同错/同对 {n - b_only - c_only} 条")
    print("单选按置信度分层：")
    print(bands(rec))
    print("noul 同口径对照：")
    print(bands(noul_rec))
    print("\n读法：能不能自动执行只看高置信那一档错多少；整体命中率只回答"
          "这道题值不值得进生产题集。n=34 时每档都是个位数，只当方向看。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
