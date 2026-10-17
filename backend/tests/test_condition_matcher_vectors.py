"""条件**匹配层**的跨实现共享向量（Python 这一半）。

2026-10-01 复审补上，补的是同一轮登记的那条欠账：`{"_value": x}` 单键解包在 TS 是一个
`unwrap` helper、在本模块对应的 `_match_memory` / `_match_flag` 里是**内联两份**——
形状不同、行为一致，而 `compare.json` 只锁了 `compare` 那一半。

**两侧的存储形状本来就不同，所以消费者各翻各的**：
TS 的 `vars.memory` / `vars.flags` 是**字典**（`key in vars`），
Python 侧的 `memories` / `flags` 是**行列表**（`for m in memories: if m.key == key`）。
本文件负责把向量那一行翻译成行对象——翻译只做形状转换，**不碰语义**。

向量里的 `stored` 是**存储形态本身**（即已经决定要不要包 `{"_value": …}`），
不是解包后的值；否则这条向量会把自己要锁的东西先假设掉。

**仍未锁的**（登记，不假装已锁）：`character_state` / `codex` / `relationship` 三个族——
形状更大（要连 `characters` 字典 / codex 账本 / 三段键一起定义）。
"""

import json
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from app.domains.runtime.service import PlayerService

VECTOR_PATH = (
    Path(__file__).resolve().parents[2] / "testdata" / "conditions" / "matcher.json"
)
_CASES: list[dict[str, Any]] = json.loads(
    VECTOR_PATH.read_text(encoding="utf-8")
)["matcherCases"]


@pytest.fixture(scope="module")
def session() -> PlayerService:
    """只用 `_match_memory` / `_match_flag`（除 db 外都是纯函数），所以绕过 `__init__`。"""
    return PlayerService.__new__(PlayerService)


def test_vector_is_not_empty() -> None:
    """分母守卫：向量被清空或路径写错时这条红，否则下面会"全绿"而一条都没跑。"""
    assert isinstance(_CASES, list)
    assert len(_CASES) >= 21


def _rows(case: dict[str, Any]) -> list[Any]:
    """翻译：把向量那一行变成 Python 侧要的**行列表**（只做形状转换）

    `absent` 时返回**空列表**——列表里放一行 `{key, value: null}` 测到的是「有行但值为 null」，
    不是「没有这一行」，而缺席那条兜底语义恰好只对后者成立。
    """
    if case.get("absent"):
        return []
    if case["source"] == "character_state":
        # 拆成「行属性 + custom_state 回退源」两处，正是这一族在 Python 侧的形状；
        # `chars` 里缺席的字段就**只**在 custom_state 里，读那一格时才能验到回退是否只在
        # 「真的没有」时发生（`or` 短路那个缺陷就死在这一格上）。
        cid = case["key"]
        attrs = dict(case.get("chars", {}).get(cid, {}))
        return [
            SimpleNamespace(
                character_id=cid,
                custom_state=dict(case.get("custom", {})),
                **attrs,
            )
        ]
    return [SimpleNamespace(key=case["key"], value=case["stored"])]


@pytest.mark.parametrize("case", _CASES, ids=[c["id"] for c in _CASES])
def test_matcher_matches_shared_vector(case: dict[str, Any], session: PlayerService) -> None:
    cond = case["condition"]
    rows = _rows(case)
    if case["source"] == "memory":
        got = session._match_memory(rows, cond["key"], cond["operator"], cond["value"])
    elif case["source"] == "flag":
        got = session._match_flag(rows, cond["key"], cond["operator"], cond["value"])
    elif case["source"] == "character_state":
        got = session._match_character_state(rows, cond["key"], cond["operator"], cond["value"])
    else:
        raise AssertionError(f"未知 source：{case['source']}")

    assert got is case["want"], (
        f"{case['id']}：{case['source']} 匹配返回 {got}，规格要 {case['want']}"
    )
