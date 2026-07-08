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
    axs_result = await prose_to_axs_with_source(
        prose=prose,
        role_names=role_names,
        author_id=author_id,
    )
    from app.domains.narrative.ai_draft import axs_to_script, prose_to_script

    script = prose_to_script(prose, role_names)
    if axs_result["source"] != "rules":
        try:
            script = axs_to_script(axs_result["axs"], role_names)
        except Exception:
            pass
    return {"script": script, "source": axs_result["source"]}


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
