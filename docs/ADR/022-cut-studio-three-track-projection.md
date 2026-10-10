# ADR-022：剪辑工作台与三轨投影模型

**状态**：已采纳（Cut Studio v1）  
**日期**：2026-07-08  
**关联**：ADR-009、ADR-016、ADR-017、[归档：VISION_AND_BRIDGES](../archive/VISION_AND_BRIDGES.md) 桥2、[归档：REFACTOR_CUT_STUDIO](../archive/REFACTOR_CUT_STUDIO.md)

## 背景

VN 创作本质是「演出编排」：宏观分支（Beat 图）+ 微观指令序列（对白/立绘/音频/镜头）。现有编辑器提供 React Flow 画布与 AXS 文本两种视图，但缺少 PR 式「预览 + 指令轨」的沉浸式工作台。用户熟悉剪辑软件的空间布局，但编辑对象是**可交互叙事演出**，不是视频文件。

ADR-009 已规划 v1.3「分轨时间轴 + 实时预览」；本 ADR 将剪辑台定为**默认主视图**，Flow/AXS 降为同一 Draft 的投影视图。

## 决策

### 概念映射

| 剪辑软件布局 | Axiforge 叙事对象 |
|----------|----------|
| 工程 Draft | `Project`（`axs_source` + nodes/edges） |
| 片段 Clip | `Instruction`（Beat 内 `script[]` 条目） |
| 预览监视器 | `PreviewMonitor`（`@axiforge/core` 引擎试演） |
| 指令轨 | `TimelineShell`（按指令类型分轨可视化） |
| 素材库 | `AssetBin`（Beat 列表 + 角色） |

### 三轨并存

1. **剪辑台（Cut）** — 默认入口：预览 + 时间轴 + Inspector
2. **剧本（Writer）** — AXS 文本轨，高级用户
3. **结构（Flow）** — React Flow 鸟瞰分支

同步通道：[`projection.ts`](../../apps/web/src/features/writer/lib/projection.ts)。

- **Writer → 图**：`saveWriter` / `syncNarrative`，ADR-016 **文本优先**覆写 nodes。
- **剪辑/结构 → AXS**：`saveAll` 成功后 `projectToAxs` 写回 `axs_source`；切到剧本轨前 `projectAxsFromCanvas` 投影当前画布（含未保存编辑）。
- **试玩**：读 DB `nodes[].script[]`；`update_node` / `save_edges` 后 bump `project.updated_at` 并失效 StoryPackage 缓存。

### 首版范围（壳层）

- 不引入第四套数据模型；时间轴只读映射 `Instruction[]`
- 编辑仍走 `ScriptEditor` / `NodeInspectorPanel`
- 不做：跨 Beat 拖拽排序、指令曲线关键帧、全片连续主轨、任何视频文件导出

## 后果

- ✅ 创作主路径对齐「演出即所得」北极星  
- ✅ 复用现有 IR/引擎，避免第三套播放逻辑  
- ⚠️ `ProjectFlowPage` 需拆分为多视图；路由 `/flow` 保留别名  

## 非目标（v5.1+）

- 指令分轨独立拖拽排序  
- 跨 Beat 连续主时间轴  
- 替换或删除 Flow/AXS 任一轨  
