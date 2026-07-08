# ADR-019：Studio 侧栏导航与工作区模板

**状态**：已采纳  
**日期**：2026-07-08  
**关联**：[LAYOUT_V2.md](../LAYOUT_V2.md)

## 背景

Studio 原先将 TabBar 嵌在顶栏，角色页还有第三层 pill Tab，导致导航层级过深、视觉重心上移。列表页、表单页、画布页共用同一 `Shell max-w-7xl`，画布页像「网页里嵌工具」。

## 决策

1. **左侧全侧栏导航**（`StudioSidebar w-56`），顶栏仅保留品牌、全局搜索与账户。
2. **三种工作区模板**：
   - `list` — 列表页，`max-w-7xl`，`PageHeader` + `FilterToolbar` + `CardGrid`
   - `focus` — 表单页，`max-w-2xl` 居中单卡
   - `full` / `CanvasWorkspace` — 画布页全宽，脱离内容壳
3. **移动端**：`md:` 以下隐藏侧栏，底部 `StudioMobileNav` 提供一级入口。
4. **空状态**：`WorkflowGuide` 三步引导（Brief → 生成 → 审阅语义），替换纯文字描述。

## 后果

- 新增 `@axiforge/ui` 组件：`SidebarNav`、`WorkspaceHeader`、`WorkflowGuide`
- `ProjectFlowPage` 不再套 `Shell`，工具栏固定于画布顶栏
- 角色「我的 / 创建」从第三行 Tab 移入侧栏二级项

## 非目标

- 不改后端 API
- 不做全局 light/dark 主题切换
- Player 界面仅同步品牌图标，不重做布局
