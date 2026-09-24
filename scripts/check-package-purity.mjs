#!/usr/bin/env node
/**
 * 内核纯净度门禁（宪章 Q9 / KERNEL_DESIGN §一 依赖方向铁律）。
 *
 * L0–L4（core / axs / editor-core）必须零 React、零 DOM、零平台能力：
 * 这是桌面化能成立的前提——同一份内核既要跑在浏览器，也要跑在 Tauri 壳与 Node 测试里。
 * 规约早就写了「CI 断言」，但流水线里从来没有这一步，于是这条断言只存在于文档。
 * 本脚本把它变成事实。
 *
 * 用法：node scripts/check-package-purity.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

/** 受最严约束的内核包（packages/ui 是组件库，天然依赖 React，不在此列） */
const PURE_PACKAGES = ["core", "axs", "editor-core"];

const BANNED = [
  { re: /from\s+["']react["']/, why: "import react" },
  { re: /from\s+["']react-dom/, why: "import react-dom" },
  { re: /from\s+["']@tauri-apps\//, why: "import tauri api（平台能力，属 L5）" },
  { re: /from\s+["']@tanstack\//, why: "import tanstack query（宿主状态层）" },
  { re: /from\s+["']zustand["']/, why: "import zustand（L5 专属）" },
  { re: /\bdocument\./, why: "使用 document（DOM API）" },
  { re: /\bwindow\./, why: "使用 window（DOM API）" },
  { re: /\blocalStorage\b/, why: "使用 localStorage（浏览器存储）" },
  { re: /\bXMLHttpRequest\b/, why: "使用 XHR（网络能力）" },
  { re: /(^|[^.\w])fetch\s*\(/, why: "使用 fetch（网络能力，属 L5 适配器）" },
];

/** 行内豁免：`// purity-allow: <理由>`（必须写理由，防止整文件关掉） */
const ALLOW_MARK = "// purity-allow:";

function* tsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* tsFiles(full);
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      yield full;
    }
  }
}

const violations = [];
let scanned = 0;

for (const pkg of PURE_PACKAGES) {
  const src = join(ROOT, "packages", pkg, "src");
  for (const file of tsFiles(src)) {
    scanned += 1;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes(ALLOW_MARK)) return;
      for (const { re, why } of BANNED) {
        if (re.test(line)) {
          violations.push(`${relative(ROOT, file)}:${i + 1}  ${why}\n      ${line.trim()}`);
        }
      }
    });
  }
}

if (violations.length) {
  console.error(`内核纯净度门禁失败（${violations.length} 处，扫描 ${scanned} 文件）：\n`);
  for (const v of violations) console.error(`  ✗ ${v}`);
  console.error(
    `\nL0–L4 不得依赖 React/DOM/网络/平台能力（KERNEL_DESIGN §一）。确需例外时在该行加 \`// purity-allow: <理由>\`。`,
  );
  process.exit(1);
}

console.log(`内核纯净度门禁通过：${scanned} 个文件，0 处平台依赖违规。`);
