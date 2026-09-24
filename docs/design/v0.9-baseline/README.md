# v0.9 设计巡检基线

成对截图是 Phase 8「改前/改后」验收的存档件。**本目录的图片是产物，不是真相源**：
它们只记录「某一次构建在某视口下的观感」，判据仍以代码与门禁为准。

## 第一对：共享组件样式恢复（2026-09-24）

| 文件 | 说明 |
|------|------|
| `*-before-select-fix.png` | 产物 CSS 缺 `appearance-none` / `right-3` / `top-1/2` / `pr-10` 等类时的状态 |
| `*-after-select-fix.png` | `apps/web/src/index.css` 加 `@source "../../../packages/ui/src"` 之后 |

拍摄条件（复现需一致，否则对比无意义）：
`pnpm --filter @axiforge/web build` + `vite preview --port 4173`，
Chromium 视口 1440×900，`--wait-for-timeout=2500~3000`，locale zh-CN，
后端为独立 `axiforge_e2e` 库（画面里的 `[e2e] …` 标题与 586 条计数是测试数据，不是产品内容）。

## 这一对说明什么

Tailwind v4 的自动源扫描不覆盖 `apps/web` 之外的 workspace 包，
所以**只在 packages/ui 出现的工具类从未进入产物**——组件源码正确而页面无样式。
修复后 CSS 由 90,043 → 103,863 字节。

推论即本目录存在的理由：**在此之前任何「设计令牌已统一」「主题对比度达标」的观感结论都不可信**，
因为被检查的界面本身就没拿到完整样式。Phase 8 的逐屏巡检必须从这一版基线重做。
