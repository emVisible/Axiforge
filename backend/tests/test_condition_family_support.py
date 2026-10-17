"""条件**族支持清单**（Python 这一半）——`testdata/conditions/families.json`。

2026-10-01 复审量出来的：TS `conditions.ts` 求值 **7 族**，而本模块对应的
`PlayerService` 只求值 **4 族**（`memory` / `flag` / `character_state` / `node_completed`），
`relationship` / `achievement` / `codex` 落到函数末尾的 `return False`。

**后果**：同一份 AXS 在两端行为不同——被 `[if: relationship …]` 门控的分支，
在 TS 引擎（桌面 / 浏览器）会打开，经后端播放时**永远打不开**，而两边都报成功、零诊断。

**为什么不把后三族补进来**：那个后端正在退场（ADR-029 桌面唯一化、S13-6 删 `backend/`），
给将死的后端加功能等于**扩大删除面**。TS 是对的一侧。

**本文件是绊线，不是「谁该支持」的规格**：断言"这些族当前返回 False"，
于是有人真去实现某一族时**这条会红**，逼他同时更新 `families.json` 与 ADR/S13-6
——**分叉要变成一次显式决定，而不是一个安静的洞**。
"""

import json
from pathlib import Path
from typing import Any

import pytest

from app.domains.runtime.service import PlayerService

VECTOR_PATH = (
    Path(__file__).resolve().parents[2] / "testdata" / "conditions" / "families.json"
)
_INVENTORY: dict[str, Any] = json.loads(VECTOR_PATH.read_text(encoding="utf-8"))
_FAMILIES: list[dict[str, str]] = _INVENTORY["families"]


@pytest.fixture(scope="module")
def session() -> PlayerService:
    return PlayerService.__new__(PlayerService)


def test_inventory_is_not_empty() -> None:
    assert len(_FAMILIES) >= 7


def test_group_types_match_between_sides() -> None:
    """组类型两端一致（曾怀疑 TS 用 not、Python 用 none——实测都是 none）。"""
    assert sorted(_INVENTORY["groupTypes"]["ts"]) == sorted(
        _INVENTORY["groupTypes"]["python"]
    )


@pytest.mark.parametrize(
    "row", [r for r in _FAMILIES if r["python"] == "false"],
    ids=[f"{r['type']}（清单声明 Python 不求值）" for r in _FAMILIES if r["python"] == "false"],
)
def test_family_currently_falls_through_to_false(
    row: dict[str, str], session: PlayerService
) -> None:
    """**当前**行为：未实现的族静默求值为假。

    绊线：真去实现它时本条会红，届时请连同 `families.json` 与 ADR/S13-6 一起更新。
    """
    cond = row["probe"]["cond"]
    got = session._evaluate_condition(
        cond, memories=[], flags=[], character_states=[], completed_node_ids=set()
    )
    assert got is False, (
        f"{row['type']}：清单声明 Python 侧不求值（应静默为假），实测返回 {got}。"
        f"若你刚实现了这一族，请同步更新 testdata/conditions/families.json 与 ADR/S13-6。"
    )
