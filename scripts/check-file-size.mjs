#!/usr/bin/env node
/**
 * 文件行数棘轮门禁（宪章 G1）。
 *
 * 为什么是棘轮而不是硬线：G1 的 400 行是本阶段要清零的目标，但仓库里仍有历史巨石
 * （播放页、编辑器 hook）。直接设硬线会让门禁红着无人理会，等于没有门禁。
 * 棘轮的规则只有一条——**只准变短，不准变长**：
 * 新文件一律 400；已在 baseline 里的老文件不得超过它登记过的长度。
 * 拆完一段就把 baseline 里那行删掉或调低，收益立刻被锁住。
 *
 * 用法：node scripts/check-file-size.mjs [--update]
 *   --update  把当前超限文件的行数写回 baseline（仅在刚完成拆分、要收窄棘轮时使用）
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const LIMIT = 400;
const SCAN = ["packages", "apps/web/src", "apps/desktop"];
const BASELINE = join(ROOT, "scripts", "file-size-baseline.json");
const TEST_RE = /\.(test|spec)\.(ts|tsx)$/;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name) && !TEST_RE.test(name)) yield full;
  }
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const found = new Map();

for (const root of SCAN) {
  for (const file of walk(join(ROOT, root))) {
    const rel = relative(ROOT, file);
    const lines = readFileSync(file, "utf8").split("\n").length;
    found.set(rel, lines);
  }
}

const violations = [];
const tightenings = [];

for (const [rel, lines] of [...found].sort((a, b) => b[1] - a[1])) {
  const allowed = rel in baseline ? baseline[rel] : LIMIT;
  if (lines > allowed) violations.push(`${rel}: ${lines} 行 > 棘轮 ${allowed}`);
  else if (rel in baseline && lines < allowed) {
    tightenings.push(`${rel}: 实际 ${lines}，baseline 仍是 ${allowed} → 可收紧`);
  }
}

// baseline 里指向已不存在文件的条目是纯噪音（文件被拆掉后应删行）
for (const rel of Object.keys(baseline)) {
  if (!found.has(rel)) tightenings.push(`${rel}: 已不存在，baseline 中的这一行应删除`);
}

if (process.argv.includes("--update")) {
  for (const [rel, lines] of found) {
    if (lines > LIMIT) baseline[rel] = lines;
    else delete baseline[rel];
  }
  const sorted = Object.fromEntries(
    Object.entries(baseline).sort((a, b) => b[1] - a[1]),
  );
  writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`[file-size] baseline 已更新：${Object.keys(sorted).length} 个超限文件`);
  process.exit(0);
}

if (violations.length) {
  console.error(`[file-size] FAIL —— ${violations.length} 个文件越过棘轮（G1：只准变短）`);
  for (const v of violations) console.error(`  - ${v}`);
  console.error("\n处置：按域外提成协作模块（参考 sqliteProject / memoryPools / httpDomains），不要在文件内继续堆。");
  process.exit(1);
}

if (tightenings.length) {
  console.log(`[file-size] 提示：${tightenings.length} 处棘轮可收紧（运行 node scripts/check-file-size.mjs --update 锁定）`);
  for (const t of tightenings.slice(0, 8)) console.log(`  · ${t}`);
}

console.log(`[file-size] OK —— 扫描 ${found.size} 个文件，0 处越线（新文件限 ${LIMIT} 行）`);
