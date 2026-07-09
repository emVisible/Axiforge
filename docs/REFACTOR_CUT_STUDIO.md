# Cut Studio 重构计划（PR 式剪辑工作台）

> **文档性质**：剪辑台 v1 执行基准，接替 ADR-009 v1.3 时间轴目标的壳层落地。  
> **最后更新**：2026-07-08

## 目标

将剧本编辑默认入口升级为 PR 式工作台：**演出预览 + 指令轨 + 素材库**，与 AXS 文本轨、Flow 结构图三轨投影并存。借鉴剪辑软件的布局与交互习惯，编辑对象仍是叙事 IR，不是视频。

## 阶段

### Phase 0 — 文档

- [x] ADR-022《剪辑工作台与三轨投影模型》
- [x] 本清单 + ROADMAP/REFACTOR 摘要

### Phase 1 — PreviewMonitor

- [x] 从 `ScriptPreview` 抽取可嵌入 `PreviewMonitor`
- [x] 支持 `playheadIndex` 外部驱动

### Phase 2 — Cut 壳层

- [x] `cut/CutStudioLayout.tsx`
- [x] `cut/outliner/OutlinerPanel.tsx`
- [x] `cut/TimelineShell.tsx`
- [x] `cut/useCutPlayback.ts`

### Phase 3 — 三模式

- [x] `ProjectFlowPage` 默认 `cut` 模式
- [x] `剪辑 | 剧本 | 结构` SegmentedControl
- [x] `CutStudioView` 主视图

### Phase 4 — 播放头联动

- [x] Timeline Clip 点击高亮
- [x] Preview 与 `selectedClipIndex` 同步
- [x] ScriptEditor 变更刷新 Timeline

### Phase 5 — 收口

- [x] 路由/文案
- [x] `pnpm run build`
- [x] projection 相关测试

### Phase 6 — 视口与叙事语境

- [x] 锁定外层高度，仅面板内部滚动
- [x] 文案去视频化（指令/节拍/试演，非时间码/导出）

### Phase 7 — Outliner 与路由合并

- [x] 列表点进剧本 → 直接进入剪辑台（`/studio/projects/:id`）
- [x] 砍掉 `ProjectDetailPage`，旧 `/flow` 链接重定向
- [x] 左侧 `OutlinerPanel`：Beats / 舞台 / 角色 / 道具 / 项目（Blender 式垂直折叠）
- [x] 舞台筛选、角色/道具 CRUD、舞台库导入、导出 Markdown、删除剧本
- [x] 项目区展示世界观 / 规则 / 试玩快捷入口

## 北极星验收

| 场景 | 标准 |
|------|------|
| 创作者 | 打开项目默认剪辑台：预览 + 时间轴 + Outliner |
| 三轨切换 | 剪辑 ↔ 剧本 ↔ 结构不丢 script；保存后 AXS 投影同步 |
| 路由 | 列表 → 剪辑台；旧 `/flow` 自动跳转 |
| 工程 | build 通过 |

## 相关

- 下一阶段 UI/剪辑深化见 [`LAYOUT_V4.md`](./LAYOUT_V4.md)

## 后置（v2.1+）

- [x] 跨 Beat 连续主时间轴（`MasterTimelineBar` + 跨 Beat 连续预览）
- [x] 分轨独立排序（`reorderScriptWithinTrack`，各轨内独立拖拽）
- 演出节奏曲线 / 关键帧

### Phase 8 — UI 体验收口（见 LAYOUT_V4）

- [x] 侧栏 Cursor 式扁平；创作组合并；两字命名
- [x] 大厅「工作台」；去掉大厅「发现」
- [x] 新建场景弹窗可滚动；新建角色 UI 修正
- [x] 节点/剧本行号/Inspector 主题色修正
- [x] PreviewMonitor token 化（LAYOUT_V4 Phase R）
- [x] 指令 Clip 拖拽排序（LAYOUT_V4 Phase C+1）
- [x] Outliner 项目元信息 inline 编辑（LAYOUT_V4 Phase C+2）
