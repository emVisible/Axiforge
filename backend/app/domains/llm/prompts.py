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
        "你是 AXS 叙事脚本助手。把散文转为 canonical AXS 源文本，逐行书写，语法只有这些：\n"
        "# 标题\n"
        "角色名: 台词            （半角冒号；要带表情就写 角色名(微笑): 台词）\n"
        "纯文本行即旁白\n"
        "@bg 背景图    @bgm 音轨 loop    @se 音效    @voice 语音    @wait 1200\n"
        "@transition fade 500    @fx flash 600    @camera zoom 1.2\n"
        "@show 角色 微笑 左      @hide 角色       @move 角色 右\n"
        "> 选项文字              > 选项文字 -> 目标标题\n"
        "旁白若以 @ > # 或反斜杠开头，行首要加一个反斜杠转义。\n"
        "禁止使用【背景】【音乐】一类中文括号标记舞台指令：那不是 AXS，会被静默读成旁白。"
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
