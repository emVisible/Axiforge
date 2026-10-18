"""确定性词表引擎：快、离线可用、**永远不权威**。

它存在的意义不是替模型做决定，而是两件事：
1. 没有 sidecar 时，让中台仍然能给出"这条需要人看"的triage，而不是沉默；
2. 给人工队列提供可解释的线索（命中了哪个词、哪一条款）。

`authoritative = False` 是这一层的承重设计：参照实现的兜底引擎用 0.88/0.86
越过自动门直接驳回内容（约十个关键词的杀伤力，且终态不可申诉），
而它自己的放行路径故意压到 0.60。同一个引擎对"放过"和"处决"用了相反的信心标准，
这是方向性错误——**证据越弱的引擎，越不该拥有不可逆的权力**。
"""

from __future__ import annotations

import hashlib
import re
from typing import Dict, List

from app.domains.moderation.contracts import ACTION_HUMAN, ModerationSubject, Verdict
from app.domains.moderation.questions import CLAUSE_LABELS

# 每条：条款 → 词/模式。生产上应外置成可热更的配置（参照实现也是这么列在 roadmap 里的）。
_PATTERNS: Dict[str, List[str]] = {
    "hate_incitement": [
        "支那", "劣等民族", "清种", "滚出中国", "expatriate all",
    ],
    "illegal_instruction": [
        "制造土炸弹", "合成冰毒步骤", "开锁教程 汽车", "伪造身份证", "synthesis of fentanyl",
    ],
    "doxxing": [
        r"\b\d{17}[\dXx]\b",              # 身份证号
        r"\b1[3-9]\d{9}\b",               # 手机号
        r"\d+\s*号楼\s*\d+\s*室",          # 门牌
    ],
    "sexual_explicit": [
        "露骨性描写", "口交", "内射", "explicit intercourse",
    ],
    "gratuitous_violence": [
        "凌迟细节", "活体解剖", "虐杀全过程",
    ],
    "self_harm_unsafe": [
        "割腕方法", "安眠药致死量", "how to kill yourself",
    ],
    "spam_promotion": [
        "加微信领", "返利群", "点击链接注册送", "casino bonus link",
    ],
}

_COMPILED = {
    clause: [re.compile(p, re.I) if any(c in p for c in "\\[") else p.lower()
             for p in pats]
    for clause, pats in _PATTERNS.items()
}

#: 词表版本从内容算，不手写。手写的版本号是一个"要有人记得改"的承诺，
#: 而加一个词之后忘记 bump，旧结论就会以新代码的名义继续被幂等复用。
LEXICON_VERSION = "lexicon-" + hashlib.sha1(
    "|".join(f"{c}={';'.join(pats)}" for c, pats in sorted(_PATTERNS.items())).encode("utf-8")
).hexdigest()[:8]


class LexiconEngine:
    """命中即转人工；不命中也不构成"通过"的证据，因此恒弃权。"""

    name = "lexicon"
    authoritative = False

    def health_check(self) -> bool:
        return True

    def model_version(self) -> str:
        return LEXICON_VERSION

    def moderate(self, subject: ModerationSubject) -> Verdict:
        text = subject.text.lower()
        hits: List[str] = []
        for clause, pats in _COMPILED.items():
            for pat in pats:
                if (pat.search(text) if isinstance(pat, re.Pattern) else pat in text):
                    hits.append(clause)
                    break
        if not hits:
            # 没命中不等于干净：这个词表只能证明"可疑"，不能证明"无害"。
            return Verdict.abstain(self.name, "lexicon: 无可疑命中（不构成通过证据）")
        return Verdict(
            action=ACTION_HUMAN,
            confidence=0.0,
            engine=self.name,
            reasons=[
                "lexicon 命中 " + "、".join(CLAUSE_LABELS.get(h, h) for h in sorted(hits)),
                f"lexicon_version={LEXICON_VERSION}",
            ],
            clause_ids=sorted(hits),
        )
