# Axiforge 创作界面 LAYOUT v3（主题 + DCC 面板壳）

> **文档性质**：接替 [`LAYOUT_V2.md`](./LAYOUT_V2.md)；推翻「不做全局主题切换」非目标。  
> **最后更新**：2026-07-08  
> **参考**：Blender Outliner、Premiere/AE 面板、Unity Editor、UE Dock

## 设计原则

1. **Token only** — 业务色禁止硬编码 hex；语义走 `--ax-*` / Tailwind `bg-canvas` 等
2. **一壳多肤** — 同一组件结构，`html[data-theme=light|dark]` 换肤
3. **空间可记账** — 面板宽高/折叠/专注态 localStorage 持久化
4. **剪辑优先** — Studio Cut 工作区先密后宽；Discover 消费厅渐进收敛

## 阶段

### Phase T — Theme + Tokens

- [x] `packages/ui/styles/tokens.css` 双主题 `--ax-*`
- [x] `ThemeProvider` + `axiforge-theme` + FOUC 防闪脚本
- [x] `AppHeader` 日夜切换（Studio / Discover / Account 共用）
- [x] Cut 面板去硬编码，改语义类

### Phase P — Panel Shell

- [x] `workstation/`：`SplitHandle` / `PanelRail` / `layoutStore` / `useCutLayout`
- [x] `CutStudioLayout` 可拖拽改 Outliner / Inspector / Timeline
- [x] 折叠边条 + 双击分隔条复位
- [x] 专注模式 + Studio 侧栏 icon rail
- [x] 快捷键：`\` Outliner · `]` Inspector · `Shift+\` Timeline · `F` / `Cmd+.` 专注

### Phase U — 密度与统一

- [x] 概览 `StatStrip` / 紧缩 `StatCard`
- [x] `cardTheme` / `searchTheme` 语义化（去平行 hex）
- [x] Discover 组件绑定 `useTheme()`，避免永远 `theme="dark"`

## 非目标（本轮仍不做）

- 自由浮动停靠窗（完整 Blender 级）
- 用户自定义面板 JSON 编辑器
- Player HUD 重做
- Discover 氛围层彻底重绘

## 相关 ADR

- [ADR-023](./ADR/023-theme-and-workstation-shell.md)
