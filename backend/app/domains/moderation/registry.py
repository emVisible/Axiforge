"""审核引擎链装配（与 `llm/registry.py` 同构：按配置组链，兜底永远在链尾）。"""

from __future__ import annotations

from typing import List, Optional, Sequence

from app.config import settings
from app.domains.moderation.contracts import ModerationProvider, Policy
from app.domains.moderation.engine import ModerationEngine
from app.domains.moderation.providers.laya_sidecar import LayaSidecarEngine
from app.domains.moderation.providers.lexicon import LexiconEngine


def build_policy() -> Policy:
    return Policy(
        auto_approve_threshold=settings.moderation_auto_approve_threshold,
        auto_reject_threshold=settings.moderation_auto_reject_threshold,
        human_band=settings.moderation_human_band,
        version=f"policy-{settings.moderation_policy_revision}",
    )


def build_chain() -> List[ModerationProvider]:
    """顺序 = 成本顺序：本地词表先跑，sidecar 在后。

    与参照实现的两处不同：
    - **没有 `jev`。** ADR-018 要求"全部单体内轻量实现，不引外部服务"，
      而把用户作品正文发给 api.typesafe.ai 既是外部服务也是数据出境。
    - 词表在链首但**不权威**，所以它挡不住后面的模型（见 engine.py）。
    """
    chain: List[ModerationProvider] = [LexiconEngine()]
    if settings.moderation_enabled:
        chain.append(LayaSidecarEngine(base_url=settings.laya_sidecar_url))
    return chain


_default: Optional[ModerationEngine] = None


def get_engine(providers: Optional[Sequence[ModerationProvider]] = None) -> ModerationEngine:
    """进程内单例：词表无状态、sidecar 客户端也无状态，重建没有意义。"""
    global _default
    if providers is not None:
        return ModerationEngine(providers, build_policy())
    if _default is None:
        _default = ModerationEngine(build_chain(), build_policy())
    return _default


def reset_engine() -> None:
    """测试与热更配置用。"""
    global _default
    _default = None
