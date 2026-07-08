"""Prompt templates for structured AI outputs."""

from __future__ import annotations

from typing import List, Optional


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
    return (
        "你是 AXS 叙事脚本助手。将散文转为 AXS 文本。"
        "格式：标题行 # 标题；角色对白「角色：台词」；旁白直接写；"
        "选项以 > 开头；可用【背景】【音乐】【转场】等舞台指令。"
        "只输出 AXS 正文，不要解释。"
    )


def prose_to_axs_user(
    prose: str,
    *,
    title: str,
    role_names: Optional[List[str]],
    default_speaker: str,
) -> str:
    roles = "、".join(role_names or []) or default_speaker
    return f"标题：{title}\n可用角色：{roles}\n\n散文：\n{prose}"
