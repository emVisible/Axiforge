/**
 * 桌面化去留清单的取证脚本（单次遍历，人工核对用，不做门禁）。
 *
 * 输出：每个云端 api 模块 → 消费者文件 → 该文件是否含本地判据
 * （isLocalOnlyDeployment / isTauriEnvironment / 经 shared/storage 分派）。
 * 「无判据 + 页面在桌面可达」就是要找的第三类：删掉 web 之后会变成挂死或静默空态。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "apps/web/src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const byModule = new Map();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const mods = new Set();
  for (const m of text.matchAll(/from\s+["'](?:@\/shared\/api|\.\.\/api|\.\/api)\/([a-zA-Z]+)["']/g)) {
    if (m[1] !== "client") mods.add(m[1]);
  }
  if (!mods.size) continue;

  const guarded =
    /isLocalOnlyDeployment|isTauriEnvironment|from "@\/shared\/storage|from "\.\/(?:playerSaves|assetPoolSaves|assetRecords|httpDomains|draftDispatch)/.test(text);

  for (const mod of mods) {
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod).push({ file: relative(SRC, file), guarded });
  }
}

const rows = [...byModule.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [mod, consumers] of rows) {
  const naked = consumers.filter((c) => !c.guarded);
  console.log(
    `${mod.padEnd(12)} 消费者=${String(consumers.length).padStart(2)} 无本地判据=${String(naked.length).padStart(2)}`,
  );
  for (const c of naked.slice(0, 8)) console.log(`    ! ${c.file}`);
  if (naked.length > 8) console.log(`    …另有 ${naked.length - 8} 处`);
}
