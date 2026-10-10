#!/usr/bin/env node
/**
 * 桌面接缝判据覆盖对账（第 14 道门禁）。
 *
 * 为什么是这一条判据：2026-10-01 这一天里，"桌面生产模块零判据"被我**手工**发现了三次
 * （`tauriSqlBackend.ts` 的 I4 事务形状、`tauriAssetStore.ts` 的摘要降级、`axspImport` 的回滚出口），
 * 三次都靠人正好读到那个文件。共同的、机械可判的特征是：**直接依赖 `@tauri-apps/*` 的模块只在桌面壳里跑到**，
 * 而壳零 CI 信号、契约套件跑的是 Memory/sql.js——所以这些模块一旦没有同名测试，就是"发布产物里没人验过的代码"。
 * 本脚本把这个特征变成棘轮。
 *
 * 三层判据（都机械可判、今天零误报）：
 *   1. 该模块必须有一个同名测试文件（`x.ts` → `x.test.ts` 或 `x.test.tsx`）；
 *   2. 那个测试文件必须**真的 import 被测模块**——否则"加个空测试文件"就能骗过第 1 层；
 *   3. 那个测试文件必须**下了断言**——数得到 `expect(...)` / `assert(...)` 的次数（先剥掉注释行，
 *      否则"注释里写了 expect"也算过），且把 `expect(true)` / `assert.ok(true)` 这类恒真断言从计数里扣掉：
 *      扣完为 0 ⇒ 档位 `no-assert`；文件里只要还留着恒真断言 ⇒ 另记档位 `trivial-assert`
 *      （实测今天 0 条，所以这一档不需要例外）。
 *      这一档 2026-10-01 补上：第 14 道门禁上线当天自报的限度就是"只查有没有 import，不查断言"，
 *      而"只调用不判断的空壳测试"正是最容易顺手交出的那种判据。
 *      复审又收了一次（恒真形态漏了 `assert.ok(true)`，见文件末尾）。
 *
 * 已知不覆盖（自报限度，出现时按提示升级判据而不是放宽档位）：
 *   - 面 = `apps/` + `packages/` 的源码，形状 = 引用 Tauri / Electron 包，**或直接读壳的全局句柄**
 *     （`__TAURI_INTERNALS__`、`contextBridge`、`ipcRenderer`）。
 *     2026-10-01 全仓普查（416 个源文件）量过：`packages/*` 这一支命中 **0**，所以扩根今天不减分；
 *     但形状若哪天出现在共享包里，就会被抓住（牙用 packages 里的探针验过）。
 *     Rust / Swift 侧的壳代码不在面内——本脚本只判 JS/TS 那半边。
 *   - 第 3 层只判"有没有断言"，不判"断言说的是不是这个模块的事"——一份测试可以 import 本模块、
 *     却把断言全打在别的东西上，那仍然算过。要机械判相关性就得把断言表达式和模块的导出符号配对，
 *     而配对要理解作用域（文本级脚本做不到；文档引用对账那条门禁在同一天试过做内容层，
 *     52 条可判引用里误报 38%，成因就是这种没有机械邻近关系的配对）。
 *   - "断言有没有牙"仍要靠变异取证：本档只保证通路被跑到且留下了失败可能。
 *   - 一个模块被别的测试间接跑到（经由分派口）也算有判据：那种情况下请给**它自己**补一份测试，
 *     或把它作为带理由的基线条目登记，别指望本脚本替你判断"间接覆盖够不够"。
 *   - 第 2 层只按 **basename** 匹配（不看目录），所以从别的包 import 一个同名模块也算命中；
 *     `index.ts` 尤其松：可以只 `await import("./index")` 再对别的东西断言而算过。
 *
 * 2026-10-01 复审修掉的两处**假绿**（两处都出在第 2、3 层，也就是"本该拦住却没拦住"那一侧）：
 *   ① 第 2 层拿**全文**跑 `from "…/stem"`，于是 `import type { X } from "./x"`（编译后被擦除，
 *     模块运行时根本没被加载）与 `// import { X } from "./x"`（注释掉的）都算"真的 import 了"——
 *     正好是脚本头声称已经关掉的那个洞。现在只吃剥掉注释行的代码，并排除 `import type` / `export type … from`。
 *   ② 第 3 层的恒真形态只认 `expect(` / `assert(` 两种光秃秃的写法，`assert.ok(true)` 算成"真断言"，
 *      `trivial-assert` 那一档形同虚设。现在恒真形态按 `(?:\.\w+)*` 一并匹配。
 *   牙（四条腿各一次，跑完删净）：只有 `import type` ⇒ FAIL 点名 `#no-import`；
 *   只有注释掉的 import ⇒ FAIL 点名 `#no-import`；只有 `assert.ok(true)` ⇒ FAIL 点名 `#no-assert`；
 *   真 import + 真断言 ⇒ OK；删净 ⇒ 接缝数回到 9、退出码 0。
 *
 * 用法：`pnpm check:seams`；清掉一条后跑 `pnpm check:seams --update` 缩短基线（基线只会因删除而变短）。
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
/**
 * 扫描面：所有会进发布产物的源码根。
 * 起因为 2026-10-01 的一次全仓普查（416 个源文件）：`packages/*` 里 `@tauri-apps` 命中 **0**，
 * 而 `apps/nexus/electron/preload.cjs` 是面外唯一真的壳耦合模块（`contextBridge` 暴露 `nexus.getVersion`）。
 * 原脚本报"只看 apps/web/src"是**未经测量的限度**——现在把根扩到 apps/ 与 packages/，
 * 那条限度改成实测陈述：packages 那一支今天空，但形状一旦出现就会被抓住（探针验过牙）。
 * 不进面的目录：`scripts/`、`e2e/`、`*.test.*` —— 工具与规格永远不随包，它们没有"发布产物里没人验过"这一说。
 */
const scanRoots = [join(root, "apps"), join(root, "packages")];
const baselinePath = join(root, "scripts", "desktop-seam-baseline.json");
const SHELL_PATTERNS = [
  /@tauri-apps/,
  /require\(\s*["']electron["']\s*\)/,
  /from\s+["']electron["']/,
  // 第三类：不 import 壳包、直接读全局句柄（`window.__TAURI_INTERNALS__` / Electron 的 contextBridge）
  // 起因：2026-10-01 普查发现 `main.tsx` 的冒烟触发条件就在读这个全局，而前两档都看不见它。
  /__TAURI_INTERNALS__/,
  /contextBridge|ipcRenderer/,
];
/**
 * 刻意不入面的形状（登记测量，不是"没想到"）：`navigator.clipboard` 一类 Web API 在 Tauri WebView
 * 里能不能用属运行时事实，不是"引用了壳包"这种机械特征；实测调用点 **5 处**、全在页面 `.tsx` 里且都无同名测试，
 * 把它们算进来会让这道门禁第一次运行就要登记 5 条基线，把"壳耦合"这个概念稀释掉。
 * 该风险（剪贴板不可用时是否静默失败）作为**未验证观察**登记在 HANDOFF §6，不进本脚本。
 */

/** 跳过目录：构建产物与依赖不在面内 */
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".vite", "target", "build", "out"]);

function sourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      found.push(...sourceFiles(join(dir, entry.name)));
      continue;
    }
    const p = join(dir, entry.name);
    if (!/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) continue;
    found.push(p);
  }
  return found;
}

function siblingTest(file) {
  const base = file.replace(/\.(ts|tsx|js|cjs|mjs)$/, "");
  for (const cand of [`${base}.test.ts`, `${base}.test.tsx`, `${base}.test.js`, `${base}.test.mjs`]) {
    if (existsSync(cand)) return cand;
  }
  return null;
}

/**
 * 测试文件是否**真的把被测模块加载进来**。
 *
 * 2026-10-01 复审改：原实现拿 `readFileSync` 的**全文**跑一条 `from "…/stem"` 正则，
 * 于是两种最省事的骗法都成立：
 *   - `import type { X } from "./x"` —— 类型导入编译后被擦除，模块运行时**根本没被加载**；
 *   - `// import { X } from "./x"` —— 注释掉的 import。
 * 两条都正好命中脚本头声称已经关掉的那个洞（"那个测试文件必须**真的 import 被测模块**"）。
 * 现在只吃剥掉注释行的代码，并且排除 `import type` / `export type … from`。
 *
 * 仍有的松：只按 **basename** 匹配最后一段，不看目录，所以从别的包 import 一个同名模块也算。
 * 不收紧的理由是这条档位要判的是"有没有把被测模块拉进这张模块图"，
 * 而 `index.ts` 这类分派口的 stem 就是 `index`、任何 `.../index` 都算命中——按目录收紧会误伤。
 * 这条限度对 `index.ts` 尤其明显：它可以只 `await import("./index")` 再对别的东西断言而算过。
 * 断言与模块的**相关性**判不了，见脚本头。
 */
function importsModule(testFile, moduleFile) {
  const stem = moduleFile.replace(/\.(ts|tsx|js|cjs|mjs)$/, "").split("/").pop();
  // 负向形态先扣掉两行：类型导入（`import type { X } from` / `export type { X } from`）
  // 编译后被擦除，模块运行时根本没被加载。`import { type X, Y } from` 这种混写不在扣减面内
  // ——它同时带了值导入，按"算有"处理是对的。
  const src = codeOnly(readFileSync(testFile, "utf8"))
    .split("\n")
    .filter((line) => !/^[^\S\n]*(?:import|export)\s+type\b/.test(line))
    .join("\n");
  const re = /from\s+["'][^"']*\/([^"'/]+)["']/g;
  for (const m of src.matchAll(re)) {
    if (m[1] === stem) return true;
  }
  // 动态 import 也算（有些接缝要懒加载壳能力）
  const dyn = /import\(\s*["'][^"']*\/([^"']+)["']\s*\)/g;
  for (const m of src.matchAll(dyn)) {
    if (m[1] === stem) return true;
  }
  return false;
}

/** 按行剥掉注释（`//`、`/*`、续写的 `*` 行）——判"代码里有没有这个形状"不能吃散文 */
function codeOnly(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*(?:\/\/|\/\*|\*)/.test(line))
    .join("\n");
}

/**
 * 测试文件里的断言证据。
 *
 * 先按行剥掉注释再数：`// expect(...)` 不是判据，它是判据的自述。
 * `expect(true)` / `assert.ok(true)` 这类恒真断言从计数里扣掉——恒真断言永远不会红，
 * 留着它等于给"空壳测试"开了个更省事的骗过方式。
 * 复审补的一处：原式只认 `expect(` / `assert(` 两种光秃秃的形态，于是 `assert.ok(true)`、
 * `assert.ok(1 === 1)` 算成"真断言"——`trivial-assert` 那一档被绕过，档位等于没有。
 * 现在恒真形态按 `(?:\.\w+)*` 一并匹配（`assert.ok` / `expect.not.toBe` 这类）。
 *
 * 已知仍会误算：字符串字面量里写着 `expect(...)` 也被计入（剥的是注释，不是字符串）。
 * 方向是"多算一格证据"，不会把无判据的测试算成有判据。
 */
function assertionEvidence(testFile) {
  const code = codeOnly(readFileSync(testFile, "utf8"));
  const total = (code.match(/\b(?:expect|assert)(?:\.\w+)*\s*\(/g) ?? []).length;
  const trivial = (code.match(/\b(?:expect|assert)(?:\.\w+)*\s*\(\s*(?:true|false)\s*\)/g) ?? []).length;
  return { total, trivial, meaningful: total - trivial };
}

const seams = [];
for (const scanRoot of scanRoots) {
  if (!existsSync(scanRoot)) continue;
  for (const file of sourceFiles(scanRoot)) {
    // 形状匹配只吃剥掉注释行的代码：上一版在这里吃了全文，结果 `main.tsx` 只因为
    // **注释里解释了为什么不用那个全局**就被登记成接缝——负向文本守卫被自己的解释喂饱。
    // 残留限度：行尾注释（`code // __TAURI_INTERNALS__`）与块注释的中段行仍会算命中，
    // 那是"宁可多判一个待登记"的方向，不会漏真引用。
    const code = codeOnly(readFileSync(file, "utf8"));
    if (!SHELL_PATTERNS.some((re) => re.test(code))) continue;
    seams.push(file);
  }
}
seams.sort();

const missingTest = [];
const missingImport = [];
const missingAssert = [];
const trivialAssert = [];
const covered = [];
for (const file of seams) {
  const rel = relative(root, file);
  const test = siblingTest(file);
  if (!test) {
    missingTest.push({ file: rel, key: `${rel}#no-test` });
    continue;
  }
  if (!importsModule(test, file)) {
    missingImport.push({ file: rel, key: `${rel}#no-import` });
    continue;
  }
  const evidence = assertionEvidence(test);
  if (evidence.meaningful === 0) {
    missingAssert.push({ file: rel, key: `${rel}#no-assert` });
    continue;
  }
  if (evidence.trivial > 0) {
    trivialAssert.push({ file: rel, key: `${rel}#trivial-assert` });
  }
  covered.push({ file: rel, meaningful: evidence.meaningful, trivial: evidence.trivial });
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : { allow: [] };
const allow = new Map(
  (baseline.allow ?? []).map((e) => {
    if (typeof e === "string") return [`${e}#no-test`, "（旧格式条目，按缺测试登记）"];
    const tier = e.tier ?? "no-test";
    return [`${e.file}#${tier}`, e.reason ?? ""];
  }),
);

const all = [...missingTest, ...missingImport, ...missingAssert, ...trivialAssert];
const fresh = all.filter((v) => !allow.has(v.key));
const staleAllowed = [...allow.keys()].filter((k) => !all.some((v) => v.key === k));

// 分档计数必须打出来：档位本身会骗人（"跳过多少"必须可见）
const assertTotal = covered.reduce((sum, c) => sum + c.meaningful, 0);
const shape =
  `桌面接缝 ${seams.length} 个：有判据 ${covered.length}（真断言合计 ${assertTotal}）、` +
  `缺测试 ${missingTest.length}、测试未引用 ${missingImport.length}、` +
  `无真断言 ${missingAssert.length}、含恒真断言 ${trivialAssert.length}、基线在册 ${allow.size}`;

if (process.argv.includes("--update")) {
  const keep = all.map((v) => ({
    file: v.file,
    tier: v.key.split("#")[1],
    reason: allow.get(v.key) ?? "待补判据",
  }));
  writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        allow: keep.sort((a, b) => a.file.localeCompare(b.file)),
        _note:
          "直接依赖 @tauri-apps 的桌面模块缺判据的具名登记；tier=no-test 指没有同名测试，no-import 指有测试但没引用该模块，no-assert 指引用了却没有真断言，trivial-assert 指断言恒真（expect(true) 一类）。补一份判据后本表应变短",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`[desktop-seams] baseline 已写入：${keep.length} 条（${shape}）`);
} else if (fresh.length) {
  console.log(`[desktop-seams] FAIL —— ${shape}；新增无判据接缝 ${fresh.length} 个`);
  for (const v of fresh) console.log(`  - ${v.key}`);
  process.exitCode = 1;
} else {
  console.log(`[desktop-seams] OK —— ${shape}`);
  for (const v of all) console.log(`  · 在册：${v.key} —— ${allow.get(v.key) || "（无原因记录）"}`);
  if (staleAllowed.length) {
    console.log(`  → 基线里有 ${staleAllowed.length} 条已经不再缺失，跑 --update 缩短（棘轮只该变短）`);
  }
}
