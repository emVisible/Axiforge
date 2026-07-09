# v1.x 非远期遗留清单（BACKLOG_V1）

> 与 [AXIFORGE_V2.md](./AXIFORGE_V2.md) 波次 0 对齐；远期项见 ROADMAP_FINAL v2.0+。

## 已完成（v2 波次 0）

| 项 | 说明 |
|----|------|
| flash 白屏残留 | FxLayer 动画结束卸载 |
| wait 误显「暂无内容」 | PlayerPage `isWaiting` 判断 |
| 剪辑 Delete 误删 Beat | 剪辑模式只删片段 |
| 转场/特效预览 | fade/dissolve/wipe/cut 区分 |
| 单 Beat 时长拖拽 | TimelineShell resize handle |
| amber token | Studio/Flow 语义色 |

## 推迟 v2.1+

（无）

## 已完成（v2.1）

| 项 | 说明 |
|----|------|
| 跨 Beat 连续主时间轴 | `MasterTimelineBar` + 全片连续预览 |
| 存档缩略图服务端生成 | `save_thumb.py` 按 Beat 脚本/舞台资产推导 |
| 分轨独立排序 | `reorderScriptWithinTrack` + 分轨内拖拽 |

## 明确不做（远期）

- 图集 / 多分辨率资产（v2.0）
- `.rn` 文本 DSL
- AI 运行时 / 世界 tick
- Unity / `.axsp` 导出
- Player HUD 主题合并
- ClusterSession 完整版
- 关注 / 推荐 / 付费
