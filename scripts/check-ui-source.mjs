#!/usr/bin/env node
/**
 * 共享组件的颜色必须真的被生成出来（宪章 · 主题系统）。
 *
 * 为什么要有这个门禁：Tailwind v4 只生成**扫得到的源里出现过的**类名。
 * `apps/admin/src/index.css` 少了 `@source "../../../packages/ui/src"` 那一行时，
 * `packages/ui` 组件里写的色板类名（Toast 的 `bg-red-50 text-red-800`、Badge 的
 * `text-rose-300`）在中台产物里**规则数为 0**——组件照样渲染、构建照样绿、
 * 肉眼只看得到"提示框没有颜色"。实测过：12 组前景/背景配对里 0 组按设计生效。
 *
 * 这条门禁断言的是配置形状（可机械判定），不是渲染结果——渲染结果的判据是
 * 浏览器里的 `getComputedStyle`，那一步我在上线前手工跑过并记进 ADR-028。
 * 它拦得住的是"新接一个应用忘了加 @source"和"某天把它删了"。
 *
 * 用法：node scripts/check-ui-source.mjs
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appsDir = path.join(root, "apps");

/** 只要求"用了 ui 包令牌的应用"扫 ui 源：纯工具应用不该被无关规则绑住。 */
const usesUiTokens = (css) => css.includes("@axiforge/ui/styles/tokens.css");
const scansUiSrc = (css) =>
  css.split("\n").some((l) => l.includes("@source") && l.includes("packages/ui/src"));

const rows = [];
const problems = [];

for (const app of readdirSync(appsDir, { withFileTypes: true })) {
  if (!app.isDirectory()) continue;
  const srcDir = path.join(appsDir, app.name, "src");
  if (!existsSync(srcDir)) continue;
  const cssFiles = readdirSync(srcDir).filter((f) => f.endsWith(".css"));
  for (const f of cssFiles) {
    const css = readFileSync(path.join(srcDir, f), "utf8");
    if (!usesUiTokens(css)) continue;
    const ok = scansUiSrc(css);
    rows.push({ app: `${app.name}/${f}`, ok });
    if (!ok) {
      problems.push(
        `[漏扫] apps/${app.name} 的 ${f} 引入了 @axiforge/ui 的令牌，却没有 ` +
          '`@source "../../../packages/ui/src";` —— packages/ui 组件里的色板类名' +
          "不会生成规则，组件会静默掉色（构建与测试都不会报）。",
      );
    }
  }
}

for (const r of rows) {
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.app}`);
}

if (problems.length) {
  console.error(`\n[ui-source] FAIL —— ${problems.length} 项`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`\n[ui-source] OK —— ${rows.length} 个入口都在扫 packages/ui/src 的源`);
