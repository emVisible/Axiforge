"""条件比较的**跨实现共享向量**（Python 这一半）。

2026-10-01 复审补上。起因是一个**零覆盖的孪生实现**：`_compare` 的语义在两个后端各手写一份——
TS `packages/core/src/conditions.ts::compare`（有判据，37 条）与本文件对应的
`PlayerService._compare`（**此前一条判据都没有**，而它被 `_match_memory` / `_match_flag` /
`_match_character_state` 三个分支调用）。上一轮修 `>=` / `<=` 缺失时，Python 那一侧只能靠
「用 `.venv` 直调一次取数」来验——**取过数不等于有判据**，下一次谁动它仍然无人拦。

做法沿用本仓已确立的模式（先例：`testdata/axs-draft/*.json` 被 `packages/axs` 与
`backend/tests/test_axs_draft_vectors.py` 同跑）：**一份向量、两个消费者**。

**权威不归任何一侧**：向量每条写死 `want`，只收答案无歧义的形状，所以它是规格。
本文件**不**断言"与 TS 一致"这种说法（那需要把 TS 拉进进程），而是各自对同一份规格负责——
两份实现同时错到同一个值上的概率低，而规格本身由人写并可读。
"""

import json
from pathlib import Path
from typing import Any

import pytest

from app.domains.runtime.service import PlayerService

VECTOR_PATH = (
    Path(__file__).resolve().parents[2] / "testdata" / "conditions" / "compare.json"
)
_CASES: list[dict[str, Any]] = json.loads(
    VECTOR_PATH.read_text(encoding="utf-8")
)["cases"]


@pytest.fixture(scope="module")
def session() -> PlayerService:
    """只用到 `_compare`（纯函数），所以绕过 `__init__` 不建 DB 会话。"""
    return PlayerService.__new__(PlayerService)


def test_vector_is_not_empty() -> None:
    """分母守卫：向量被清空或路径写错时这条红，否则下面会"全绿"而一条都没跑。"""
    assert isinstance(_CASES, list)
    assert len(_CASES) >= 30


@pytest.mark.parametrize("case", _CASES, ids=[c["id"] for c in _CASES])
def test_compare_matches_shared_vector(case: dict[str, Any], session: PlayerService) -> None:
    got = session._compare(case["actual"], case["operator"], case["expected"])
    assert got is case["want"], (
        f"{case['id']}：_compare({case['actual']!r}, {case['operator']!r}, "
        f"{case['expected']!r}) = {got}，规格要 {case['want']}"
    )
