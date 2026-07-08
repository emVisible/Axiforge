# --- from services/ai_draft.py ---
"""规则解析：散文/大纲 → 演出脚本草稿（v1.6 AI 辅助创作 MVP）"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

_SPEAKER_RE = re.compile(r"^([^\s：:]{1,20})[：:]\s*(.+)$")
_STAGE_RE = re.compile(r"^【(背景|音乐|旁白|转场|特效)[:：]?\s*(.*)】\s*(.*)$")
_CHOICE_RE = re.compile(r"^>\s*(.+)$")
_OPTION_SPLIT = re.compile(r"\s*[|｜/]\s*")


def prose_to_script(
    prose: str,
    role_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """把散文行解析为 Instruction dict 列表（结构化落点，创作者审改）。"""
    names = {n.strip() for n in (role_names or []) if n.strip()}
    script: List[Dict[str, Any]] = []
    pending_choice: Optional[List[str]] = None

    def flush_choice() -> None:
        nonlocal pending_choice
        if pending_choice:
            script.append(
                {
                    "op": "choice",
                    "options": [{"label": label} for label in pending_choice],
                }
            )
            pending_choice = None

    for raw in prose.splitlines():
        line = raw.strip()
        if not line:
            flush_choice()
            continue

        stage = _STAGE_RE.match(line)
        if stage:
            flush_choice()
            kind, arg, rest = stage.group(1), stage.group(2).strip(), stage.group(3).strip()
            if kind == "背景":
                script.append({"op": "bg", "image": arg or rest or "default"})
            elif kind == "音乐":
                script.append({"op": "bgm", "track": arg or rest or "", "loop": True})
            elif kind == "旁白":
                script.append({"op": "narration", "text": arg or rest})
            elif kind == "转场":
                script.append({"op": "transition", "kind": arg or "fade", "ms": 500})
            elif kind == "特效":
                script.append({"op": "fx", "effect": arg or "flash", "ms": 600})
            if rest and kind != "旁白":
                script.append({"op": "narration", "text": rest})
            continue

        if _CHOICE_RE.match(line):
            labels = _OPTION_SPLIT.split(_CHOICE_RE.match(line).group(1).strip())
            pending_choice = [l for l in labels if l]
            continue

        speaker = _SPEAKER_RE.match(line)
        if speaker:
            flush_choice()
            name, text = speaker.group(1), speaker.group(2)
            if names and name in names:
                script.append({"op": "say", "speaker": name, "text": text})
            elif names:
                script.append({"op": "narration", "text": f"{name}：{text}"})
            else:
                script.append({"op": "say", "speaker": name, "text": text})
            continue

        flush_choice()
        script.append({"op": "narration", "text": line})

    flush_choice()
    return script


def script_to_axs(
    title: str,
    script: List[Dict[str, Any]],
    *,
    default_speaker: str = "旁白",
) -> str:
    """把 Instruction dict 列表打印为 AXS 源文本。"""
    lines = [f"# {title.strip() or '未命名'}", ""]
    for item in script:
        op = item.get("op")
        if op == "say":
            speaker = item.get("speaker") or default_speaker
            lines.append(f"{speaker}: {item.get('text', '')}")
        elif op == "narration":
            lines.append(f"*{item.get('text', '')}*")
        elif op == "bg":
            lines.append(f"【背景 {item.get('image', 'default')}】")
        elif op == "bgm":
            lines.append(f"【音乐 {item.get('track', '')}】")
        elif op == "choice":
            for opt in item.get("options", []):
                label = opt.get("label", "") if isinstance(opt, dict) else str(opt)
                if label:
                    lines.append(f"> {label}")
        elif op == "transition":
            lines.append(f"【转场 {item.get('kind', 'fade')}】")
        elif op == "fx":
            lines.append(f"【特效 {item.get('effect', 'flash')}】")
        elif item.get("text"):
            lines.append(str(item["text"]))
    return "\n".join(lines).strip() + "\n"


def prose_to_axs(
    prose: str,
    *,
    title: str = "未命名",
    role_names: Optional[List[str]] = None,
    default_speaker: str = "旁白",
) -> str:
    script = prose_to_script(prose, role_names)
    return script_to_axs(title, script, default_speaker=default_speaker)


def axs_to_script(
    axs: str,
    role_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """把 AXS 源文本解析为 Instruction dict 列表。"""
    normalized: List[str] = []
    for raw in axs.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("*") and line.endswith("*") and len(line) > 2:
            normalized.append(line[1:-1])
        else:
            normalized.append(line)
    return prose_to_script("\n".join(normalized), role_names)


def suggest_character_layers(
    name: str,
    essence: str = "",
    tags: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """六层角色 AI 填充建议（规则模板，可后续换 LLM）。"""
    tag_hint = "、".join(tags or []) or "原创"
    mood = essence or f"围绕「{name}」展开的角色"
    return {
        "anchor": {
            "name": name,
            "essence": essence or f"{name}的核心矛盾尚待揭示",
            "tags": tags or [],
            "summary": mood[:48],
        },
        "contour": {
            "identity": f"与{tag_hint}相关的{('神秘' if '神秘' in mood else '鲜明')}存在",
            "first_impression": "让人想多了解一句",
            "appearance": "外貌待补充",
            "age_era": "年龄感模糊",
        },
        "demeanor": {
            "speech_style": "措辞克制，偶尔流露真实情绪",
            "typical_reaction": "先观察，再回应",
        },
        "psyche": {
            "desire": "被理解或被认可",
            "fear": "失去重要之人或被遗忘",
            "conflict": mood[:80],
        },
        "trace": {
            "background": f"与「{essence or name}」相关的过往尚未完全揭开",
        },
        "bond": {
            "attitude_to_others": "对陌生人保持距离，对信任者格外真诚",
        },
    }
