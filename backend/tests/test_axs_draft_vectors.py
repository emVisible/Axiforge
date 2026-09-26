"""共享 golden 向量的 Python 侧 runner（ADR-027）。

同一批 `testdata/axs-draft/*.json` 也被 `packages/axs` 的 vitest runner 消费：
那一侧验的是「产物能被 canonical 语法解析、且 print 回到自身」。
本文件因此**不是**拿 Python 自己的解析器自证——它只断言发射器 reproduces 手写的期望文本，
期望文本的合法性由 TS 侧的 canonical 解析器裁决。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.domains.narrative.ai_draft import prose_to_axs

VECTOR_DIR = Path(__file__).resolve().parents[2] / "testdata" / "axs-draft"

_VECTORS = [(p.stem, json.loads(p.read_text(encoding="utf-8"))) for p in sorted(VECTOR_DIR.glob("*.json"))]


def test_vector_dir_exists_and_is_populated():
    assert VECTOR_DIR.is_dir(), f"向量目录不存在：{VECTOR_DIR}"
    assert len(_VECTORS) >= 4, f"向量数量异常：{len(_VECTORS)}"


@pytest.mark.parametrize("name,data", _VECTORS, ids=[name for name, _ in _VECTORS])
def test_rules_emitter_reproduces_vector(name: str, data: dict):
    got = prose_to_axs(
        data["prose"],
        title=data["title"],
        role_names=data.get("role_names") or [],
        default_speaker=data.get("default_speaker", "旁白"),
    )
    assert got == data["axs"], f"{name}\n--- 期望 ---\n{data['axs']}\n--- 实得 ---\n{got}"
