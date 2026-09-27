"""Prompt templates for structured AI outputs."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

# 散文→AXS 的提示词不在这里手写：它的内容就是 AXS 语法本身，
# 而语法的真相源是 packages/axs（ADR-027）。TS 与 Python 读同一份 JSON，
# 否则改了语法忘了改提示词，模型会开始静默吐上一代方言——
# AXS 对认不出的行的兜底是"当旁白"，diagnostics 为空，看不出已经漂了。
_AXS_PROMPT_FILE = (
    Path(__file__).resolve().parents[4] / "packages" / "axs" / "prompts" / "prose-to-axs.json"
)


@lru_cache(maxsize=1)
def _axs_prompt() -> dict:
    try:
        return json.loads(_AXS_PROMPT_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:  # 宁可启动即报错，也不要静默换成空提示词
        raise RuntimeError(
            f"缺少 AXS 提示词文件 {_AXS_PROMPT_FILE}；它随仓库分发，不在这里手写副本"
        ) from exc


def suggest_character_system() -> str:
    return (
        "你是视觉小说角色设定助手。根据输入生成六层角色 JSON，"
        "字段包含 anchor/contour/demeanor/psyche/trace/bond。"
        "只输出合法 JSON，不要 markdown 代码块。"
    )


def suggest_character_user(name: str, essence: str, tags: Optional[List[str]]) -> str:
    tag_text = "、".join(tags or []) or "无"
    return (
        f"角色名：{name}\n"
        f"概括：{essence or '待补充'}\n"
        f"标签：{tag_text}\n"
        "请填充六层结构，anchor 必须包含 name/essence/tags/summary。"
    )


def prose_to_axs_system() -> str:
    return _axs_prompt()["system"]


def prose_to_axs_user(
    prose: str,
    *,
    title: str,
    role_names: Optional[List[str]],
    default_speaker: str,
) -> str:
    roles = "、".join(role_names or []) or default_speaker
    return (
        _axs_prompt()["user_template"]
        .replace("{title}", title)
        .replace("{roles}", roles)
        .replace("{prose}", prose)
    )
