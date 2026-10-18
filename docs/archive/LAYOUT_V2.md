# Axiforge 创作界面与品牌体验升级（LAYOUT v2）

> **文档性质**：接替 `REFACTOR_V3.md` 阶段 C，定义阶段 D / E / F。  
> **最后更新**：2026-07-08  
> **参考**：[Viggle](https://viggle.ai)、[Seele AI VN Generator](https://www.seeles.ai/features/tools/ai-visual-novel-character-generator)、[World Anvil](https://www.worldanvil.com/)、[Notebook.ai](https://www.notebook.ai/)

## 设计原则

1. **导航在左，工作在右** — Studio 全侧栏主导航
2. **一屏一事** — 列表 / 表单 / 画布三种工作区模板
3. **空状态即教程** — WorkflowGuide 三步引导
4. **装饰服务于叙事** — Discover VN 语义图形，不堆无意义插画

---

## 阶段 D：Studio 创作壳

- [x] `StudioLayout` + `StudioSidebar`（`w-56`，一级 + 角色二级）
- [x] `AppHeader` 移除 TabBar，仅品牌 / 搜索 / 账户
- [x] `@axiforge/ui`：`SidebarNav` / `WorkspaceHeader`
- [x] `Shell` 扩展 `variant="list|focus|full"` + `CanvasWorkspace`
- [x] `ProjectCreatePage` → `variant="focus"`
- [x] `ProjectFlowPage` → `CanvasWorkspace`（全宽画布）
- [x] `WorkflowGuide` + 各列表空状态
- [x] 移动端 `StudioMobileNav` 底部导航
- [x] 移动端 `StudioSidebarDrawer` 侧栏抽屉（顶栏汉堡菜单）
- [x] `ProjectFlowPage` 工具栏迁入 `WorkspaceHeader`

## 阶段 E：品牌图标

- [x] `AppIcon` 无文字 SVG（叙事轴心：六边形 + 轴心高光）
- [x] `brand-mark.svg` / `favicon.svg`
- [x] `AppBrand` 接入（`PlayerHudBrand` 经 AppBrand 自动同步）
- [x] `index.html` title → Axiforge

## 阶段 F：Discover 氛围

- [x] `DiscoverAtmosphere`（noise + 光斑 + VN 线框）
- [x] `DiscoverHeroArt`
- [x] 公开内容统计条（`DiscoverStatsBar` 聚合 discover API）
- [x] 空状态 `WorkflowGuide` 精简版
- [x] 卡片 grid 错峰 `animate-fade-in`（`CardGrid stagger`）

---

## 实施顺序

| PR | 内容 | 状态 |
|----|------|------|
| PR1 | 阶段 E 品牌图标 | ✅ |
| PR2 | 阶段 D Studio 壳 | ✅ |
| PR3 | 阶段 F Discover 氛围 | ✅ |

## 非目标

- 不改后端 API；不引入 Lottie/外链插画库；不重做 Player 界面（仅同步图标）
- ~~不做全局主题切换~~ → 已由 [`LAYOUT_V3.md`](./LAYOUT_V3.md) / ADR-023 接替
