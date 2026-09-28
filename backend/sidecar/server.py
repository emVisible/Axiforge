"""Laya sidecar：把 torch 系重依赖隔离在独立进程，中台后端经 HTTP 调用。

    cd backend/sidecar && uv sync           # 独立 venv（torch，需联网）
    uv run --no-sync python server.py        # :8685

为什么要有这个进程：`backend/app/domains/moderation/providers/laya_sidecar.py`
是标准库 urllib 客户端，后端本身不 import torch。判断层的契约在 Python 侧，
模型权重与 GPU 只活在这里，sidecar 挂了后端只是降级为词表 + 人工。

端点：
    GET  /health   → {ok, engine, device, loaded, default, calibration}
    POST /decide   → {ok, answers, calibrated_questions, routing, latency_ms, ...}

环境变量：
    SIDECAR_PORT        监听端口（默认 8685）
    MODEL_DIR           覆盖 checkpoint（本地微调产物目录或 Hub repo）
    LAYA_DEFAULT        路由默认 checkpoint（默认 multilingual：中文优先）
    LAYA_PRELOAD        启动即加载的 checkpoint 列表（逗号分隔）
    LAYA_LAZY=1         跳过启动预热，首次 /decide 时再加载
    CALIBRATION_FILE    温度表路径（默认 ../eval/calibration.json）

与参照实现的差别（参照 = `Clearance/vendor/laya_sidecar/server.py`）：
1. 温度表覆盖情况按题上报（`calibrated_questions`），不再给一个链级 bool。
   只标定了 3/9 条轴时，客户端必须看得见是 3 条。
2. 不实现 shortlist：本题集 choice 最多 3 个取值，参照那条 >20 项自动 shortlist
   的分支在这里是永远不会走到的死代码。需要时按上游 `predict_shortlist` 再加。
"""
from __future__ import annotations

import argparse
import inspect
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from calibration import GRID_MAX, load_table, rescale_answers

_router = None
_device = "unknown"
_loaded: list = []
_default = os.environ.get("LAYA_DEFAULT", "multilingual")

DEFAULT_TABLE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "eval", "calibration.json")
CALIBRATION_FILE = os.environ.get("CALIBRATION_FILE", "") or DEFAULT_TABLE_PATH

_cal_table: dict = {}
_cal_mtime = -1.0


def _router_singleton(preload: bool):
    global _router, _device, _loaded
    if _router is not None:
        return _router
    from laya import Router
    _router = Router(default=_default,
                     max_loaded=int(os.environ.get("LAYA_MAX_LOADED", "2")))
    if preload:
        want = [m.strip() for m in
                os.environ.get("LAYA_PRELOAD", "english,multilingual").split(",")
                if m.strip()]
        _router.preload(want)
        _loaded = list(_router.loaded)
        try:
            _device = str(_router.load("english").device)
        except Exception:
            pass
    return _router


def calibration_table() -> dict:
    """温度表按 mtime 热重载；缺席/损坏即 {}（= 出厂未标定，不是错误）。"""
    global _cal_table, _cal_mtime
    try:
        m = os.path.getmtime(CALIBRATION_FILE)
    except OSError:
        return {}
    if m != _cal_mtime:
        _cal_table = load_table(CALIBRATION_FILE)
        _cal_mtime = m
        print(f"sidecar: calibration loaded ({len(_cal_table)} questions)", flush=True)
    return _cal_table


def decide_once(state, questions: dict, lang_guess=None, *, calibrate: bool = True) -> dict:
    t0 = time.time()
    router = _router_singleton(preload=False)
    route_kw: dict = {}
    if lang_guess and "lang_guess" in inspect.signature(router.route).parameters:
        route_kw["lang_guess"] = lang_guess
    routed = router.route(state, questions, **route_kw)
    model = routed["model"]
    predict_kw: dict = {}
    if "lang_guess" in inspect.signature(router.predict).parameters:
        predict_kw["lang_guess"] = lang_guess
    res = router.predict(state, questions, **predict_kw)

    global _loaded
    _loaded = list(router.loaded)
    raw = res.get("answers", {})
    # calibrate=False 是给拟合脚本用的：在已经缩放过的分布上再拟一次温度，
    # 得到的是两次缩放的复合，看着"更准"但不可复现，而且每次重拟都会再缩一次。
    answers, done = rescale_answers(raw, calibration_table() if calibrate else {})
    return {"ok": True, "answers": answers,
            # 缩放前那份原样留给上游落库。两个理由叠在一起：
            # ① 拟合必须在未缩放的分布上做——在已缩放的分布上再拟一次得到的是两次缩放的复合，
            #    看着"更准"但每次重拟都会再缩一遍，且不可复现；
            # ② 处置标注的真值锚在"人当时看到的那次判定"上，而生产判定用的是缩放后的分布，
            #    所以现场再问一次（`calibrate:false`）拿到的并不是人判过的那一份。
            # 两个口径都要能拟，就得把 raw 随案件一起留下。
            "answers_raw": raw,
            "routing": res.get("routing", routed),
            "calibrated_questions": sorted(done),
            "latency_ms": int((time.time() - t0) * 1000),
            "device": _device, "engine": "laya"}


def _send(h: BaseHTTPRequestHandler, code: int, obj: dict) -> None:
    body = json.dumps(obj, ensure_ascii=False).encode()
    h.send_response(code)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(body)))
    h.end_headers()
    h.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    server_version = "AxiforgeLayaSidecar/1"

    def log_message(self, fmt, *args):
        import sys
        sys.stderr.write("sidecar: " + fmt % args + "\n")

    def do_GET(self):
        if urlparse(self.path).path != "/health":
            _send(self, 404, {"ok": False, "error": "not found"})
            return
        table = calibration_table()
        _send(self, 200, {
            "ok": True, "engine": "laya", "device": _device,
            "loaded": _loaded, "default": _default,
            "model_dir": os.environ.get("MODEL_DIR", "hub-default"),
            # 中台 dashboard 直接显示这几个字段：自动判断到底生不生效，
            # 从这里读，不需要另做面板。
            "calibration": {
                "path": CALIBRATION_FILE,
                "questions": sorted(table),
                "T": {k: (v or {}).get("T") for k, v in table.items()},
                "b": {k: (v or {}).get("b", 0.0) for k, v in table.items()},
                "grid_max": GRID_MAX,
            },
        })

    def do_POST(self):
        if urlparse(self.path).path != "/decide":
            _send(self, 404, {"ok": False, "error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length).decode() or "{}")
        except ValueError:
            _send(self, 400, {"ok": False, "error": "invalid JSON"})
            return
        questions = payload.get("questions")
        if not questions:
            _send(self, 400, {"ok": False, "error": "questions required"})
            return
        state = payload.get("state") or {"kind": payload.get("kind", "other"),
                                         "text": payload.get("text", "")}
        # 拟合温度必须看未标定的原始分布，否则是在已缩放的分布上再缩放一次。
        raw_only = payload.get("calibrate") is False
        try:
            _send(self, 200, decide_once(state, questions,
                                         lang_guess=payload.get("lang_guess"),
                                         calibrate=not raw_only))
        except Exception as e:
            _send(self, 500, {"ok": False, "error": f"{type(e).__name__}: {e}"})


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=int(os.environ.get("SIDECAR_PORT", "8685")))
    p.add_argument("--lazy", action="store_true", default=False)
    a = p.parse_args()
    lazy = a.lazy or os.environ.get("LAYA_LAZY", "") == "1"
    try:
        _router_singleton(preload=not lazy)
        print(f"sidecar: router ready (loaded={_loaded} device={_device} "
              f"default={_default} table={CALIBRATION_FILE})", flush=True)
    except Exception as e:
        print(f"sidecar: preload failed ({e}); lazy mode, first /decide will load", flush=True)
    print(f"Laya sidecar on http://127.0.0.1:{a.port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", a.port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
