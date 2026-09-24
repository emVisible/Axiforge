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

/**
 * 棘轮规则表：逐文件计数，只准变短。
 * - 字号任意值：12px 以下曾有 182 处散落，字阶已补 text-3xs/text-2xs，迁移一处降一处
 * - transition-all：会连带动画 width/height/padding 等布局属性，密集界面里是真实的
 *   掉帧与「不该动的东西跟着动」来源；正确写法是列出要动的属性（或 transition-colors）
 */
const RATCHETS = [
  {
    id: "fonts",
    label: "字号任意值",
    regex: /(?:^|[\s"'`:])(?:[a-z-]+:)*text-\[[0-9.]+px\]/g,
    baseline: path.join(root, "scripts", "ui-font-baseline.json"),
    hint: "改用 tokens.css 的 --text-3xs / --text-2xs（text-3xs / text-2xs）。",
  },
  {
    id: "transitions",
    label: "transition-all",
    regex: /transition-all/g,
    baseline: path.join(root, "scripts", "ui-transition-baseline.json"),
    hint: "列出真正要动画的属性，或用 transition-colors / transition-opacity。",
  },
];

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

// ---- ② 棘轮规则：逐文件计数，只准变短 ----
const collect = () => {
  const out = [];
  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(path.join(root, scanRoot))) out.push(path.relative(root, file));
  }
  return out;
};
const files = collect();
const updateMode = process.argv.slice(2).find((a) => a.startsWith("--update"));

for (const rule of RATCHETS) {
  let baseline = {};
  try {
    baseline = JSON.parse(readFileSync(rule.baseline, "utf8"));
  } catch {
    if (!updateMode) {
      console.error(`[lint:colors] 缺 ${path.relative(root, rule.baseline)}，先跑 --update=${rule.id} 生成`);
      failed = true;
      continue;
    }
  }

  if (updateMode === `--update=${rule.id}` || updateMode === "--update=all") {
    const next = {};
    for (const rel of files) {
      const hits = (readFileSync(path.join(root, rel), "utf8").match(rule.regex) || []).length;
      if (hits) next[rel] = hits;
    }
    const sorted = Object.fromEntries(Object.entries(next).sort((a, b) => b[1] - a[1]));
    writeFileSync(rule.baseline, `${JSON.stringify(sorted, null, 2)}\n`);
    const total = Object.values(sorted).reduce((a, b) => a + b, 0);
    console.log(`[lint:colors] ${rule.label}棘轮已更新：${Object.keys(sorted).length} 个文件，共 ${total} 处`);
    continue;
  }
  /* 处于别的规则的更新模式时跳过本规则评估：此时 baseline 可能还不存在，
     拿它来判违规会把全部文件报成越线，制造一次假警报 */
  if (updateMode) continue;

  const worsened = [];
  const shrinkable = [];
  for (const rel of files) {
    const hits = (readFileSync(path.join(root, rel), "utf8").match(rule.regex) || []).length;
    const allowed = rel in baseline ? baseline[rel] : 0;
    if (hits > allowed) worsened.push(`${rel}: ${hits} 处 > 棘轮 ${allowed}`);
    else if (hits < allowed) shrinkable.push(`${rel}: 实际 ${hits}，baseline 仍记 ${allowed}`);
  }
  for (const rel of Object.keys(baseline)) {
    if (!files.includes(rel)) shrinkable.push(`${rel}: 文件已不存在，应删行`);
  }
  if (worsened.length) {
    failed = true;
    console.error(`[lint:colors] FAIL —— ${rule.label}新增 ${worsened.length} 个文件越棘轮（只准变短）`);
    for (const v of worsened) console.error(`  - ${v}`);
    console.error(`\n处置：${rule.hint}`);
  }
  if (shrinkable.length) {
    console.log(`[lint:colors] ${rule.label}棘轮可收紧 ${shrinkable.length} 处（--update=${rule.id} 锁定）`);
    for (const t of shrinkable.slice(0, 6)) console.log(`  · ${t}`);
  }
}

if (failed) {
  console.error(
    "\n[lint:colors] Use semantic tokens (--ax-* / text-ink / bg-surface) instead.",
  );
  process.exit(1);
}

console.log("[lint:colors] OK —— 硬编码色 0 处，字号任意值未增长");
