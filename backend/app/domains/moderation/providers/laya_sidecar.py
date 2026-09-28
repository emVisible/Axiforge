"""Laya sidecar 引擎：把内容交给本机决策模型，拿回类型化答案。

部署形态：torch 系重依赖隔离在独立进程与独立 venv，主服务保持轻、秒启动、
断网可跑；服务端就在本仓库 `backend/sidecar/server.py`（实测依赖为 laya 0.3.7 +
torch 2.14.0，MPS 上单条判定约 0.7s）。本模块只是它的客户端，sidecar 不在时整条链自动降级。

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

import hashlib
import json
import time
import urllib.error
import urllib.request
from dataclasses import replace
from typing import Optional

from app.domains.moderation.contracts import ACTION_HUMAN, ModerationSubject, Verdict
from app.domains.moderation.policy import decide_from_answers
from app.domains.moderation.questions import (
    QUESTIONS_VERSION,
    build_questions,
    normalize_answers,
    question_label,
)

#: 送进模型的最大字符数。超过它宁可多一次人工，也不拿半篇内容做全自动裁决。
MAX_MODEL_CHARS = 6000


class LayaSidecarEngine:
    name = "laya:sidecar"
    authoritative = True

    #: /health 的模型状态里包含温度表内容，重拟之后结论必须变，所以要参与幂等键。
    #: 但每次判定都打一次 /health 是浪费——按 TTL 缓存。
    _HEALTH_TTL_S = 30.0
    #: 探测**失败**时缓存要短得多。失败值不只是"暂时不知道"，它会写进幂等键和
    #: 依据里的 `model_state`：sidecar 活过来之后，最长 30 秒内的真实判定仍会
    #: 被标成 `laya:unreachable`，一条好端端的结论以"引擎没答话"的名义落库。
    _HEALTH_FAIL_TTL_S = 2.0

    def __init__(self, base_url: str = "http://127.0.0.1:8685", timeout_s: float = 8.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s
        self._mv = ""
        self._mv_at = 0.0
        self._mv_ok = True

    def _health(self) -> Optional[dict]:
        try:
            with urllib.request.urlopen(f"{self.base_url}/health", timeout=1.5) as r:
                data = json.loads(r.read().decode())
        except (urllib.error.URLError, OSError, ValueError):
            return None
        return data if isinstance(data, dict) else None

    def _probe_version(self) -> str:
        h = self._health()
        if h is None:
            return "laya:unreachable"
        cal = h.get("calibration") or {}
        # 指纹要覆盖**全部**自由参数：只带 T 的话，一次"只改偏置"的重拟不会让
        # 旧结论失效，同一篇稿子会以过期标定的名义继续被复用。
        digest = hashlib.sha1(
            json.dumps({"T": cal.get("T") or {}, "b": cal.get("b") or {}},
                       sort_keys=True).encode("utf-8")
        ).hexdigest()[:8]
        return f"laya:{h.get('default', '?')}+T{digest}"

    def model_version(self) -> str:
        now = time.monotonic()
        ttl = self._HEALTH_TTL_S if self._mv_ok else self._HEALTH_FAIL_TTL_S
        if not self._mv or now - self._mv_at > ttl:
            self._mv_at = now
            self._mv = self._probe_version()
            self._mv_ok = self._mv != "laya:unreachable"
        return self._mv

    def health_check(self) -> bool:
        h = self._health()
        return bool(h and h.get("ok") is True)

    def calibration(self) -> dict:
        """温度表覆盖面：题集声明了哪些轴、温度表实际覆盖了哪些、缺哪些。

        这是"为什么一条都不会自动执行"的唯一诚实答案。判定链在任一题未覆盖时
        整体转人工（见 `moderate` 里的 `declared <= done`），所以"缺哪几题"
        比"校准过了"更有用——后者是个会骗人的布尔。
        """
        h = self._health()
        declared = sorted(build_questions())
        if h is None:
            return {"reachable": False, "declared": declared, "covered": [],
                    "missing": declared, "temperatures": {}, "path": ""}
        cal = h.get("calibration") or {}
        covered = sorted(str(q) for q in (cal.get("questions") or []))
        temps = {str(k): float(v) for k, v in (cal.get("T") or {}).items()}
        grid_max = float(cal.get("grid_max") or 0.0)
        # 拟合值坐在网格上限上 = 还想更正但网格不允许，这类题的置信度仍是虚高的。
        # 不知道网格上限（旧 sidecar）时不猜：报空列表，界面上显示"未上报"。
        censored = sorted(q for q, t in temps.items() if grid_max and t >= grid_max)
        # `informative=false` 的轴：持出 NLL 打不过"只看标签频率、不看模型"的常数预测器。
        # 它不是"标得差一点"，是**这个数在当前标注量下不携带信息**——而 approve 的置信度
        # 是各轴取 min，一条没有判断力的轴就有权否决整条自动通道，这正是现在发生的事。
        inf = cal.get("informative") or {}
        flattened = sorted(str(q) for q, v in inf.items() if v is False)
        return {
            "reachable": True,
            "declared": declared,
            "covered": covered,
            "missing": [q for q in declared if q not in set(covered)],
            "temperatures": temps,
            "grid_max": grid_max,
            "censored": censored,
            "flattened": flattened,
            # 区分"这张表没这个字段"（旧表，None）与"报了、全是 true"（新表，没问题）。
            "flattening_reported": any(v is not None for v in inf.values()),
            "path": str(cal.get("path") or ""),
        }

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
                abstained=False, refusal=f"over_length:{len(text)}>{MAX_MODEL_CHARS}",
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
        routing = data.get("routing") or {}
        reasons = [
            f"model={routing.get('model', '?')}",
            f"questions_version={QUESTIONS_VERSION}",
            # 落库要能回答"当时生效的是哪一版温度表"——否则复盘一条三个月前的
            # 自动结论时，无法知道它是在哪个标定状态下做出的。
            f"model_state={self.model_version()}",
        ]
        if routing.get("reason"):
            reasons.append(f"routing: {routing['reason']}")
        if data.get("shortlisted"):
            reasons.append("shortlisted(>20 选项)")

        # 标定是逐题的性质，不是链级开关：只标了 3/9 条轴时这条链仍然不可执行。
        # 参照实现回一个 bool（"有任一 T≠1 生效"），部分标定时它会同时假阳和假阴。
        # 字段缺席按未标定处理——不给旧 sidecar 留"没上报就算标定过"的空子。
        declared = set(build_questions())
        done = {str(q) for q in (data.get("calibrated_questions") or [])}
        calibrated = bool(declared) and declared <= done
        if not calibrated and done:
            reasons.append(
                "未标定轴：" + "、".join(question_label(q) for q in sorted(declared - done)[:6])
            )

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
        # 缩放前那份跟着结论落库，`calibrate --from-answers` 靠它才能不在已缩放的分布上再拟一次
        verdict = replace(verdict, raw_answers=dict(data.get("answers_raw") or {}))
        return replace(verdict, latency_ms=latency_ms)
