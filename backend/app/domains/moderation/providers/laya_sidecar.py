"""Laya sidecar 引擎：把内容交给本机决策模型，拿回类型化答案。

部署形态沿用参照实现已经验证过的做法——torch 那 ~2GB 重依赖隔离在独立进程与独立 venv，
主服务保持轻、秒启动、断网可跑；本模块只是它的客户端，sidecar 不在时整条链自动降级。

三条与参照实现不同的地方：
1. **不接 Jev 等外部 SaaS。** ADR-018 明确"全部单体内轻量实现，不引外部服务"，
   而把用户作品正文 POST 给 api.typesafe.ai 既是外部服务也是数据出境。参照实现里
   `jev` 那一档在这里被有意删除，不是遗漏。
2. **答案先过白名单再进策略表**（`questions.normalize_answers`）。
3. **正文长度上限与注入边界。** 未信任文本只作为 `state.body` 的数据字段送出，
   不拼进指令；超长内容直接转人工——既因为模型 512/1024 token 窗口会截断，
   也因为"看不全就自动裁决"是不可接受的。
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import replace
from typing import Optional

from app.domains.moderation.contracts import ACTION_HUMAN, ModerationSubject, Verdict
from app.domains.moderation.policy import decide_from_answers
from app.domains.moderation.questions import QUESTIONS_VERSION, build_questions, normalize_answers

#: 送进模型的最大字符数。超过它宁可多一次人工，也不拿半篇内容做全自动裁决。
MAX_MODEL_CHARS = 6000


class LayaSidecarEngine:
    name = "laya:sidecar"
    authoritative = True

    def __init__(self, base_url: str = "http://127.0.0.1:8685", timeout_s: float = 8.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    def health_check(self) -> bool:
        try:
            with urllib.request.urlopen(f"{self.base_url}/health", timeout=1.5) as r:
                return json.loads(r.read().decode()).get("ok") is True
        except (urllib.error.URLError, OSError, ValueError):
            return False

    def _decide(self, state: dict) -> dict:
        payload = json.dumps(
            {"state": state, "questions": build_questions()}, ensure_ascii=False
        ).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/decide",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def moderate(self, subject: ModerationSubject) -> Verdict:
        text = subject.text
        if len(text) > MAX_MODEL_CHARS:
            return Verdict(
                action=ACTION_HUMAN, confidence=0.0, engine=self.name,
                reasons=[f"正文 {len(text)} 字超出模型窗口 {MAX_MODEL_CHARS}，不做截断后自动裁决"],
                abstained=False,
            )
        t0 = time.perf_counter()
        try:
            data = self._decide({"kind": subject.kind, "title": subject.title, "body": subject.body})
        except (urllib.error.URLError, OSError, ValueError) as exc:
            return Verdict.abstain(self.name, f"sidecar 不可达：{type(exc).__name__}")
        latency_ms = int((time.perf_counter() - t0) * 1000)

        if not data.get("ok"):
            return Verdict.abstain(self.name, f"sidecar 报错：{data.get('error', 'unknown')}")

        answers, problems = normalize_answers(data.get("answers") or {})
        calibrated = bool(data.get("calibrated"))
        routing = data.get("routing") or {}
        reasons = [
            f"model={routing.get('model', '?')}",
            f"questions_version={QUESTIONS_VERSION}",
        ]
        if routing.get("reason"):
            reasons.append(f"routing: {routing['reason']}")
        if data.get("shortlisted"):
            reasons.append("shortlisted(>20 选项)")

        if problems:
            # 答案不可信 = 这个引擎这次没有发言权。参照实现在这里会兜底成 "other" 然后自动通过。
            reasons.append("答案越界，引擎弃权：" + "；".join(problems[:4]))
            return replace(
                Verdict.abstain(self.name, "；".join(problems[:4])),
                reasons=reasons,
                latency_ms=latency_ms,
            )

        verdict = decide_from_answers(
            answers, engine=self.name, calibrated=calibrated, extra_reasons=reasons
        )
        return replace(verdict, latency_ms=latency_ms)
