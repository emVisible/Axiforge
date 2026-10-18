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


def test_temperature_scaling_cannot_move_the_decision_point_only_blur_it():
    """纯温度缩放能做什么、不能做什么——这是"approve 通道够不到"的数学原因。

    `logit/T` 保持 0.5 这个不动点：无论 T 多大，p>0.5 永远映射到 >0.5。
    于是一条 2/34 正例的稀有轴，标定后最高也只能到 0.5，而"最诚实的答案"
    是"这类事件基本不发生"（≈0.06）——温度表达不出来，拟合器只能把 T 推到
    网格上限装作标定过。实测代价写在 ADR-028 的阈值表旁边：
    同一份标注、同样的留一口径下，pii 轴的持出 NLL 从 0.727 降到 0.266。
    """
    import math

    from calibration import nll_binary, scale_binary

    # 温度族永远跨不过 0.5 这个不动点
    for T in (0.1, 1.0, 5.0, 1000.0, 1e6):
        assert scale_binary(0.9, T) > 0.5
    # 加一个偏置就可以（配合 T>1 先把斜率压下来）：它表达"这条轴不该信自己的高分"
    assert scale_binary(0.9, 5.0, -4.0) < 0.05
    assert scale_binary(0.9, 1.0, -4.0) < 0.15
    assert abs(scale_binary(0.9, 1.0, 0.0) - 0.9) < 1e-9, "b=0 必须与纯温度完全一致"

    n = 34
    pairs = [(0.93, 1)] * 2 + [(0.87, 0)] * (n - 2)
    flat_floor = nll_binary(pairs, 1e6)
    base_rate = 2 / n
    honest = -(base_rate * math.log(base_rate) + (1 - base_rate) * math.log(1 - base_rate))
    assert abs(flat_floor - math.log(2)) < 1e-3, "温度压平的极限就是 ln2"
    assert honest < flat_floor - 0.4, "基本率明显更好，而温度族到不了那里"


def test_the_extra_degree_of_freedom_is_dropped_when_it_does_not_help():
    """两簇几乎重合时，多出来的偏置没有信息可用。

    无界 IRLS 会往"尽力分开"的方向跑，而步长被界住之后它可能落在比纯温度更差的点上。
    拟合一律退回不更差的那个族——不该让下游 LOO 去替它擦屁股。
    """
    from calibration import fit_affine_binary, fit_temperature_binary

    pairs = [(0.93, 1)] * 2 + [(0.87, 0)] * 32
    _, _, _, affine_nll = fit_affine_binary(pairs)
    _, _, temp_nll = fit_temperature_binary(pairs)
    assert affine_nll <= temp_nll + 1e-9


def test_affine_fit_stays_bounded_on_separable_data():
    """可分数据上无界 IRLS 会发散到无穷；界住它等于承认"只能表达到这里"。"""
    from calibration import _B_MAX, GRID_MAX, fit_affine_binary

    pairs = [(0.99, 1)] * 6 + [(0.01, 0)] * 28
    T, b, _, _ = fit_affine_binary(pairs)
    assert 1.0 / GRID_MAX - 1e-9 <= 1.0 / T <= GRID_MAX
    assert abs(b) <= _B_MAX + 1e-9
