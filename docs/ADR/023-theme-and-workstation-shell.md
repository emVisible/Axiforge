# ADR-023：全局日夜主题与剪辑台 Panel Shell

- **状态**：已采纳
- **日期**：2026-07-08
- **取代**：LAYOUT_V2「不做全局主题切换」非目标

## 背景

剪辑台落地后，Studio 壳层（浅色）与 Cut 工作区（硬编码深色 hex）视觉撕裂；Discover / 概览偏消费风大空白，与 DCC 工作台密度目标冲突。需要可维护的主题与可调面板空间系统。

## 决策

1. **语义 Token**：运行时变量 `--ax-*`，Tailwind `@theme` 桥接为 `bg-canvas` / `text-ink` 等；`[data-theme=light|dark]` 切换整套调色。
2. **ThemeProvider**：偏好 `system | light | dark` 落盘 `axiforge-theme`；顶栏一键切换；`index.html` 内联脚本防闪裂。
3. **轻量 Panel Shell（自研）**：不引入重型 docking 库。`SplitHandle` + 折叠 `PanelRail` + `localStorage` 尺寸。先覆盖 Cut 四区。
4. **专注模式**：收 Studio 侧栏为 icon rail（~48px），保持 Outliner/预览/Inspector 可用；快捷键与工具栏复位。
5. **产品默认**：用户未手切前可跟随系统；切换后**全局统一**当前主题（不做「外层浅 / 内层深」碎片双主题）。

## 后果

- **正**：壳层与剪辑台可同肤；面板宽度/高度可调且刷新保留；主题逻辑集中，减少 hex 分叉。
- **负**：Discover 氛围装饰在 light 下需简化（已：仅 dark 显示 Atmosphere）；部分历史 `theme="dark"` 调用需改为 `useTheme()`。
- **后续**：完整浮动停靠、用户布局预设；Player HUD 独立决策。

## 相关

- [`../LAYOUT_V3.md`](../LAYOUT_V3.md)
- [`../ADR/022-cut-studio-three-track-projection.md`](./022-cut-studio-three-track-projection.md)
