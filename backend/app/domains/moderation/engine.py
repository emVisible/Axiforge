"""引擎链：按成本顺序问，但便宜的引擎不许把贵的引擎挡掉。

参照实现的 `cascade()`（`engines.py:207-229`）是"第一个返回非 None 的引擎赢"，
顺序 `rules → laya:sidecar → jev → heuristic`。在 rules 几乎总返回 None 的设定下这没问题，
但只要前面的引擎表态了，后面的好引擎就永远轮不到——而"表了态"的可能是最弱那一层。

这里的规则只有一条：**非权威引擎的结论不终止链条**，它被记为 `prior` 继续往下问；
只有权威引擎给出结论，或者所有引擎都没结论，链才停。成本没有变差——
词表是本地纯函数（微秒级），继续往下问只在确实有可用模型时发生。
"""

from __future__ import annotations

import asyncio
import hashlib
import time
from collections import OrderedDict
from dataclasses import dataclass, field, replace
from typing import Dict, List, Optional, Sequence, Tuple

from app.domains.moderation.contracts import (
    ACTION_HUMAN,
    ModerationProvider,
    ModerationSubject,
    Policy,
    Verdict,
)
from app.domains.moderation.policy import gate
from app.domains.moderation.questions import QUESTIONS_VERSION

_CACHE_MAX = 512


@dataclass(frozen=True)
class Outcome:
    """一次裁决的完整可复现记录——落库的就是它。"""

    action: str
    via: str
    verdict: Verdict
    policy_version: str
    questions_version: str
    engines_tried: Tuple[str, ...] = ()
    prior_reasons: Tuple[str, ...] = ()
    #: 执行这条结论的引擎有没有不可逆动作的资格（gate 用它，落库也要留痕）
    authoritative: bool = False
    calibrated: bool = False
    dedupe_hit: bool = False
    created_at: float = field(default_factory=time.time)

    @property
    def confidence(self) -> float:
        return self.verdict.confidence

    @property
    def engine(self) -> str:
        return self.verdict.engine


def content_fingerprint(subject: ModerationSubject, policy: Policy,
                        model_versions: Tuple[str, ...]) -> str:
    """幂等键：同一内容 + 同一版策略与题集 + 同一版模型状态 = 同一个结论。

    参照实现在 REGISTRY 里给每个动作写了 `"idempotency": "required"`，
    但 `submit` 每次都发新 UUID，重复提交被静默重判。

    `model_versions` 是这条键里后补的一半：换了 checkpoint 或重拟了温度表之后，
    同一篇稿子的旧结论必须失效重判。少了它，"温度表改了"在缓存与幂等键上
    都是不可见的——旧结论会以新模型的名义继续被复用。
    它做成必填参数是有意为之：给一个默认空元组就等于允许"忘了传"，
    而忘了传的时候所有内容的键会退化到同一套旧语义上，且不会有任何报错。
    """
    sha = subject.content_sha256 or hashlib.sha256(subject.text.encode("utf-8")).hexdigest()
    raw = (f"{subject.kind}|{sha}|{policy.version}|{QUESTIONS_VERSION}"
           f"|{'>'.join(sorted(model_versions))}")
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _model_versions(providers: Sequence[ModerationProvider]) -> Tuple[str, ...]:
    """探测各引擎的模型状态指纹。探测失败不能让整个判定崩掉，也不能静默变成空串
    （那会让所有结论共享同一个键）——所以按引擎名标 unknown。"""
    out = []
    for p in providers:
        try:
            out.append(f"{p.name}={p.model_version()}")
        except Exception:
            out.append(f"{p.name}=unknown")
    return tuple(out)


class ModerationEngine:
    def __init__(
        self,
        providers: Sequence[ModerationProvider],
        policy: Optional[Policy] = None,
    ) -> None:
        self.providers = list(providers)
        self.policy = policy or Policy()
        self._cache: "OrderedDict[str, Outcome]" = OrderedDict()

    def availability(self) -> List[Tuple[str, bool, bool]]:
        """(引擎名, 是否健康, 是否权威)——中台 dashboard 的 engine 列就取这里。"""
        out = []
        for p in self.providers:
            try:
                out.append((p.name, bool(p.health_check()), bool(p.authoritative)))
            except Exception:  # 健康检查本身炸了也不要把整个中台带崩
                out.append((p.name, False, bool(getattr(p, "authoritative", False))))
        return out

    async def decide(self, subject: ModerationSubject) -> Outcome:
        policy = self.policy.resolved(subject.kind)
        key = content_fingerprint(subject, policy, _model_versions(self.providers))
        cached = self._cache.get(key)
        if cached is not None:
            self._cache.move_to_end(key)
            # 用 replace 而不是逐字段重建：逐字段写漏一个就静默变回默认值。
            # 这里原来漏了 authoritative 与 calibrated，于是"重复审同一篇"会被
            # 服务层读成"结论变了"（资格从 True 掉到 False），去重统计全错。
            return replace(cached, dedupe_hit=True)

        tried: List[str] = []
        prior: List[Verdict] = []
        chosen: Optional[Verdict] = None

        for provider in self.providers:
            tried.append(provider.name)
            try:
                # sidecar 客户端是阻塞 urllib，放线程里跑，别让它卡事件循环。
                # 这里是唯一该做这件事的位置：只有链知道哪个引擎会阻塞。
                verdict = await asyncio.to_thread(provider.moderate, subject)
            except Exception as exc:  # 单个引擎故障不影响链
                verdict = Verdict.abstain(provider.name, f"引擎异常：{type(exc).__name__}")
            if verdict.abstained:
                continue
            if provider.authoritative:
                chosen = verdict
                break
            # 非权威引擎：记下来继续问。它没有资格终止链条。
            prior.append(verdict)

        if chosen is None:
            # 没有任何权威引擎表态。词表命中就用它（结果仍是转人工），
            # 全都没话说则显式弃权——"没人说话"不能变成"通过"。
            chosen = prior[-1] if prior else Verdict.abstain(
                "chain", "所有引擎均弃权：默认转人工，绝不默认通过"
            )
            authoritative = False
        else:
            authoritative = True

        if prior and chosen not in prior:
            reasons = list(chosen.reasons) + [
                f"prior[{p.engine}]={p.action}:{';'.join(p.reasons[:2])}" for p in prior
            ]
            from dataclasses import replace as _replace

            chosen = _replace(chosen, reasons=reasons)

        action, via = gate(chosen, policy, authoritative=authoritative)
        outcome = Outcome(
            action=action, via=via, verdict=chosen, policy_version=policy.version,
            questions_version=QUESTIONS_VERSION, engines_tried=tuple(tried),
            prior_reasons=tuple(f"{p.engine}:{p.action}" for p in prior),
            authoritative=authoritative, calibrated=chosen.calibrated,
        )
        self._cache[key] = outcome
        if len(self._cache) > _CACHE_MAX:
            self._cache.popitem(last=False)
        return outcome
