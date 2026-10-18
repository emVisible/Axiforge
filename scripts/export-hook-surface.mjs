#!/usr/bin/env node
/**
 * 导出一个 React hook 的公开返回面（顶层键名）作为拆分契约基线。
 *
 * 为什么要有这个：把上千行的 useProjectEditor 拆成若干子 hook，
 * 唯一可机械验证的「行为没变」判据就是**对外返回的符号集逐个相等**。
 * 靠人眼比对 60+ 个键必然漏，漏了就是运行时 undefined。
 *
 * 用法：node scripts/export-hook-surface.mjs <file.ts> [--write]
 *   无 --write 时与基线比对（不一致 exit 1）；--write 时覆盖基线。
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (!target) {
  console.error("用法: node scripts/export-hook-surface.mjs <file.ts> [--write]");
  process.exit(2);
}

const lines = readFileSync(target, "utf8").split("\n");

// 取最后一个顶层 `  return {`——更早的那些属于内部函数
let start = -1;
for (let i = lines.length - 1; i >= 0; i -= 1) {
  if (lines[i] === "  return {") {
    start = i;
    break;
  }
}
if (start === -1) {
  console.error(`未找到顶层 return 块：${target}`);
  process.exit(1);
}

const delta = (line) => {
  let d = 0;
  for (const ch of line) {
    if (ch === "{" || ch === "(" || ch === "[") d += 1;
    else if (ch === "}" || ch === ")" || ch === "]") d -= 1;
  }
  return d;
};

const keys = [];
let depth = 1; // 已进入 return {
for (let i = start + 1; i < lines.length; i += 1) {
  const line = lines[i];
  if (depth === 1) {
    const m = line.match(/^\s+(\w+)\s*(?:,\s*$|:\s|,\s*\S)/);
    if (m && !line.trimStart().startsWith("//")) keys.push(m[1]);
  }
  depth += delta(line);
  if (depth === 0) break;
}

const surface = [...new Set(keys)].sort();
const baselinePath = join(dirname(fileURLToPath(import.meta.url)), "editor-hook-surface.json");

if (process.argv.includes("--write")) {
  writeFileSync(baselinePath, `${JSON.stringify(surface, null, 2)}\n`);
  console.log(`[hook-surface] 基线已写入：${surface.length} 个符号`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error("[hook-surface] 基线不存在，先用 --write 生成");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const missing = baseline.filter((k) => !surface.includes(k));
const added = surface.filter((k) => !baseline.includes(k));

if (missing.length || added.length) {
  console.error(
    `[hook-surface] FAIL —— 公开返回面与基线不一致（基线 ${baseline.length} / 当前 ${surface.length}）`,
  );
  if (missing.length) console.error(`  丢失: ${missing.join(", ")}`);
  if (added.length) console.error(`  多出: ${added.join(", ")}`);
  process.exit(1);
}
console.log(`[hook-surface] OK —— ${surface.length} 个公开符号逐个相等`);
