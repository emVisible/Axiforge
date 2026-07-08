"""发布前轻量内容校验（规则引擎，ADR-018）。"""

from __future__ import annotations

import re
from typing import List

# 可扩展敏感词表；生产环境建议外置配置
_BLOCKED = frozenset({"违禁示例词"})

_TITLE_MIN = 1
_TITLE_MAX = 255


def validate_publish_text(title: str, description: str = "") -> List[str]:
    """返回错误列表；空列表表示通过。"""
    errors: List[str] = []
    t = (title or "").strip()
    if len(t) < _TITLE_MIN:
        errors.append("标题不能为空")
    if len(t) > _TITLE_MAX:
        errors.append("标题过长")
    blob = f"{title}\n{description}".lower()
    for word in _BLOCKED:
        if word in blob:
            errors.append(f"内容包含不允许的词汇")
            break
    if re.search(r"https?://[^\s]+", description or "", re.I):
        # 允许链接，仅示例规则位
        pass
    return errors


def validate_comment_body(body: str) -> List[str]:
    """评论正文校验。"""
    errors: List[str] = []
    text = (body or "").strip()
    if len(text) < 1:
        errors.append("评论不能为空")
    if len(text) > 4000:
        errors.append("评论过长")
    lower = text.lower()
    for word in _BLOCKED:
        if word in lower:
            errors.append("内容包含不允许的词汇")
            break
    return errors
