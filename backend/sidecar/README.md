# Laya sidecar（审核判断层的模型进程）

中台后端**不 import torch**。决策模型跑在这个独立进程 + 独立 venv 里，
后端只经 HTTP 调它（`app/domains/moderation/providers/laya_sidecar.py`）。
它挂了不会让发布失败，只会让审核链降级为"词表 + 人工"。

## 起

```bash
cd backend/sidecar && uv sync            # 建独立 venv（torch 系，需联网）
uv run --no-sync python server.py        # 默认 http://127.0.0.1:8685
curl -s localhost:8685/health            # loaded / default / calibration 三处要看
```

后端侧打开开关：`MODERATION_ENABLED=true`（默认关；关了就是纯建议模式）。

`/health` 里的 `calibration.questions` 是"哪几题已标定"。
**九题全都覆盖，整链才有执行资格**——只标了三题时客户端会判定未标定，
继续转人工，并在 `reasons` 里写明缺哪几题。

## 温度表

```bash
backend/.venv/bin/python eval/calibrate.py           # 需 sidecar 在跑
backend/.venv/bin/python eval/moderation_eval.py --sweep --what-if
```

`eval/calibration.json` **不入库**：它是产物，真相源是标注集
（生产标注来自 `eval/export_labels.py` 导出的人工处置记录）。
sidecar 按 mtime 热重载，改表不用重启。

## 与参照实现的关系

数学与端点形状参照 `Clearance/vendor/laya_sidecar`，两处语义收紧：
标定按题上报（不再是链级 bool），以及 `/decide` 支持 `calibrate:false`
——拟合必须在未标定的原始分布上做，否则是在已缩放的分布上再缩放一次。
