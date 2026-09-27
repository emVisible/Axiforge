"""置信度温度校准：纯数学（stdlib），sidecar 与拟合脚本共用。

对 laya 三类答案的概率分布做温度缩放（temperature scaling）：
  choice/score：p' = softmax(log(p) / T)，重算 argmax/期望值
  noul：二分类，logit 缩放后 sigmoid

拟合目标：持出样本上的 NLL 最小（网格搜索，无需 scipy）。
T=1.0 恒为候选，保证拟合永不差于出厂。

与参照实现（`Clearance/core/calibration.py`）同数学，两处语义收紧：
`coverage()` 把"哪些题目被标定了"显式暴露出来——参照实现只回一个 bool
（"有任一 T≠1 生效"），部分标定时它既会假阳也会假阴，而门控拿它当
"这条链的置信度可比不可比"的唯一依据。
"""
from __future__ import annotations

import json
import math

_EPS = 1e-9
_GRID = [round(0.1 + 0.05 * i, 2) for i in range(399)]  # 0.10..20.00
_GRID_MIN = _GRID[0]
_GRID_MAX = _GRID[-1]
#: 偏置项的界（logit 空间）。±4 已经能把 0.5 推到 0.982/0.018，够覆盖稀有事件的基本率。
_B_MAX = 4.0

#: 搜索网格上限。`/health` 会把它一起上报：拟合结果等于这个值的题**不是"标定好了"，
#: 而是"想更正但网格不允许"**——上报时把这类题单独列出来，否则 10/10 覆盖是个假绿灯。
GRID_MAX = _GRID_MAX
GRID_MIN = _GRID_MIN


def _clip(p: float) -> float:
    return min(1.0 - _EPS, max(_EPS, p))


def _clip_logit(m: float) -> float:
    return min(30.0, max(-30.0, m))


def _softmax(logits: list) -> list:
    m = max(logits)
    exps = [math.exp(x - m) for x in logits]
    s = sum(exps)
    return [e / s for e in exps]


def scale_categorical(probs: dict, true_label: str, T: float) -> tuple[dict, float]:
    """返回 (缩放后分布, NLL)。true_label 仅用于算 NLL，不参与缩放。"""
    keys = list(probs.keys())
    scaled = _softmax([math.log(_clip(probs[k])) / T for k in keys])
    out = dict(zip(keys, scaled))
    nll = -math.log(_clip(out.get(true_label, _EPS)))
    return out, nll


def scale_binary(p: float, T: float, b: float = 0.0) -> float:
    """仿射标定：logit' = logit/T + b。

    纯温度缩放（b=0）有一个结构性上限：它只能把分布压平到 0.5，**不能把预测整体
    移到稀有事件的基本率**。实测这条差异是决定性的——在 2/34 正例的轴上，
    取基本率的常数预测 NLL=0.224，而温度能到达的极限是 ln2=0.693。
    换句话说稀有轴上"最诚实的答案"是"这类事件几乎不发生"，温度表达不出来，
    拟合器只能把 T 推到网格上限装作标定过了。加一个偏置项就能表达。
    """
    logit = math.log(_clip(p) / _clip(1.0 - p))
    return 1.0 / (1.0 + math.exp(-(logit / T + b)))


def nll_binary(pairs: list, T: float, b: float = 0.0) -> float:
    """pairs: [(p, y)]. y∈{0,1}。"""
    nll = 0.0
    for p, y in pairs:
        q = _clip(scale_binary(p, T, b))
        nll += -(y * math.log(q) + (1 - y) * math.log(1 - q))
    return nll / max(1, len(pairs))


def fit_temperature_binary(pairs: list) -> tuple[float, float, float]:
    """返回 (最佳T, 拟合前NLL, 拟合后NLL)。单边样本返回 (1.0, nll, nll)。"""
    if not pairs or not any(y == 1 for _, y in pairs) or not any(y == 0 for _, y in pairs):
        base = nll_binary(pairs, 1.0) if pairs else 0.0
        return 1.0, base, base
    base = nll_binary(pairs, 1.0)
    best_T, best = 1.0, base
    for T in _GRID:
        v = nll_binary(pairs, T)
        if v < best:
            best_T, best = T, v
    return best_T, base, best


def _logit(p: float) -> float:
    return math.log(_clip(p) / _clip(1.0 - p))


def fit_affine_binary(pairs: list) -> tuple[float, float, float, float]:
    """(最佳T, 最佳b, 拟合前NLL, 拟合后NLL)。

    对 x=logit(p) 拟合一条带截距的一维逻辑回归（Newton/IRLS，无正则），
    等价于在 `logit' = a·x + b` 上最小化 NLL，比网格搜索快两个数量级——
    leave-one-out 要重拟 n 次，网格在这里跑不动。

    两个约束是有意加的，不是省事：
    - **单调**（a>0）：标定不该把"这条轴越像 A 越判 A"翻成反向。拟合出 a≤0
      说明标签与该轴的符号相反，那是标注集的问题，不该由标定偷偷修正。
    - **有界**：a、b 限制在网格范围内（T∈[0.1,20]、|b|≤4）。可分数据上无界 IRLS
      会发散到无穷，界住它等于承认"我只能表达到这里"。
    """
    if not pairs or not any(y == 1 for _, y in pairs) or not any(y == 0 for _, y in pairs):
        base = nll_binary(pairs, 1.0) if pairs else 0.0
        return 1.0, 0.0, base, base
    x = [_logit(p) for p, _ in pairs]
    y = [t for _, t in pairs]
    a, b = 1.0, 0.0  # 起点 = 纯温度 T=1、无偏置
    for _ in range(60):
        g0 = g1 = h00 = h01 = h11 = 0.0
        for xi, yi in zip(x, y):
            mu = a * xi + b
            q = 1.0 / (1.0 + math.exp(-_clip_logit(mu)))
            w = q * (1.0 - q)
            r = yi - q
            g1 += r
            g0 += r * xi
            h11 += w
            h01 += w * xi
            h00 += w * xi * xi
        det = h00 * h11 - h01 * h01
        if det <= 1e-12:
            break
        da = (g0 * h11 - g1 * h01) / det
        db = (g1 * h00 - g0 * h01) / det
        na = max(1.0 / _GRID_MAX, min(_GRID_MAX, a + da))   # a>0 由下界保证
        nb = max(-_B_MAX, min(_B_MAX, b + db))
        if abs(na - a) < 1e-9 and abs(nb - b) < 1e-9:
            a, b = na, nb
            break
        a, b = na, nb
    T = 1.0 / a
    base = nll_binary(pairs, 1.0)
    affine_nll = nll_binary(pairs, T, b)
    # 步长被界住时 IRLS 可能落在比起点更差的地方。多出来的自由度只在
    # **它真的更好**时才保留——否则退回纯温度族，别让"更复杂的模型"
    # 变成一个更差的标定，还要等下游 LOO 才发现。
    t_only, _, t_nll = fit_temperature_binary(pairs)
    if t_nll <= affine_nll:
        return t_only, 0.0, base, t_nll
    return T, b, base, affine_nll


def fit_temperature_categorical(rows: list) -> tuple[float, float, float]:
    """rows: [(probs_dict, true_label)]。"""
    if not rows:
        return 1.0, 0.0, 0.0

    def nll(T: float) -> float:
        return sum(scale_categorical(p, t, T)[1] for p, t in rows) / len(rows)

    base = nll(1.0)
    best_T, best = 1.0, base
    for T in _GRID:
        v = nll(T)
        if v < best:
            best_T, best = T, v
    return best_T, base, best


def rescale_answer(ans: dict, T: float, b: float = 0.0) -> dict:
    """按拟合的 (T, b) 重算单个答案；未标定时原样返回。未知形状原样返回。

    `b` 只对二元轴生效。choice/score 的"每类一个偏置"是另一个参数化，
    在这个样本量上不值得冒过拟合的险——温度表条目里给了字段也不会被用。
    """
    if (T == 1.0 and not b) or not isinstance(ans, dict):
        return ans
    t = ans.get("type")
    try:
        if t == "noul":
            p = float(ans.get("noul", 0.5))
            out = dict(ans)
            q = scale_binary(p, T, b)
            out["noul"] = q
            out["confidence"] = max(q, 1 - q)
            return out
        if t in ("choice", "score") and isinstance(ans.get("probabilities"), dict):
            probs = {str(k): float(v) for k, v in ans["probabilities"].items()}
            keys = list(probs.keys())
            scaled = _softmax([math.log(_clip(probs[k])) / T for k in keys])
            out = dict(ans)
            out["probabilities"] = dict(zip(keys, scaled))
            if t == "choice":
                top = max(range(len(keys)), key=lambda i: scaled[i])
                out["choice"] = keys[top]
                out["confidence"] = scaled[top]
            else:
                out["score"] = sum(float(keys[i]) * scaled[i] for i in range(len(keys)))
                out["confidence"] = max(scaled)
            return out
    except (ValueError, TypeError, ZeroDivisionError):
        pass
    return ans


def rescale_answers(answers: dict, table: dict) -> tuple[dict, list]:
    """table: {qid: {T: float}}。返回 (新答案, **已标定的题目名列表**)。

    第二个返回值取代参照实现的 `applied: bool`：标定是逐题的性质，
    不是一个链级开关。只标了三条轴时它必须报告"三条"，而不是 True。
    """
    if not table:
        return answers, []
    out = dict(answers)
    done: list = []
    for qid, entry in table.items():
        if qid not in out:
            continue
        try:
            T = float((entry or {}).get("T", 1.0))
            b = float((entry or {}).get("b", 0.0))
        except (TypeError, ValueError):
            continue
        out[qid] = rescale_answer(out[qid], T, b)
        done.append(qid)
    return out, done


def load_table(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}
