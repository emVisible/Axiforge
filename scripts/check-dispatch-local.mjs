#!/usr/bin/env node
/**
 * 分派口（apps/web/src/shared/storage/*Saves.ts / assetPool*.ts）里每个导出的 async 函数
 * 都必须有本地分支。桌面唯一化之后，"只走云端"的新函数等于给桌面留一个点进去没反应的入口，
 * 而它不会报错——只会静默失败（ADR-029 / S13-6 的前置）。
 * 2026-09-29 实测基线：5 个分派口文件、30 个导出 async 函数，全部满足三档合法之一，
 * 所以这里不放豁免清单。（先前我那份统计写成 38，是因为 glob 让 assetPoolSaves.ts 被数了两遍；
 * 再早的 26 漏了 achievementDefs.ts——它不按 <域>Saves.ts 命名，是已知偏差。）
 * 已知不覆盖（2026-09-30 更新）：
 * - **正向 `if (isLocal()) { … }` 那一档已收紧**：证据必须落在该 `if` 的**花括号块内**，
 *   所以「本地分支返回空桩 + 块外真调 provider」这种混合形状现在会红（本轮之前的漏检）。
 * - **反向守卫 `if (!isLocal()) return cloud();` 仍取"判定之后到函数末尾"**：这一族的本体就是守卫之后的整段，
 *   块级配对反而会把本地路径切掉；`const local = isLocal()` 那种 flag 形状同理。
 * - 配对是文本级的：为跳过模板串与注释里的花括号，做了引号/行注释的粗 tokenizer，
 *   但它不认正则字面量与嵌套模板串里的 `${}`——真要写那种形状就会误判，届时应换成 AST。
 * - **2026-10-01 复审另记两条否掉的**（写进来就会是假账）：① 「收紧后的正向档能被空块骗过」**不成立**——
 *   实测 `if (isLocal()) {}`、`if (isLocal()) { return null; }`、块内只有一行 TODO 注释，三种都照红；
 *   ② 「守卫里出现 `skipped-offline` 就算数」这一条**曾成立**，现已收成只认代码（见下）。
 *   收紧的那一档：`registeredSkip` 原是整个窗口的 `seg.includes(...)`，注释里写一句那个串就能过，
 *   现在只认剥掉注释后的代码。牙：注释里提一句 `skipped-offline` ⇒ 由绿转红；真用法（`playerSaves.ts` 两处
 *   `return { …, via: "skipped-offline" }`）⇒ 仍绿。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "apps/web/src/shared/storage");
const apiDir = join(process.cwd(), "apps/web/src/shared/api");
// 分派口的识别按命名约定 <域>Saves.ts / assetPool*，外加这个已知偏差（成就域没按约定命名）。
// 刻意不含 http* / tauri* / index：那是单一后端的实现侧与 Provider 工厂，要求它们有本地分支是范畴错误。
const DISPATCH_FILES = /^(.*Saves\.ts|assetPool.*\.ts|achievementDefs\.ts)$/;
const targets = readdirSync(dir).filter((n) => DISPATCH_FILES.test(n) && !n.endsWith(".test.ts"));
/**
 * 第二张面：`shared/api/draftDispatch.ts` 同样在做本地/云端分派（本地模型 → 规则保底 → 云端只当 fallback），
 * 但按 `<域>Saves.ts` 的命名约定它整个落在面外（2026-10-09 第四十五批量出来的）。
 * 扩面之前先量过：原判据"本地证据＝调 provider"套在它身上会把两条都误报成"没有本地分支"，
 * 所以本地证据同时承认 `await 注入的本地能力(...)` 与"退回规则保底"，而 **`remote` 被显式排除**
 * （本地窗口里出现云端调用不是证据，那是这条判据最容易被糊弄的方向）。
 */
const EXTRA_DISPATCH = [
  [apiDir, /^draftDispatch\.ts$/],
].flatMap(([d, re]) => {
  try {
    return readdirSync(d).filter((n) => re.test(n)).map((n) => [d, n]);
  } catch {
    return [];
  }
});

/** 从 openIdx 处的 `{` 找到配对闭括号的位置（跳过字符串与行注释里的花括号） */
function blockEnd(text, openIdx) {
  let depth = 0;
  for (let k = openIdx; k < text.length; k++) {
    const c = text[k];
    if (c === '"' || c === "'" || c === "`") {
      k += 1;
      while (k < text.length && text[k] !== c) {
        if (text[k] === "\\") k += 1;
        k += 1;
      }
      continue;
    }
    if (c === "/" && text[k + 1] === "/") {
      while (k < text.length && text[k] !== "\n") k += 1;
      continue;
    }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return k + 1;
    }
  }
  return -1;
}

/** `if (` 条件的右括号位置（从 guardStart 的 `if (` 起算；先减再判，否则配不上第一个 `)`） */
function conditionEnd(body, guardStart) {
  let depth = 0;
  for (let k = guardStart + 3; k < body.length; k++) {
    const c = body[k];
    if (c === "(") depth += 1;
    else if (c === ")") {
      depth -= 1;
      if (depth === 0) return k;
    }
  }
  return -1;
}

/**
 * 剥掉行尾注释（`//` 与 `/*` 起头），字符串内部的 `//` 不算注释起头。
 * 与 `check-package-purity.mjs` 的 `codePart` 同形：判"代码里有没有这个形状"不能吃散文。
 */
function codePart(line) {
  let inStr = null;
  for (let k = 0; k < line.length; k++) {
    const c = line[k];
    if (inStr) {
      if (c === "\\") k += 1;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "/" && (line[k + 1] === "/" || line[k + 1] === "*")) return line.slice(0, k);
  }
  return line;
}

/** 剥掉整行注释与行尾注释，只留代码（用于"这个记号出现在代码里"这一档） */
function codeOnly(text) {
  return text
    .split("\n")
    .filter((l) => !/^\s*(?:\/\/|\/\*|\*)/.test(l))
    .map(codePart)
    .join("\n");
}

/**
 * 取「本地那一支」的证据窗口。
 * 正向 if (本地) 形状只看它自己的块；反向守卫与 flag 形状取判定之后到函数末尾。
 */
function localWindow(body, checkIdx) {
  const guardStart = body.lastIndexOf("if (", checkIdx);
  const cond = guardStart >= 0 ? body.slice(guardStart, checkIdx) : "";
  const inverted = /!\s*[\w.]*\s*$/.test(cond); // `if (!x.isLocal())` 这种反向守卫
  if (guardStart >= 0 && !inverted) {
    const closeParen = conditionEnd(body, guardStart);
    if (closeParen > checkIdx) {
      const brace = body.indexOf("{", closeParen);
      const semicolon = body.indexOf(";", closeParen);
      if (brace >= 0 && (semicolon < 0 || brace < semicolon)) {
        const end = blockEnd(body, brace);
        if (end > brace) return { form: "positive-block", seg: body.slice(brace, end) };
      }
      if (semicolon > closeParen) {
        return { form: "positive-statement", seg: body.slice(closeParen, semicolon) };
      }
    }
  }
  return { form: "after-guard", seg: body.slice(checkIdx) };
}

const bodies = [];
for (const [base, name] of targets.map((n) => [dir, n]).concat(EXTRA_DISPATCH)) {
  const src = readFileSync(join(base, name), "utf8");
  for (const m of src.matchAll(/export async function (\w+)/g)) {
    const rest = src.slice(m.index + m[0].length);
    const next = rest.search(/\nexport (async )?function/);
    bodies.push({ file: name, fn: m[1], body: rest.slice(0, next === -1 ? rest.length : next) });
  }
}
// 同一批分派口里的导出名：本地分支可以经兄弟函数间接分派（如 searchImportItems → readItems）
const dispatchNames = new Set(bodies.map((b) => b.fn));

const offenders = [];
const forms = new Map();
let total = 0;
for (const { file, fn, body } of bodies) {
  total++;
  const i = body.search(/isLocal\(\)|isTauriEnvironment\(\)/);
  if (i < 0) {
    offenders.push(`${file} :: ${fn} —— 没有本地分支`);
    continue;
  }
  const { form, seg } = localWindow(body, i);
  forms.set(form, (forms.get(form) ?? 0) + 1);
  const direct =
    /await\s+(?:\w*[Dd]eps\.provider\(\)|p\.|provider\(\))/.test(seg) ||
    // AI 草稿那族不通过 Provider 分派，它 await 的是**注入进来的本地能力**（`draftDeps.model(...)`）
    // 或退回规则保底（`rulesDraft(...)`）。`remote` 被显式排除：本地窗口里出现云端调用不是证据。
    /await\s+\w*[Dd]eps\.(?!remote\b)\w+\(/.test(seg) ||
    /\b\w*[Rr]ules(Draft|Fallback)?\(/.test(seg);
  const indirect = [...dispatchNames].some((n) => new RegExp(`await\\s+${n}\\(`).test(seg));
  // 显式跳过标记（跨作品 Codex 那条是登记过的显式跳过，不是静默桩）。
  // 2026-10-01 复审：原先是 `seg.includes("skipped-offline")` —— 整个窗口的**任何位置**出现那个串就算过，
  // 于是 `// 这条以前是 skipped-offline，现在应该本地化` 这样一句注释就能买一张通行证。
  // 现在只认剥掉注释后的代码（与 check:purity / check:seams 同一口径）。
  // 分母：在册真用法是 `playerSaves.ts:189,211` 两处 `return { …, via: "skipped-offline" }`，都在代码里 ⇒ 零误伤。
  const registeredSkip = codeOnly(seg).includes("skipped-offline");
  if (!direct && !indirect && !registeredSkip) {
    offenders.push(
      `${file} :: ${fn} —— 本地那一支（${form}）既不调 provider、也不经兄弟分派、也没有显式 skipped 标记`,
    );
  }
}

console.log(
  `[dispatch] 扫描 ${targets.length + EXTRA_DISPATCH.length} 个分派口文件（storage ${targets.length} + api ${EXTRA_DISPATCH.length}），导出 async 函数 ${total} 个`,
);
if (EXTRA_DISPATCH.length === 0) {
  console.log("[dispatch] FAIL —— 面二（shared/api/draftDispatch.ts）命中 0 个文件：它被移动或改名了，这张面正在静默消失");
  process.exit(1);
}
console.log(`[dispatch] 本地分支形状分布：${[...forms].map(([k, v]) => `${k}=${v}`).join("、")}`);
if (offenders.length) {
  for (const o of offenders) console.log(`  ✗ 没有本地分支（桌面会静默失败或偷偷发云端）：${o}`);
  console.log("[dispatch] FAIL —— 加本地分支（走 <域>Saves 的 provider 分派），或把这函数挪出分派口");
  process.exit(1);
}
console.log("[dispatch] OK —— 每个导出函数都有本地分支");
