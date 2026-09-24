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

## 已完成（v2.1）

| 项 | 说明 |
|----|------|
| 跨 Beat 连续主时间轴 | `MasterTimelineBar` + 全片连续预览 |
| 存档缩略图服务端生成 | `save_thumb.py` 按 Beat 脚本/舞台资产推导 |
| 分轨独立排序 | `reorderScriptWithinTrack` + 分轨内拖拽 |

## 推迟 v2.1+（现由桌面 Phase 9 承接）

| 项 | 现状 |
|----|------|
| 演出节奏曲线 / 关键帧（剪辑台） | 未做；`REFACTOR_DESKTOP.md` Phase 9 承接 |

## 明确不做（远期）

- 图集 / 多分辨率资产（v2.0）
- `.rn` 文本 DSL
- AI 运行时 / 世界 tick
- Unity 渲染器
- Player HUD 主题合并
- ClusterSession 完整版
- 关注 / 推荐 / 付费

> **纠偏（2026-09-24）**：本节原列「`.axsp` 导出」为明确不做，但 ADR-024 决策 4 已把它前置，
> 且桌面 Phase 2 交付 v0 容器、Phase 6（v0.7）交付含素材与角色的 v2 容器。原条目与已交付事实冲突，已移除。
