"""sidecar 服务端的对端契约测试——不需要装 torch。

为什么这些断言值得钉住：后端 `providers/laya_sidecar.py` 判"整链是否已标定"
只看 `calibrated_questions` 覆没覆盖题集，拟合脚本 `eval/calibrate.py` 只信
`calibrate:false` 真的回原始分布。这两件事都在**另一个进程**里发生，
后端自己的测试够不到——而它们静默失效时，症状是"温度表越拟越准"，不会报错。

`sidecar/server.py` 顶层只 import 标准库与本地 `calibration`（torch 在函数内部才 import），
所以这里可以用一个假 router 直接驱动 `decide_once`。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sidecar"))
import server as sidecar_server  # noqa: E402

#: 真机实测的一条干净文本答案（含 1−归一化熵那个 0.1076）。
RAW = {
    "sexual_content": {"type": "noul", "noul": 0.9, "confidence": 0.9},
    "age_rating": {"type": "choice", "choice": "all", "confidence": 0.1076,
                   "probabilities": {"all": 0.5474, "teen": 0.2963, "adult": 0.1563}},
}


class FakeRouter:
    loaded = ["multilingual"]

    def route(self, state, questions):
        return {"model": "multilingual"}

    def predict(self, state, questions):
        return {"answers": json.loads(json.dumps(RAW)), "routing": {"model": "multilingual"}}


@pytest.fixture
def patched(monkeypatch):
    monkeypatch.setattr(sidecar_server, "_router_singleton", lambda preload: FakeRouter())
    monkeypatch.setattr(sidecar_server, "calibration_table",
                        lambda: {"sexual_content": {"T": 0.2}})
    return monkeypatch


def test_calibrate_false_serves_the_raw_distribution(patched):
    """拟合必须在原始分布上做。给了表还缩放，就是在已缩放的分布上再拟一次。"""
    out = sidecar_server.decide_once({"kind": "project", "text": "x"}, {}, calibrate=False)
    assert out["answers"]["sexual_content"]["noul"] == pytest.approx(0.9)
    assert out["calibrated_questions"] == []


def test_calibration_coverage_is_per_question_not_a_bool(patched):
    """只标了一条轴时必须报"一条"，不能报 True——客户端据此判整链可否执行。"""
    out = sidecar_server.decide_once({"kind": "project", "text": "x"}, {})
    assert out["calibrated_questions"] == ["sexual_content"]
    assert out["answers"]["sexual_content"]["noul"] > 0.9, "T<1 应当锐化"
    assert out["answers"]["age_rating"]["probabilities"] == pytest.approx(
        RAW["age_rating"]["probabilities"], abs=1e-9), "未标定的那题必须原样"
