#!/usr/bin/env node
/**
 * 表单标签的编程关联门禁（G1 棘轮的同族）。
 * 判据形状三档：
 *   1) `<label htmlFor=…>`——字段标签，且 **htmlFor 的目标必须真被本文件里某个 id 接住**
 *      （2026-09-30 收紧：原先只要求"提了 htmlFor"，`htmlFor={typoVariable}` 照样过。
 *       显式关联悬空时浏览器不会退回包裹式关联，读屏依旧念不出字段名）；
 *   2) `<label id=…>` 且同文件确有 `aria-labelledby` 指到它——一整列行的命名分组；
 *      只挂 id 不接引用不算（那只是把门禁哄过去的假分组，读屏依旧念不出）。
 *   3) `<label>` 到 `</label>` 之间就包着控件——包裹型，天然合法。
 * 三档都不满足的就是"看着像标签、读屏却念不出字段名"，必须修复；新增一处即失败。
 * 历史上 `ScriptEditor :: 分支选项` 曾因 choice 无法往返而豁免；2026-09-30 修复 AXS choice 往返并由 E38 验收后，基线已清空。
 * 已知不覆盖：判据是文本级的——
 * - 第 2 档只确认同文件里出现过指到该 id 的 aria-labelledby 记号，不校验它是否真在祖先链上；
 * - 第 1 档的悬空检查**以全仓为界**（2026-10-01 从"本文件"升上来）：DOM 里的 id 是全文档的，
 *   父组件 `useId()` 经 prop 传下去时定义点与 htmlFor 天然不同文件。全仓命中单独计数并打印，
 *   今天实测为 **0**；它一旦长起来就是在提醒"出现了跨文件传 id 的新形状"，而不是让门禁变哑。
 * - 元素归属靠"从 `id=` 往前找最近的开标签名"判定，所以 `<div id=…><input id=…></div>`
 *   这种一行两个标签的写法（真实代码里没有）会认错归属。
 *
 * 2026-10-01 复审修掉的四处**假绿**（四种写法都实测过：改前全绿、改后点名，且旧形状被装回去验过确实放过）：
 *   ① **标签自己的 id 接住自己的 `htmlFor`**：第 1 档原先只问"这个 id 有没有出现过"，
 *      于是 `<label id="ghost" htmlFor="ghost">` 里没有任何控件带这个 id 也算接住了。
 *      收紧到"目标 id 必须挂在**可标注元素**上"（`label[for]` 只能指向 labelable）。
 *      分母：全仓 11 处 htmlFor 的目标全部落在 input/select/textarea 与 Input/Select/Textarea 上 ⇒ 零误伤。
 *   ② **id 只写在注释里也算接住**：`idsOf` 吃全文。现在收成只认剥掉注释后的代码（与 check:purity /
 *      check:seams / check:dispatch 同一口径，四道门禁到这里终于用了同一个"代码 vs 散文"定义）。
 *   ③ **`<label htmlFor>`（写了属性没给取值）被放过**：取到空串、被 `if (target && …)` 短路掉。
 *      那不可能是笔误之外的任何意思，现在判违规。
 *   ④ **`aria-labelledby` 用子串比**：`ref.includes(idValue)` 让 `aria-labelledby="group-header-2"`
 *      接住一个 `id="g"` 的标签。aria-labelledby 本来就是**空格分隔的 id 引用列表**，
 *      语义单位是记号，现按空白切分后逐个相等比。
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
/** 把 htmlFor / id 的取值归一化成可比较的记号：去掉包裹花括号与引号、去空白 */
function idToken(raw) {
  return raw.replace(/^\{/, "").replace(/\}$/, "").replace(/["'`\s]/g, "");
}

/** 剥掉整行注释与行尾注释（判"代码里有没有这个形状"不能吃散文——见 check:purity / check:seams 同一口径） */
function codeOnly(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(?:\/\/|\/\*|\*)/.test(l))
    .map((l) => {
      let inStr = null;
      for (let k = 0; k < l.length; k++) {
        const c = l[k];
        if (inStr) {
          if (c === "\\") k += 1;
          else if (c === inStr) inStr = null;
          continue;
        }
        if (c === '"' || c === "'" || c === "`") {
          inStr = c;
          continue;
        }
        if (c === "/" && (l[k + 1] === "/" || l[k + 1] === "*")) return l.slice(0, k);
      }
      return l;
    })
    .join("\n");
}

/**
 * `id=` 挂在**哪个元素**上（从 id= 往前找最近的开标签，读标签名）。
 * 2026-10-01 复审新增：第 1 档原先只问"这个 id 有没有出现过"，
 * 于是 `<label id="ghost" htmlFor="ghost">` 里**标签自己的 id 接住了自己的 htmlFor**，
 * 而全文件没有任何控件带这个 id —— 显式关联照样悬空、读屏照样念不出字段名，门禁却放行。
 * 收紧到"目标 id 必须挂在**可标注元素**上"才是浏览器认的那条规则
 * （`label[for]` 只能指向 labelable：input/select/textarea/button/output/progress/meter）。
 * 分母：全仓 11 处 htmlFor 的目标**全部**落在 input/select/textarea 与 Input/Select/Textarea 上 ⇒ 零误伤。
 */
const LABELABLE = new Set([
  "input", "select", "textarea", "button", "output", "progress", "meter",
  // packages/ui 的封装控件：它们渲染出的根元素就是上面那些
  "Input", "Select", "Textarea", "ToggleInput", "SearchInput", "SearchSelect", "TagEditor",
]);

/** id → 挂在它上面的标签名集合 */
function idOwners(src) {
  const out = new Map();
  for (const m of src.matchAll(/\bid\s*=\s*(\{[^}]*\}|"[^"]*")/g)) {
    const lt = src.lastIndexOf("<", m.index);
    if (lt < 0) continue;
    const tag = src.slice(lt + 1).match(/^[A-Za-z][\w.]*/);
    const name = idToken(m[1]);
    if (!name) continue;
    if (!out.has(name)) out.set(name, new Set());
    if (tag) out.get(name).add(tag[0]);
  }
  return out;
}

const isLabelable = (tags) => !!tags && [...tags].some((t) => LABELABLE.has(t));
// 预扫两遍：DOM 里的 id 是整个文档全局的，所以「本文件找不到」不等于悬空——
// 父组件 useId() 生成的 id 经 prop 传下去时，定义点与 htmlFor 天然不在同一个文件。
// 全仓能找到**且挂在可标注元素上**的算合法但单独计数：它今天应为 0，
// 长起来就说明出现了新的跨文件传 id 形状，而不是让门禁变哑。
const ownersByFile = new Map();
const repoOwners = new Map();
for (const file of files) {
  const owners = idOwners(codeOnly(readFileSync(file, "utf8")));
  ownersByFile.set(file, owners);
  for (const [id, tags] of owners) {
    if (!repoOwners.has(id)) repoOwners.set(id, new Set());
    for (const t of tags) repoOwners.get(id).add(t);
  }
}
let crossFileHits = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const localOwners = ownersByFile.get(file);
  // 命名分组档要有真引用才算数：光给 <label> 挂个 id 而没人 aria-labelledby 它，读屏照样念不出来。
  // 三种写法都得认：aria-labelledby="x" / ={x} / ={`x`}。
  // **按空白切成记号再逐个比**（2026-10-01 复审）：原先是 `ref.includes(idValue)`，
  // 于是 `aria-labelledby="group-header-2"` 能接住一个 `id="g"` 的标签——`"group-header-2".includes("g")` 为真。
  // aria-labelledby 本来就是**空格分隔的 id 引用列表**，语义单位是记号而不是子串。
  const ariaRefs = [...src.matchAll(/aria-labelledby\s*=\s*(?:\{\s*["'`]([^"'`\n]*)["'`]\s*\}|\{\s*([^}\n]+?)\s*\}|["'`]([^"'`\n]*)["'`])/g)]
    .flatMap((m) => (m[1] ?? m[2] ?? m[3]).split(/\s+/).filter(Boolean));
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
    if (open.includes("htmlFor")) {
      // 第一档原来只要"提了 htmlFor"就算过——那等于放任 `htmlFor={typoVariable}`：
      // 显式关联指向一个没人接住的 id 时，浏览器不会退回包裹式关联，标签照样念不出字段名。
      const forMatch = open.match(/htmlFor\s*=\s*(\{[^}]*\}|"[^"]*")/);
      // 复审：`<label htmlFor>`（写了属性却没给取值）原先取到空串、被 `if (target && …)` 短路掉直接放过。
      // 那不可能是笔误之外的任何意思，所以判违规。
      if (!forMatch) {
        const m0 = body.match(/<label[^>]*>([\s\S]*?)<\/label>/);
        const t0 = (m0 ? m0[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "").slice(0, 24);
        const k0 = `${relative(root, file)} :: ${t0}`;
        if (!reasons.has(k0)) reasons.set(k0, `写了 htmlFor 却没给取值`);
        found.push(k0);
        continue;
      }
      const target = idToken(forMatch[1]);
      if (!isLabelable(localOwners.get(target))) {
        if (isLabelable(repoOwners.get(target))) {
          crossFileHits += 1; // 跨文件接住且挂在可标注元素上：合法，但要让它可见（见文件头的说明）
        } else {
          const m = body.match(/<label[^>]*>([\s\S]*?)<\/label>/);
          const text = (m ? m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "").slice(0, 24);
          const key = `${relative(root, file)} :: ${text}`;
          if (!reasons.has(key))
            reasons.set(
              key,
              localOwners.has(target)
                ? `htmlFor 指向「${target}」，但那个 id 没挂在任何可标注控件上（显式关联悬空）`
                : `htmlFor 指向「${target}」，但全仓没有任何可标注控件接住它（显式关联悬空）`,
            );
          found.push(key);
        }
      }
      continue;
    }
    const idMatch = open.match(/\bid=\{([^}]*)\}|\bid="([^"]*)"/);
    const idValue = idMatch ? (idMatch[1] ?? idMatch[2]).replace(/[`"'\s]/g, "") : "";
    if (idValue && ariaRefs.includes(idValue)) continue;
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
  `[labels] 扫描 ${files.length} 个文件：裸标签 ${found.length} 处，基线允许 ${baseline.length} 处，htmlFor 跨文件接住 ${crossFileHits} 处`,
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
