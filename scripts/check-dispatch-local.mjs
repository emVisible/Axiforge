#!/usr/bin/env node
/**
 * 分派口（apps/web/src/shared/storage/*Saves.ts / assetPool*.ts）里每个导出的 async 函数
 * 都必须有本地分支。桌面唯一化之后，"只走云端"的新函数等于给桌面留一个点进去没反应的入口，
 * 而它不会报错——只会静默失败（ADR-029 / S13-6 的前置）。
 * 2026-09-29 实测基线：4 个分派口文件、26 个导出 async 函数，全部有本地分支，0 处云端专属，
 * 所以这里不放豁免清单。（先前我那份统计写成 38，是因为 glob 让 assetPoolSaves.ts 被数了两遍。）
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "apps/web/src/shared/storage");
// 分派口的识别按命名约定 <域>Saves.ts / assetPool*，外加这个已知偏差（成就域没按约定命名）。
// 刻意不含 http* / tauri* / index：那是单一后端的实现侧与 Provider 工厂，要求它们有本地分支是范畴错误。
const DISPATCH_FILES = /^(.*Saves\.ts|assetPool.*\.ts|achievementDefs\.ts)$/;
const targets = readdirSync(dir).filter((n) => DISPATCH_FILES.test(n) && !n.endsWith(".test.ts"));

const offenders = [];
let total = 0;
for (const name of targets) {
  const src = readFileSync(join(dir, name), "utf8");
  for (const m of src.matchAll(/export async function (\w+)/g)) {
    total++;
    const rest = src.slice(m.index + m[0].length);
    const next = rest.search(/\nexport (async )?function/);
    const body = rest.slice(0, next === -1 ? rest.length : next);
    if (!/isLocal\(\)|isTauriEnvironment\(\)/.test(body)) offenders.push(`${name} :: ${m[1]}`);
  }
}

console.log(`[dispatch] 扫描 ${targets.length} 个分派口文件，导出 async 函数 ${total} 个`);
if (offenders.length) {
  for (const o of offenders) console.log(`  ✗ 没有本地分支（桌面会静默失败或偷偷发云端）：${o}`);
  console.log("[dispatch] FAIL —— 加本地分支（走 <域>Saves 的 provider 分派），或把这函数挪出分派口");
  process.exit(1);
}
console.log("[dispatch] OK —— 每个导出函数都有本地分支");
