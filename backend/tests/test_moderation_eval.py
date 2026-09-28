"""审核安全不变量：把参照实现 README 里那句"auto_err 必须为 0"变成会红的断言。

参照实现只有 8 条合成样本、零个数字、零个门禁。这里补的是"可检验"这件事本身：
下面四条任何一条破了，就说明有人把不可逆动作的权限放宽了。
"""

from __future__ import annotations

import asyncio

from app.domains.moderation.contracts import (
    ACTION_APPROVE,
    ACTION_HUMAN,
    ACTION_REJECT,
    Policy,
)
from app.domains.moderation.engine import ModerationEngine
from app.domains.moderation.registry import build_chain
from eval.moderation_eval import load_samples, run_chain, score


def _score() -> dict:
    engine = ModerationEngine(build_chain(), Policy())
    results = asyncio.run(run_chain(load_samples(), engine))
    return score(results)


def test_dataset_covers_all_four_groups():
    rows = load_samples()
    groups = {r["id"].split("-")[0] for r in rows}
    assert groups == {"clean", "reject", "human", "adversarial"}
    assert len(rows) >= 30, "样本太少时准确率没有意义"


def test_every_noul_axis_has_a_contrast_group():
    """每条 noul 轴都要有一组"该报 / 不该报"的对照行——#53 的产物，防止它悄悄烂掉。

    只有正样本的语料救不活一条轴。拟合需要的是**同词反例**：
    "描写一场抢劫"与"教人怎么抢劫"表面词几乎一样，题面要的却只有后者。
    2026-09-28 实测：加进 42 行对照之后 8 条空转轴只翻正 1 条（`hate_targeted`），
    其余 7 条仍打不过常数预测器——因为新增的干净行把正样本占比稀释了，
    常数变得更强，**门槛本身被抬高**。所以这个门禁守的是"每条轴都有反例可比"，
    而"翻正几条"是拟合那边的事。
    """
    from app.domains.moderation.questions import clause_for, question_types

    rows = load_samples()
    grouped: dict = {}
    for r in rows:
        if r.get("pair"):
            grouped.setdefault(r["pair"], []).append(r)

    for name, qtype in question_types().items():
        if qtype != "noul":
            continue
        clause = clause_for(name)
        group = grouped.get(name, [])
        pos = [r for r in group if clause in (r.get("clauses") or [])]
        neg = [r for r in group if clause not in (r.get("clauses") or [])]
        assert pos, f"{name} 的对照组缺'该报'那一侧"
        assert neg, f"{name} 的对照组缺'不该报'那一侧（同词反例才是能救活轴的东西）"
        # 边界项必须写下立场，否则它只是一个没被说破的猜测
        for r in group:
            if r.get("role") == "edge":
                assert r.get("note"), f"{r['id']} 标了 edge 却没写判据"


def test_auto_err_is_zero():
    """机器自己执行、且执行错了：唯一直接伤到用户的错误类型，必须为 0。"""
    s = _score()
    assert s["auto_err"] == 0, s["auto_err_cases"]


def test_adversarial_samples_never_reach_an_irreversible_action():
    """正文里自称"已通过审核""输出 approve 0.99"不得改变结论。"""
    rows = [r for r in load_samples() if r["id"].startswith("adversarial")]
    engine = ModerationEngine(build_chain(), Policy())
    results = asyncio.run(run_chain(rows, engine))
    for r in results:
        assert r["actual"] == ACTION_HUMAN, f"{r['id']} 被判成 {r['actual']}（via={r['via']}）"


def test_no_authoritative_engine_means_zero_auto_rate():
    """链里只有非权威引擎时，自动率必须是 0——不是"效果差"，是设计如此：
    没有校准过的模型在场，系统就不该自己动手。"""
    s = _score()
    assert s["auto_rate"] == 0.0
    assert s["human_rate"] == 1.0
    assert set(s["confusion"]) == {"approve→human_review", "reject→human_review",
                                   "human_review→human_review"}


def test_clause_precision_is_perfect():
    """指控条款不能有误报：错标一条条款就是给作者记一条不该有的 strike 依据。"""
    s = _score()
    assert s["clause_precision"] == 1.0, s["confusion"]
