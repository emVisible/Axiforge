"""LLM service — unified entry with fallback and rate limiting."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Any, Deque, DefaultDict, Dict, List, Optional, Tuple

from app.config import settings
from app.domains.llm.registry import build_provider_chain
from app.domains.narrative.ai_draft import prose_to_script

_usage: DefaultDict[str, Deque[float]] = defaultdict(deque)


def _check_rate_limit(author_id: Optional[str]) -> None:
    if not author_id:
        return
    limit = settings.llm_daily_limit_per_creator
    if limit <= 0:
        return
    now = time.monotonic()
    window = 86400.0
    bucket = _usage[author_id]
    while bucket and bucket[0] <= now - window:
        bucket.popleft()
    if len(bucket) >= limit:
        raise ValueError("今日 AI 调用次数已达上限")
    bucket.append(now)


async def _run_with_fallback(
    operation: str,
    **kwargs: Any,
) -> Tuple[Any, str]:
    chain = build_provider_chain()
    last_error: Optional[Exception] = None
    for provider in chain:
        try:
            if operation == "suggest_character":
                result = await provider.suggest_character_layers(**kwargs)
            elif operation == "prose_to_axs":
                result = await provider.prose_to_axs(**kwargs)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            return result, provider.name
        except Exception as exc:
            last_error = exc
            continue
    if last_error:
        raise last_error
    raise RuntimeError("No LLM provider available")


async def suggest_character(
    *,
    name: str,
    essence: str = "",
    tags: Optional[List[str]] = None,
    author_id: Optional[str] = None,
) -> Dict[str, Any]:
    _check_rate_limit(author_id)
    layers, source = await _run_with_fallback(
        "suggest_character",
        name=name,
        essence=essence,
        tags=tags,
    )
    return {"layers": layers, "source": source}


async def prose_to_axs_with_source(
    *,
    prose: str,
    title: str = "未命名",
    role_names: Optional[List[str]] = None,
    default_speaker: str = "旁白",
    author_id: Optional[str] = None,
) -> Dict[str, str]:
    _check_rate_limit(author_id)
    axs, source = await _run_with_fallback(
        "prose_to_axs",
        prose=prose,
        title=title,
        role_names=role_names,
        default_speaker=default_speaker,
    )
    return {"axs": axs, "source": source}


async def prose_to_script_with_source(
    *,
    prose: str,
    role_names: Optional[List[str]] = None,
    author_id: Optional[str] = None,
) -> Dict[str, Any]:
    """散文 → 指令序列 + canonical 文本。

    规则路径在 Python 直接切句（切的是**散文**，不是 AXS 文本）；模型路径只回 canonical
    文本并置 `needs_parse=True`，由前端 `parseAxs` 解析——Python 没有 canonical AXS 解析器，
    原先用 `axs_to_script()` 把文本读回 IR 的做法是第二套解析器，已按 ADR-027 废除。
    """
    axs_result = await prose_to_axs_with_source(
        prose=prose,
        role_names=role_names,
        author_id=author_id,
    )
    source = axs_result["source"]
    if source == "rules":
        from app.domains.narrative.ai_draft import prose_to_script

        return {
            "script": prose_to_script(prose, role_names),
            "axs": axs_result["axs"],
            "source": source,
            "needs_parse": False,
        }
    return {
        "script": [],
        "axs": axs_result["axs"],
        "source": source,
        "needs_parse": True,
    }


async def health_status() -> Dict[str, Any]:
    chain = build_provider_chain()
    providers = []
    active = "rules"
    for provider in chain:
        ok = await provider.health_check()
        providers.append({"name": provider.name, "healthy": ok})
        if ok and provider.name != "rules" and active == "rules":
            active = provider.name
    return {
        "active_provider": active,
        "providers": providers,
        "mode": settings.llm_provider,
    }
