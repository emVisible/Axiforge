#!/usr/bin/env node
/**
 * 表单标签的编程关联门禁（G1 棘轮的同族）。
 * 判据形状三档：
 *   1) `<label htmlFor=…>`——字段标签；
 *   2) `<label id=…>` 且同文件确有 `aria-labelledby` 指到它——一整列行的命名分组；
 *      只挂 id 不接引用不算（那只是把门禁哄过去的假分组，读屏依旧念不出）。
 *   3) `<label>` 到 `</label>` 之间就包着控件——包裹型，天然合法。
 * 三档都不满足的就是"看着像标签、读屏却念不出字段名"，必须留在基线里具名豁免，
 * 新增一处即失败。基线为什么允许非空：#65 只剩一处 `ScriptEditor :: 分支选项`——
 * 它被 #68 堵住（没有 choice 行就没有那个组，改了也无法在点击层验收），故具名登记而不是静默放过。
 * 已知不覆盖：判据是文本级的——只确认同文件里出现过指到该 id 的 aria-labelledby，
 * 不校验它是否真在祖先链上，也不认跨文件引用（那种会被误判成假分组，需要时改成全仓扫）。
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
// 三个界面语汇层一起扫：创作端、中台、共享组件库（2026-09-29 实测 admin 3 处 / ui 6 处标签全合法，扩面零代价）
const SRC_ROOTS = ["apps/web/src", "apps/admin/src", "packages/ui/src"];
const baselinePath = join(root, "scripts/label-association-baseline.json");
const CONTROL = /<(input|textarea|select|Input|Textarea|Select|SearchInput|ToggleInput|TagEditor|SearchSelect)\b/;

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".tsx")) files.push(p);
  }
}
for (const rel of SRC_ROOTS) walk(join(root, rel));

const found = [];
const reasons = new Map();
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  // 命名分组档要有真引用才算数：光给 <label> 挂个 id 而没人 aria-labelledby 它，读屏照样念不出来
  // 三种写法都得认：aria-labelledby="x" / ={x} / ={`x`}
  const ariaRefs = [...src.matchAll(/aria-labelledby\s*=\s*(?:\{\s*["'`]([^"'`\n]*)["'`]\s*\}|\{\s*([^}\n]+?)\s*\}|["'`]([^"'`\n]*)["'`])/g)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .map((s) => s.replace(/[`"'\s]/g, ""));
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i];
    if (!head.includes("<label")) continue;
    // 只看这个 <label> 元素自身的开始标签（可能跨行）
    let open = head;
    for (let j = i + 1; j < lines.length && !open.includes(">"); j++) open += lines[j];
    let body = head;
    for (let j = i; j < Math.min(i + 18, lines.length); j++) {
      body += "\n" + lines[j];
      if (lines[j].includes("</label>")) break;
    }
    if (open.includes("htmlFor")) continue;
    const idMatch = open.match(/\bid=\{([^}]*)\}|\bid="([^"]*)"/);
    const idValue = idMatch ? (idMatch[1] ?? idMatch[2]).replace(/[`"'\s]/g, "") : "";
    if (idValue && ariaRefs.some((ref) => ref.includes(idValue))) continue;
    if (CONTROL.test(body)) continue;
    const m = body.match(/<label[^>]*>([\s\S]*?)<\/label>/);
    const text = (m ? m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "").slice(0, 24);
    const key = `${relative(root, file)} :: ${text}`;
    if (!reasons.has(key))
      reasons.set(
        key,
        idValue ? `挂了 id 却同文件无人 aria-labelledby（假分组）` : "既无 htmlFor、也不是命名分组、也没包控件",
      );
    found.push(key);
  }
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8")).allowed
  : [];

if (process.argv.includes("--update")) {
  writeFileSync(
    baselinePath,
    JSON.stringify({ allowed: found.sort(), note: "具名豁免；新增未列出的裸标签即失败" }, null, 2) + "\n",
  );
  console.log(`[labels] baseline 已写入：${found.length} 处具名豁免`);
  process.exit(0);
}

const extra = found.filter((f) => !baseline.includes(f));
const stale = baseline.filter((b) => !found.includes(b));
console.log(
  `[labels] 扫描 ${files.length} 个文件：裸标签 ${found.length} 处，基线允许 ${baseline.length} 处`,
);
if (stale.length) {
  console.log("  提示：基线里有 " + stale.length + " 条已经不存在（修完就该把它删掉，别留给后人当挡箭牌）");
}
if (extra.length) {
  for (const e of extra) console.log(`  ✗ 新增未具名的裸 <label>：${e} —— ${reasons.get(e) ?? ""}`);
  console.log("[labels] FAIL —— 补 htmlFor、或改命名分组/包裹型，或（仅在确有理由时）--update 具名登记");
  process.exit(1);
}
console.log("[labels] OK —— 没有新增「看着像标签却念不出字段名」的地方");
