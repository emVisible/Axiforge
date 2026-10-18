# Axiforge 创作界面 LAYOUT v4（体验收口 + 剪辑深化 + 工程优化）

> **文档性质**：接替 [`LAYOUT_V3.md`](./LAYOUT_V3.md) 与近期 UI 反馈轮；与 [`REFACTOR_CUT_STUDIO.md`](./REFACTOR_CUT_STUDIO.md) Phase 8+ 并行。  
> **最后更新**：2026-07-08  
> **北极星**：Studio 全链路「一肤、一密、一壳」；剪辑台达到可日用的 DCC 密度。

---

## 现状摘要（v3 已交付）

| 域 | 状态 |
|----|------|
| 主题 | `ThemeProvider` + `--ax-*` + 顶栏切换 |
| 剪辑壳 | 可调 Outliner / Inspector / Timeline + 专注模式 |
| 路由 | 列表 → 剪辑台；详情页已砍 |
| 侧栏 | Cursor 式扁平分组；创作五字项（剧本/道具/场景/角色） |
| 文案 | 大厅「工作台」；大厅无「发现」 |

## 剩余技术债（扫描）

| 区域 | 问题 |
|------|------|
| 角色详情 / Story 页 | 少量 `bg-amber-50` 等语义色块（低优） |
| Player HUD | 刻意独立暗色（非本版目标） |

Phase R / W / C+ / B / D / K 已交付；`pnpm lint:colors` 门禁覆盖 studio / discover / character 路径。

---

## 设计原则（延续 v3）

1. **Token only** — 新增样式禁止 hex / `white/opacity` 业务色
2. **一壳多肤** — 同一 DOM，`data-theme` 换肤；`embedded` 组件用 `variant` 而非平行色板
3. **密而不挤** — 列表/表单/面板优先行密度；卡片仅 Discover 封面区保留
4. **剪辑优先** — Studio 工作区迭代先于大厅视觉翻新

---

## Phase R — Residual Token 清扫（1 PR）

**目标**：消除 Studio / Discover / 角色创作路径上的硬编码色，白天夜间无「孤岛 UI」。

| 任务 | 路径 | 状态 |
|------|------|------|
| PreviewMonitor 语义化 | `apps/web/src/features/studio/components/PreviewMonitor.tsx` | ✅ |
| Discover Tab 元信息 | `Discover*Tab.tsx`、`DiscoverStatsBar.tsx` → `text-ink-faint` | ✅ |
| 角色 Story 页 | `StoryReadPage` / `StoryEditPage` blockquote 背景 | ✅ |
| Discover 详情/作者页 | `DiscoverProjectDetailPage`、`AuthorPage` 跟随 `theme` | ✅ |
| 移除 `SurfaceTheme` 传参 | `CoverCard`、`EntityCard`、`CommentThread` 内部读 `useSurfaceTheme()` | ✅ |
| grep 门禁 | `scripts/check-ui-tokens.mjs` + `pnpm lint:colors` | ✅ |

**验收**：切换日夜后，剪辑预览 / 创建角色 / Discover 列表无刺眼反差块。

---

## Phase W — WorkspaceChrome 统一（1 PR）

**目标**：顶栏、分段控件、工具栏按钮在同一 API 下工作，padding 一致。

| 组件 | 改动 | 状态 |
|------|------|------|
| `WorkspaceHeader` | `dense` / `immersive` variant；剪辑模式默认 `py-2` | ✅ |
| `WorkspaceToolbar` | 顶栏工具组容器 | ✅ |
| `SegmentedControl` | 去掉 `variant` prop，读 token；活跃态 `bg-panel-raised` | ✅ |
| `Button` | token 单套样式；`size="toolbar"` 32px hit area | ✅ |
| 剪辑顶栏 | `CutLayoutToolbar` 子组件 | ✅ |

**验收**：Flow / Writer / Cut 三模式顶栏高度、分段控件、主按钮间距一致。

---

## Phase C+ — 剪辑台能力深化（2–3 PR）

**目标**：从「能看能点」到「能剪能排」。

### C+1 时间轴编辑

- [x] 指令 Clip 拖拽排序（单 Beat 内 `script[]` 重排）
- [x] 拖拽时预览播放头跟随
- [x] 删除/复制单条 instruction（Inspector 快捷操作）

### C+2 Outliner 增强

- [x] 项目区 inline 编辑：简介、世界观、规则（失焦保存）
- [x] 舞台行：地点/氛围 tooltip 与行内缩写
- [x] Beat 行：双击重命名

### C+3 三轨联动

- [x] Outliner 选 Beat → Timeline 滚动到 Beat 起点
- [x] Outliner「剧本」→ Writer 定位到当前 Beat 行
- [x] Flow 选节点 ↔ Outliner 高亮（共享 `selectedNode`）
- [x] **内容同步**：剪辑/结构 `saveAll` → `projectToAxs` 写回 `axs_source`；切剧本轨 `projectAxsFromCanvas` 投影
- [x] **试玩缓存**：`update_node` / `save_edges` bump `updated_at` + `story_cache.invalidate`

**验收**：剪辑改指令 → 保存 → 剧本轨可见同内容；试玩与剪辑预览一致。

---

## Phase D — Discover 密度（1 PR，渐进）

**目标**：消费厅保持封面气质，但减少无效留白；与 Studio token 对齐。

- [x] `CoverCard` compact 变体：`density="compact"`，栅格 `gap-3`、封面 `h-32`
- [x] StatsBar 并入 PageHeader 一行（桌面右侧；移动端独立行；可折叠）
- [x] 暗色 Atmosphere 仅在 `theme=dark`（`PublicLayout` 已有）
- [x] 文案统一：「场景模板」→「场景」（前端已完成）

**非目标**：不重做 Hero 插画、不砍评论讨论区。

---

## Phase B — 工程与性能（1 PR）

**目标**：首屏与剪辑台加载可感知变快。

| 任务 | 做法 | 状态 |
|------|------|------|
| Flow 懒加载 | `ProjectFlowPage` 内 `React.lazy` FlowStudioView / WriterStudioView | ✅ |
| React Flow CSS | 仅 `FlowStudioView` import `reactflow/dist/style.css` | ✅ |
| 布局状态 | `layoutStore` 与 `ThemeProvider` 合并（可选） | 跳过 |
| Bundle 预算 | `manualChunks` 拆 `vendor-reactflow` / `vendor-codemirror` | ✅ |
| 模式预取 | 顶栏分段控件 `mouseenter` 预取剧本/结构 chunk | ✅ |

**验收结果**（build 2026-07-08）：

| Chunk | 体积 (gzip) |
|-------|-------------|
| `ProjectFlowPage` | 72 KB → **21 KB**（原 ~554 KB / 173 KB） |
| `vendor-reactflow` | 154 KB → 50 KB（结构模式 + hooks） |
| `vendor-codemirror` | 331 KB → 107 KB（剧本模式按需） |
| `FlowStudioView` | 5 KB → 2 KB |
| `WriterStudioView` | 10 KB → 4 KB |

---

## Phase K — 键盘与可发现性（0.5 PR）

**目标**：专业用户不靠猜。

- [x] `?` 打开快捷键浮层（Outliner / Inspector / Timeline / 专注）
- [x] 面板折叠态 tooltip 显示快捷键
- [x] Modal 打开时聚焦对话框；Esc 关闭（`Modal` / 侧栏抽屉已有）

---

## 实施顺序（建议 PR 序列）

```
R1 Token 清扫（PreviewMonitor + Discover）
  ↓
W1 WorkspaceChrome 统一
  ↓
C+1 时间轴拖拽排序
  ↓
C+2 Outliner inline 元信息
  ↓
C+3 三轨联动补强
  ↓
B1 路由级 code-split
  ↓
D1 Discover 密度
  ↓
K1 快捷键浮层
```

## 非目标（v4 仍不做）

- Player 演出 HUD 主题合并
- 浮动窗自由停靠（Blender 完整级）
- 视频导出 / MP4
- AI 运行时与世界 tick

## 相关文档

- [LAYOUT_V3](./LAYOUT_V3.md) — 主题 + Panel Shell（已完成）
- [ADR-023](../ADR/023-theme-and-workstation-shell.md)
- [REFACTOR_CUT_STUDIO](./REFACTOR_CUT_STUDIO.md) — 剪辑台功能清单
- [ROADMAP_FINAL](./ROADMAP_FINAL.md) — 楔子1 演出即所得
