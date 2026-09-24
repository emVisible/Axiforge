#!/usr/bin/env node
/**
 * 设计令牌门禁，两类规则：
 *
 * ① **硬编码颜色 = 硬线**（含 packages/ui 与全部 apps）。共享组件库一旦写死色值，
 *    日夜主题就会各说各话，所以这里零容忍。
 * ② **字号任意值 = 棘轮**（逐文件计数，只准变短）。12px 以下曾无任何有名分的档位，
 *    导致 text-[9px]/[10px]/[11px] 散落 168 处；一次性清零会改动大量密集界面布局，
 *    故按文件登记当前数量作上限，迁移一处降一处，不许新增。
 *    字阶低端已在 tokens.css 提供 --text-3xs / --text-2xs。
 *
 * Player HUD 与语法高亮 hex 不在范围内（有意为之，见各自注释）。
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
  "apps/web/src/features/studio",
  "apps/web/src/features/discover",
  "apps/web/src/features/character",
  "apps/admin/src",
  "packages/ui/src",
];

const PATTERNS = [
  { name: "arbitrary bg hex", regex: /bg-\[#/ },
  { name: "arbitrary text hex", regex: /text-\[#/ },
  { name: "text-white opacity", regex: /text-white\// },
  { name: "border-white opacity", regex: /border-white\// },
];

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

/** 字号任意值，如 text-[9px] / text-[10.5px] / max-sm:text-[11px] */
const FONT_ARBITRARY = /(?:^|[\s"'`:])(?:[a-z-]+:)*text-\[[0-9.]+px\]/g;
const FONT_BASELINE = path.join(root, "scripts", "ui-font-baseline.json");

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      walk(abs, files);
      continue;
    }
    if (SOURCE_EXT.has(path.extname(entry))) files.push(abs);
  }
  return files;
}

let failed = false;

for (const scanRoot of SCAN_ROOTS) {
  const absRoot = path.join(root, scanRoot);
  const files = walk(absRoot);

  for (const file of files) {
    const rel = path.relative(root, file);
    const lines = readFileSync(file, "utf8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      for (const { name, regex } of PATTERNS) {
        if (!regex.test(lines[i])) continue;
        failed = true;
        console.error(`[lint:colors] ${name} in ${rel}:${i + 1}`);
        console.error(`  ${lines[i].trim()}`);
      }
    }
  }
}

// ---- ② 字号任意值棘轮 ----
let fontBaseline = {};
try {
  fontBaseline = JSON.parse(readFileSync(FONT_BASELINE, "utf8"));
} catch {
  console.error("[lint:colors] 缺 scripts/ui-font-baseline.json，先跑 --update-fonts 生成");
  failed = true;
}

const fontWorsened = [];
const fontShrank = [];
const seenFiles = new Set();

for (const scanRoot of SCAN_ROOTS) {
  for (const file of walk(path.join(root, scanRoot))) {
    const rel = path.relative(root, file);
    seenFiles.add(rel);
    const hits = (readFileSync(file, "utf8").match(FONT_ARBITRARY) || []).length;
    const allowed = rel in fontBaseline ? fontBaseline[rel] : 0;
    if (hits > allowed) fontWorsened.push(`${rel}: ${hits} 处 > 棘轮 ${allowed}`);
    else if (hits < allowed) fontShrank.push(`${rel}: 实际 ${hits}，baseline 仍记 ${allowed}`);
  }
}

if (process.argv.includes("--update-fonts")) {
  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(path.join(root, scanRoot))) {
      const rel = path.relative(root, file);
      const hits = (readFileSync(file, "utf8").match(FONT_ARBITRARY) || []).length;
      if (hits) fontBaseline[rel] = hits;
      else delete fontBaseline[rel];
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(fontBaseline).sort((a, b) => b[1] - a[1]),
  );
  writeFileSync(FONT_BASELINE, `${JSON.stringify(sorted, null, 2)}\n`);
  const total = Object.values(sorted).reduce((a, b) => a + b, 0);
  console.log(`[lint:colors] 字号棘轮已更新：${Object.keys(sorted).length} 个文件，共 ${total} 处`);
  process.exit(0);
}

for (const rel of Object.keys(fontBaseline)) {
  if (!seenFiles.has(rel)) fontShrank.push(`${rel}: 文件已不存在，应删行`);
}

if (fontWorsened.length) {
  failed = true;
  console.error(
    `[lint:colors] FAIL —— ${fontWorsened.length} 个文件新增字号任意值（棘轮：只准变短）`,
  );
  for (const v of fontWorsened) console.error(`  - ${v}`);
  console.error("\n处置：改用 tokens.css 的 --text-3xs / --text-2xs（text-3xs / text-2xs）。");
}
if (fontShrank.length) {
  console.log(`[lint:colors] 字号棘轮可收紧 ${fontShrank.length} 处（--update-fonts 锁定）`);
  for (const t of fontShrank.slice(0, 6)) console.log(`  · ${t}`);
}

if (failed) {
  console.error(
    "\n[lint:colors] Use semantic tokens (--ax-* / text-ink / bg-surface) instead.",
  );
  process.exit(1);
}

console.log("[lint:colors] OK —— 硬编码色 0 处，字号任意值未增长");
