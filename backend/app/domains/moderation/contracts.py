"""审核判断层的公共契约（ADR-028 落地 ADR-018:24 预留的 `ModerationProvider` 接口）。

为什么存在这个文件：中台的判断能力此前只有 `core/content_validate.py` 里一个占位词表
（`_BLOCKED = {"违禁示例词"}`），而 ADR-018 承诺的 `ModerationProvider` 接口从未落地。
参照实现 Clearance 有完整的判断管线，却把结论写死在扁平文件与一个 import 期绑定的常量上。
这里把两者接起来：接口按 ADR-018 的命名，管线按可审计、可复现的要求重写。

四条来自参照实现缺陷的硬规则（每条都在测试里有对应用例）：

1. **答案白名单**：模型给出的类别/概率不在声明的取值域内时，一律**弃权**而不是
   落到默认值。参照实现 `engines.py:55` 把不认识的 choice 兜成 `"other"`，
   而 `"other"` 在它的决策梯里通向 AUTO_APPROVE——被注入或幻觉一次就等于放行一次。
2. **非权威引擎不得执行不可逆动作**：确定性词表引擎只能"升级给人工"，
   永远不能自动通过或自动驳回。参照实现的兜底引擎用 0.88/0.86 越过 0.85 的门
   直接 AUTO_REJECT（约十个关键词的杀伤力），却把放行压到 0.60——最弱的引擎
   握着不可逆的否决权。
3. **阈值在调用期解析**，不按 kind 之外的粒度在 import 期冻结，且随决策一起落档，
   这样"当时用的哪条线"是可复现的。
4. **每次决策记录 policy/questions/lexicon 三个版本号**——没有版本号就无法复现，
   也无法做提示词与词表的 A/B。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Protocol, runtime_checkable

# ---------- 结论取值域（封闭集合：不在集合内的输入一律不产生动作） ----------

ACTION_APPROVE = "approve"
ACTION_REJECT = "reject"
ACTION_HUMAN = "human_review"
ACTIONS = (ACTION_APPROVE, ACTION_REJECT, ACTION_HUMAN)


@dataclass(frozen=True)
class ModerationSubject:
    """被判断的东西。

    `content_sha256` 是幂等键的一部分：同一份内容 + 同一版策略不该被重复裁决
    （参照实现在 REGISTRY 里声明了 `"idempotency": "required"` 却从不执行它）。
    """

    kind: str                    # project | character | comment | asset
    object_id: str
    title: str
    body: str
    author_id: str = ""
    content_sha256: str = ""
    meta: Dict[str, object] = field(default_factory=dict)

    @property
    def text(self) -> str:
        return f"{self.title}\n{self.body}".strip()


@dataclass(frozen=True)
class Answer:
    """一条类型化问题的答案。

    `raw` 保留模型原样返回值，供审计复现；`value` 是过白名单之后的规范化值。
    """

    question: str
    qtype: str                  # choice | score | noul
    value: object
    confidence: float
    raw: object


@dataclass(frozen=True)
class Verdict:
    """一个引擎的完整裁决。`abstained=True` 表示这个引擎放弃表态（交给链上下一个）。"""

    action: str = ACTION_HUMAN
    confidence: float = 0.0
    engine: str = ""
    reasons: List[str] = field(default_factory=list)
    clause_ids: List[str] = field(default_factory=list)
    answers: Dict[str, Answer] = field(default_factory=dict)
    latency_ms: int = -1
    calibrated: bool = False
    abstained: bool = False
    error: str = ""

    @staticmethod
    def abstain(engine: str, reason: str) -> "Verdict":
        return Verdict(engine=engine, abstained=True, reasons=[reason])


@runtime_checkable
class ModerationProvider(Protocol):
    """ADR-018:24 预留的审核接口。

    与参照实现的关键差别是 `authoritative`：它声明"这个引擎有没有资格执行不可逆动作"。
    自动通过与自动驳回都是不可逆的用户侧后果（作品从公开变不可见、作者吃 strike），
    所以只有经过校准的模型引擎才有这个资格；确定性词表永远没有。

    `moderate` 是**同步**方法：sidecar 客户端用标准库 urllib（阻塞），
    在 FastAPI 里由 service 层用 `asyncio.to_thread` 包一层调用。
    把它标成 async 只会让人以为内部是非阻塞的——那是假承诺。
    """

    name: str
    authoritative: bool

    def health_check(self) -> bool:
        ...

    def moderate(self, subject: ModerationSubject) -> Verdict:
        ...


@dataclass(frozen=True)
class Policy:
    """调用期解析的门控参数（不在 import 期冻结）。"""

    auto_approve_threshold: float = 0.90
    auto_reject_threshold: float = 0.95
    human_band: float = 0.70
    version: str = "policy-1"

    def resolved(self, kind: str) -> "Policy":
        """按内容类型收紧或放宽；未知类型用默认，绝不因为查不到就放宽到全自动。"""
        overrides = _KIND_OVERRIDES.get(kind)
        if not overrides:
            return self
        return Policy(
            auto_approve_threshold=overrides.get(
                "auto_approve_threshold", self.auto_approve_threshold
            ),
            auto_reject_threshold=overrides.get(
                "auto_reject_threshold", self.auto_reject_threshold
            ),
            human_band=overrides.get("human_band", self.human_band),
            version=f"{self.version}/{kind}",
        )


# 评论与素材比作品本体更需要门槛：它们直接进公开面，且作者身份更弱。
_KIND_OVERRIDES: Dict[str, Dict[str, float]] = {
    "comment": {"auto_approve_threshold": 0.95, "auto_reject_threshold": 0.97},
    "asset": {"auto_approve_threshold": 0.95, "auto_reject_threshold": 0.97},
}


def clamp01(x: object) -> Optional[float]:
    """把概率限制到 [0,1]；不是数或越界返回 None（= 不可信，交给调用方弃权）。

    参照实现直接 `float(...)`，一个 1e9 或 -3 都能穿过它的比较梯；
    越界值在这里不是"截断使用"，而是"整条答案作废"——因为越界本身说明上游已经坏了。
    """
    if isinstance(x, bool):
        return None
    try:
        v = float(x)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if v != v or v in (float("inf"), float("-inf")):  # NaN / inf
        return None
    if v < 0.0 or v > 1.0:
        return None
    return v
