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

## 第二对：字号收口（9px / 8px → 10px）

| 文件 | 说明 |
|------|------|
| `editor-before-9px.png` | Outliner 与主时间轴在 9px/8px 下的状态 |
| `editor-after-9px-and-8px.png` | 45 处换成 `text-3xs` 之后 |

结论：版式一致、无换行无溢出，预设的「挤破就减标签」fallback 未触发。

## 暗色主题核验（我改过暗色令牌，所以必须看暗色）

| 文件 | 说明 |
|------|------|
| `discover-dark-after-tuning.png` | 暗色 + 调色后（`--ax-ink-faint` 由 #5a5a6a 提到 #6f6f85） |
| `projects-dark-after-tuning.png` | 暗色剧本列表 |

拍摄方式：`playwright screenshot --load-storage`，localStorage 预置 `axiforge-theme=dark`。
**并核对主题确实生效**（切换按钮显示为「日」图标＝当前是暗色），
否则很容易演成一幕「以为在看暗色、其实还是亮色」的假验证。

## 尚未覆盖（不要把这些图片当成全站已巡检）

已看过的只有 discover / studio projects / editor 三个界面，
角色详情、发现各 tab、玩家页、admin 端均未逐屏核验。
