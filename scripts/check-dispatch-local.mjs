#!/usr/bin/env node
/**
 * 分派口（apps/web/src/shared/storage/*Saves.ts / assetPool*.ts）里每个导出的 async 函数
 * 都必须有本地分支。桌面唯一化之后，"只走云端"的新函数等于给桌面留一个点进去没反应的入口，
 * 而它不会报错——只会静默失败（ADR-029 / S13-6 的前置）。
 * 2026-09-29 实测基线：5 个分派口文件、30 个导出 async 函数，全部满足三档合法之一，
 * 所以这里不放豁免清单。（先前我那份统计写成 38，是因为 glob 让 assetPoolSaves.ts 被数了两遍；
 * 再早的 26 漏了 achievementDefs.ts——它不按 <域>Saves.ts 命名，是已知偏差。）
 * 已知不覆盖：证据取自"分派判定之后到函数末尾"，所以"本地分支返回空桩 + 云端分支真调 provider"
 * 这种混合形状仍会过。要收紧得先做块级配对，本轮没有。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "apps/web/src/shared/storage");
// 分派口的识别按命名约定 <域>Saves.ts / assetPool*，外加这个已知偏差（成就域没按约定命名）。
// 刻意不含 http* / tauri* / index：那是单一后端的实现侧与 Provider 工厂，要求它们有本地分支是范畴错误。
const DISPATCH_FILES = /^(.*Saves\.ts|assetPool.*\.ts|achievementDefs\.ts)$/;
const targets = readdirSync(dir).filter((n) => DISPATCH_FILES.test(n) && !n.endsWith(".test.ts"));

const bodies = [];
for (const name of targets) {
  const src = readFileSync(join(dir, name), "utf8");
  for (const m of src.matchAll(/export async function (\w+)/g)) {
    const rest = src.slice(m.index + m[0].length);
    const next = rest.search(/\nexport (async )?function/);
    bodies.push({ file: name, fn: m[1], body: rest.slice(0, next === -1 ? rest.length : next) });
  }
}
// 同一批分派口里的导出名：本地分支可以经兄弟函数间接分派（如 searchImportItems → readItems）
const dispatchNames = new Set(bodies.map((b) => b.fn));

const offenders = [];
let total = 0;
for (const { file, fn, body } of bodies) {
  total++;
  const i = body.search(/isLocal\(\)|isTauriEnvironment\(\)/);
  if (i < 0) {
    offenders.push(`${file} :: ${fn} —— 没有本地分支`);
    continue;
  }
  // 只看"本地那一支"：从分派判定到 else 之前（找不到就取后文）
  const seg = body.slice(i);
  const direct = /await\s+(?:\w*[Dd]eps\.provider\(\)|p\.|provider\(\))/.test(seg);
  const indirect = [...dispatchNames].some((n) => new RegExp(`await\\s+${n}\\(`).test(seg));
  const registeredSkip = seg.includes("skipped-offline"); // 跨作品 Codex 那条是登记过的显式跳过，不是静默桩
  if (!direct && !indirect && !registeredSkip) {
    offenders.push(`${file} :: ${fn} —— 本地分支既不调 provider、也不经兄弟分派、也没有显式 skipped 标记`);
  }
}

console.log(`[dispatch] 扫描 ${targets.length} 个分派口文件，导出 async 函数 ${total} 个`);
if (offenders.length) {
  for (const o of offenders) console.log(`  ✗ 没有本地分支（桌面会静默失败或偷偷发云端）：${o}`);
  console.log("[dispatch] FAIL —— 加本地分支（走 <域>Saves 的 provider 分派），或把这函数挪出分派口");
  process.exit(1);
}
console.log("[dispatch] OK —— 每个导出函数都有本地分支");
