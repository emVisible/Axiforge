#!/usr/bin/env node
/**
 * 发布目标棘轮（ADR-029：桌面是唯一构建与发布目标）——**只做残差登记与防增长，不判"该不该删"**。
 *
 * 为什么是棘轮而不是直接 fail-closed：`docs/REFACTOR.md` 那行验收里的"桌面是唯一发布目标"
 * 目前**在发布声明层未达成**（2026-10-01 02:46 机械复核），而清理它需要产品定档（§6 第②条：
 * CI 那段 `build:web && build:admin`、`vercel.json`、`docker-compose.yml` 删哪些）。
 * 定档之前，这道门禁负责让**残差可点名、且不会被悄悄加第四个**：
 * 命中集合等于基线 ⇒ OK；出现新残差 ⇒ FAIL；删掉一个 ⇒ 提示"基线应缩短"（具名基线随清偿缩短，否则棘轮等于没关）。
 *
 * 已知不覆盖（自报限度）：
 *   - 只扫两族形状：仓根的**部署声明文件**（vercel/netlify/docker-compose/Dockerfile/railway.toml/fly.toml）
 *     与 CI 里的 `pnpm build:web` / `pnpm build:admin` 步骤；别的外链（如 CDN 配置、第三方平台面板）不在面上。
 *   - 不判"这些残留是否真的会被发布"（`vercel.json` 是否仍连着某个远端项目，本仓看不出来）。
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const baselinePath = join(root, "scripts/publish-target-baseline.json");
const DEPLOY_FILES = [
  "vercel.json",
  "netlify.toml",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  "railway.toml",
  "fly.toml",
];
const CI_BUILD_RE = /pnpm (build:web|build:admin)/g;

const found = [];

for (const name of readdirSync(root)) {
  if (!DEPLOY_FILES.includes(name)) continue;
  if (existsSync(join(root, name))) found.push(`部署声明文件仍在仓根：${name}`);
}

const workflowsDir = join(root, ".github/workflows");
if (existsSync(workflowsDir)) {
  for (const name of readdirSync(workflowsDir)) {
    if (!name.endsWith(".yml") && !name.endsWith(".yaml")) continue;
    const rel = `.github/workflows/${name}`;
    const lines = readFileSync(join(workflowsDir, name), "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(CI_BUILD_RE)) {
        found.push(`CI 仍在构建非桌面目标：${rel}:${i + 1} ${m[0]}`);
      }
    });
  }
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : { allow: [] };
const allow = new Set(baseline.allow ?? []);
const fresh = found.filter((v) => !allow.has(v));
const cleared = [...allow].filter((v) => !found.includes(v));

if (process.argv.includes("--update")) {
  writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        allow: [...new Set(found)].sort(),
        _note: "发布目标残差（ADR-029）。清理一项后应重跑 --update 让它缩短，而不是留着当豁免。",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`[publish-target] baseline 已写入：${new Set(found).size} 条残差`);
} else if (fresh.length) {
  console.log(`[publish-target] FAIL —— 残差 ${found.length} 条（在册 ${allow.size}），新增 ${fresh.length} 条`);
  for (const v of fresh) console.log(`  - ${v}`);
  process.exitCode = 1;
} else {
  console.log(
    `[publish-target] OK —— 残差 ${found.length} 条全部在册（基线 ${allow.size}）` +
      (cleared.length ? `；已清 ${cleared.length} 条 ⇒ 基线该缩短：node scripts/check-publish-target.mjs --update` : ""),
  );
  for (const v of found) console.log(`  · ${v}`);
}
