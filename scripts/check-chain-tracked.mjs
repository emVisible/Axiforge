#!/usr/bin/env node
/**
 * 命令面的可复现锁：`gates` 链上每个 `node scripts/*.mjs`，连同它的相对 import 与它读的基线 JSON，
 * 都必须是**已被 git 跟踪**的文件。
 *
 * 为什么要它（2026-10-10 的实测触因）：交接审计时发现链上 14 个可执行文件里有 6 个没进树，
 * 加上共用的 `source-graph.mjs`，于是干净 clone（含 CI）上 `check:seams`／`check:citations`／
 * `check:publish`／`check:dead-surface` 四道**连文件都找不到**。那时"gates 0"说的是这台机器，
 * 不是这个仓库——而链绿着恰恰是最容易没人去查的状态。
 *
 * 判据不押在"我记得链里有几道"上：链本身从 `package.json` 的 `scripts.gates` 解析，
 * 命令改名或删掉，这里的面跟着变（面异常小 = UNRELIABLE，见下面第二条腿）。
 *
 * 用法：node scripts/check-chain-tracked.mjs
 * **暂时不进 `gates` 链**：它现在是红的，而红的原因只有"把这些文件提交进去"能解，
 * 那需要人的授权（§7）。一条长期红着却无人能修的链等于没有链——G1 棘轮当年就是为此而设。
 * 提交落地后它自己翻绿，那时再排进链。
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve , basename} from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const tracked = new Set(
  execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, "/");

// --- 面：从 package.json 解析链上的命令，再抽出它们真正执行的文件 -------------------
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const CHAIN = (pkg.scripts.gates || "")
  .split("&&")
  .map((s) => s.trim().replace(/^pnpm\s+/, "").split(/\s+/)[0])
  .filter(Boolean);

function executablesOf(commandName) {
  const body = pkg.scripts[commandName] || "";
  return [...body.matchAll(/node\s+([\w./-]+\.mjs)/g)].map((m) => m[1]);
}

// 链上有些命令住在 workspace 包里（typecheck / test:unit / lint / coverage），
// 根 scripts 里没有对应 .mjs —— 那是本档面的已知边界，如实打印而不是假装覆盖到了。
const inRoot = [];
const delegated = [];
for (const c of CHAIN) {
  if (!pkg.scripts[c]) {
    delegated.push(c);
    continue;
  }
  const exes = executablesOf(c);
  if (exes.length === 0) delegated.push(c);
  else inRoot.push(...exes);
}

// 相对 import 闭包：共用真相源（source-graph.mjs）漏掉就等于链上四道一起断
const closure = new Set();
const queue = [...new Set(inRoot)];
const importedFiles = new Set();
const jsonLitByScript = new Map();
const jsonFoundByScript = new Map();
while (queue.length) {
  const raw = queue.shift();
  const abs = resolve(ROOT, raw);
  if (closure.has(rel(abs))) continue;
  closure.add(rel(abs));
  if (!existsSync(abs)) {
    importedFiles.add(rel(abs) + "（文件本身不存在）");
    continue;
  }
  const src = readFileSync(abs, "utf8");
  for (const m of src.matchAll(/from\s+["'](\.[^"']+\.mjs)["']/g)) {
    queue.push(rel(resolve(dirname(abs), m[1])));
  }
  const jsonLits = src.match(/[\w./-]+\.json/g) ?? [];
  jsonLitByScript.set(rel(abs), jsonLits.length);
  for (const m of src.matchAll(/["']((?:[\w./-]+-baseline\.json|[\w.-]+\.json))["']/g)) {
    /*
     * 两种写法都得解：`join(root, "scripts/x-baseline.json")` 里的字面量是**仓库相对**的，
     * 而 `join(HERE, "x-baseline.json")` 是脚本目录相对的。只按后者解会静默漏掉一半基线——
     * 第一版就是这么漏的（下面"逐脚本核对字面量是否落地"那条腿是它的对照）。
     */
    for (const cand of [resolve(dirname(abs), m[1]), resolve(ROOT, m[1])]) {
      if (existsSync(cand)) {
        closure.add(rel(cand));
        jsonFoundByScript.set(rel(abs), (jsonFoundByScript.get(rel(abs)) ?? 0) + 1);
      }
    }
  }
}

// --- 三条腿的自测：判据本身得能区分好坏 --------------------------------------------
const JD = [
  { path: "scripts/e2e-lock.mjs", want: true, why: "链上一直在用的锁，必须被认成已跟踪" },
  { path: "scripts/__no_such_gate__.mjs", want: false, why: "不存在的路径必须被认成未跟踪" },
];
const selfTestFail = JD.filter(
  (t) => tracked.has(t.path) !== t.want,
).map((t) => `${t.path}（${t.why}）`);

const face = [...closure].sort();
/*
 * 逐脚本核对：链上某个脚本里有 N 处 JSON 字面量，闭包却没有它解出的任何 JSON ⇒ 解析器漏了，
 * 此时"全部已跟踪"是假证据。第一版把 `join(root, "scripts/x.json")` 当脚本目录相对路径解，
 * 就是这么漏掉 4 份基线的——聚合计数（"总共解到 1 个"）看不出来，逐脚本一看就露。
 */
const jsonSuspects = [...jsonLitByScript]
  .filter(([p, n]) => n > 0 && !(jsonFoundByScript.get(p) > 0))
  .map(([p, n]) => `${p}（${n} 处字面量，一个都没解到文件）`);
const jsonInFace = face.filter((p) => p.endsWith(".json")).length;
const untracked = face.filter((p) => !tracked.has(p));
const missingNow = [...importedFiles];

console.log(
  `[chain-tracked] 链 ${CHAIN.length} 道；根 scripts 可执行面 ${new Set(inRoot).size} 个，` +
    `闭包（含相对 import 与基线）${face.length} 个；住在 workspace 包里的命令 ${delegated.length} 个：${delegated.join(", ") || "无"}`,
);
console.log(
  `[chain-tracked] 已跟踪 ${face.length - untracked.length} / 未跟踪 ${untracked.length}` +
    `（面里 JSON ${jsonInFace} 个；字面量解不到文件的脚本 ${jsonSuspects.length} 个）`,
);

/*
 * 第三面：**已跟踪源码的相对 import 目标**。这比链闭包那条更硬——链断了只是"少一道门禁"，
 * 而这里断的是**编译本身**：干净 clone 上 `tsc -b` / `vite build` 会直接找不到模块。
 * 判据只用相对说明符（`from "./x"`），按 .ts / .tsx / /index.ts / /index.tsx 四种落点试解析，
 * 落点存在于磁盘却没被跟踪 ⇒ 记一条。只押"存在且未跟踪"，不猜归属。
 */
const EXTS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

/*
 * 别名说明符（`@/x`）**也是编译面**：`tsc -b` / `vite build` 同样要去找那个模块。
 * 旧版只匹配 `from "…"` 里以点开头的说明符，于是别名指向的未跟踪文件被整条面藏住——
 * 2026-10-10 实测：`clipboard.ts` 被两页 `from "@/shared/lib/clipboard"` 引用，却不在"需 add"名单里，
 * 那句"需 add 17 个文件"因此是**假准数**。
 * 映射不手抄：从各 `tsconfig*.json` 的 `compilerOptions.paths` 解析；一条都没解析到就报 `UNRELIABLE`
 * ——这条面静默退化成"只认相对"，正是这次要修的洞的形状。
 */
function trackedByGlob(pattern) {
  // 注意：git 的 pathspec 里 `*` **不跨 `/`**（`tsconfig*.json` 只能命中仓库根那一份），
  // 所以按"取全部已跟踪文件 + basename 匹配"来筛，否则别名表会是空的——
  // 空表就等于这条面静默退回"只认相对说明符"，正是这次要修的洞。
  try {
    const all = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    const re = new RegExp(pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    return all.filter((f) => re.test(basename(f)));
  } catch {
    return [];
  }
}
function aliasMap() {
  const out = [];
  for (const cfg of trackedByGlob("tsconfig*.json")) {
    let parsed;
    try {
      parsed = JSON.parse(
        readFileSync(join(ROOT, cfg), "utf8")
          .replace(/^\s*\/\/.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, ""),
      );
    } catch {
      continue; // tsconfig 带注释或 extends 写法解析不了就跳过这一份，别的会补上
    }
    const paths = parsed?.compilerOptions?.paths;
    if (!paths) continue;
    const baseDir = dirname(cfg);
    for (const [key, targets] of Object.entries(paths)) {
      if (!key.endsWith("/*") || !Array.isArray(targets) || !targets[0]?.endsWith("/*")) continue;
      out.push({
        prefix: key.slice(0, -1),
        dir: rel(resolve(ROOT, baseDir, targets[0].slice(0, -1))).replace(/\/$/, ""),
      });
    }
  }
  return out;
}
const ALIASES = aliasMap();

const trackedSrc = execFileSync("git", ["ls-files", "--", "*.ts", "*.tsx"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
/**
 * 把一条 import 说明符解成"仓库里真实存在的那个文件"。
 *
 * 抽成独立函数是为了让下面那组对照组**不依赖任何文件的 git 状态**——
 * 原版把判据自证写成"某某文件必须未跟踪"，于是那些文件一旦被正确提交、
 * 对照组就过期、脚本在**每一台**机器上 exit 1（本机与干净 clone 都红，已实测）。
 * 现在这组对照只问"解析器还能不能解"，那是它真正要防的那件事。
 */
function resolveImportTarget(file, spec) {
  const isRel = spec.startsWith(".");
  // 同一个前缀可以来自多份 tsconfig（实测 `@/` 有三条：admin／nexus／web）。
  // 只取第一条会把后面两根整个藏住——2026-10-10 那次"别名面没生效"就是这个原因：
  // `@/shared/lib/clipboard` 被解成 `apps/admin/src/shared/lib/clipboard`（不存在）于是静默无命中。
  const aliasRoots = isRel ? [] : ALIASES.filter((a) => spec.startsWith(a.prefix));
  if (!isRel && aliasRoots.length === 0) return null;
  const bases = isRel
    ? [resolve(ROOT, dirname(file), spec)]
    : aliasRoots.map((a) => resolve(ROOT, a.dir, spec.slice(a.prefix.length)));
  /*
   * 只认**磁盘上真存在**的那个落点：先按 .ts/.tsx/index 试出来，取第一个存在的；
   * 一个都不存在就不是"缺文件"（可能是没写完的代码，那是 tsc 的事，不是这条面的）。
   * 第一版把"无扩展名的原始说明符"也当成落点，于是 225 个假缺口——`./App` 这种
   * 本来就靠扩展名解析的写法全被报成未跟踪。
   */
  const cands = bases
    .flatMap((b) => EXTS.map((ext) => rel(b + ext)))
    .filter((c) => {
      try {
        // 必须是**文件**：`./editor` 这种目录名先existsSync会命中目录本身，
        // 而真实落点是目录里的 index.*（那些往往是已跟踪的）——只认文件就不误报。
        return statSync(join(ROOT, c)).isFile();
      } catch {
        return false;
      }
    });
  return cands[0] ?? null;
}

/** 一条数据字面量的两个候选落点（相对调用方 / 相对仓根），先滤掉逃出仓外的。抽出来只为让对照组能自证。 */
function dataCandidates(file, literal) {
  return [rel(resolve(ROOT, dirname(file), literal)), rel(resolve(ROOT, literal))].filter(
    (cand) => !cand.startsWith(".."),
  );
}

const compileGaps = [];
for (const file of trackedSrc) {
  let src;
  try {
    src = readFileSync(join(ROOT, file), "utf8");
  } catch {
    continue;
  }
  for (const spec of [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])) {
    const hit = resolveImportTarget(file, spec);
    if (hit && !tracked.has(hit)) compileGaps.push(`${spec}（→ ${hit}）⇐ ${file}`);
  }
}
const compileGapFiles = [...new Set(compileGaps.map((g) => g.split("（→ ")[1].split("）")[0]))].sort();
console.log(
  `[chain-tracked] 已跟踪源码的相对 import 里，落点存在却未跟踪：${compileGapFiles.length} 个模块（出现 ${compileGaps.length} 处）`,
);
for (const g of compileGaps) console.log(`  编译缺口：${g}`);

/*
 * 这条面自己的对照组，三条、两个方向都压住。
 *
 * **为什么不能问"某某文件是不是未跟踪"**（原版就是这么写的，2026-10-18 改）：
 * 那样写等于把判据绑在本机树的状态上。那些文件被**正确提交**之后，对照组必然过期，
 * 而脚本会在**每一台**机器上 exit 1——实测本机与干净 clone 都是红的，而它查的那件事
 * （干净 clone 跑不起来）**早已修好**。一条会因为"事情被做对了"而变红的门禁，
 * 教人忽略红灯，比没有门禁更坏。
 *
 * 现在这三条只问"解析器还能不能解"与"报出来的可不可能是真的"，两者都与树的形状无关：
 *   A 解析能力（相对说明符）：解出来的必须是磁盘上真存在的那个文件。
 *   B 解析能力（别名说明符）：同一前缀来自三份 tsconfig（实测 `@/` 有 admin／nexus／web 三条），
 *     取哪一条都不能解错。**这一条曾经真的错过**——取第一条时
 *     `@/shared/lib/clipboard` 被解成 `apps/admin/src/...`（不存在）⇒ 静默零命中。
 *   C 无假阳性：报出来的每一条都必须**既在磁盘上、又确实未被跟踪**。
 *     只压 A/B 的话，"什么都解不出来"也会全绿——那正是本项目反复在治的恒零退化。
 */
const CG_CONTROLS = [
  {
    what: "相对说明符能解出真文件",
    got: resolveImportTarget("packages/axs/src/index.ts", "./condition"),
    want: "packages/axs/src/condition.ts",
    why: "解 `./condition` 必须落到 packages/axs/src/condition.ts（无扩展名 + 相对）",
  },
  {
    what: "别名说明符解到 web 那一份",
    got: resolveImportTarget("apps/web/src/features/studio/hooks/useCharacters.ts", "@/shared/lib/clipboard"),
    want: "apps/web/src/shared/lib/clipboard.ts",
    why:
      "`@/` 来自三份 tsconfig（admin／nexus／web），取错一条就会解到不存在的地方、于是静默零命中。" +
      "原版这条对照写成「clipboard.ts 必须未跟踪」，于是它被正确提交之后对照过期、脚本恒红",
  },
  {
    what: "解不出来的说明符不硬造落点",
    got: resolveImportTarget("packages/axs/src/index.ts", "./__no_such_module__"),
    want: null,
    why: "落点不存在时必须给 null——第一版把无扩展名的原始说明符也当落点，造出 225 个假缺口",
  },
];
const cgFail = CG_CONTROLS.filter((c) => c.got !== c.want)
  .map((c) => `${c.what}：得到 ${JSON.stringify(c.got)}、期望 ${JSON.stringify(c.want)}（${c.why}）`);

// C 档：不许报假阳性（与树形状无关的不变量，恒成立才叫对照组）
const fakeGap = compileGapFiles.filter(
  (f) => tracked.has(f) || !existsSync(join(ROOT, f)),
);
if (fakeGap.length > 0) {
  cgFail.push(`报出了假缺口 ${fakeGap.join(", ")}：落点要么已被跟踪、要么磁盘上并不存在`);
}

/*
 * 第四面：**数据文件**的引用缺口。相对 import 只覆盖"`from \"./x\"`"这一种写法，
 * 而 fixture／端口表／golden 大多是字符串路径 + readFileSync（还有一半在 Python 侧），
 * 编译面看不见它们——树干净但测试一跑就炸。所以这一面扫全部已跟踪文件里的路径字面量，
 * 落在磁盘上存在、却没被跟踪、也**没被 gitignore** 的，算缺口。
 * gitignore 这一刀是必需的：`apps/desktop/src-tauri/gen/schemas/*.json` 是 Tauri 生成的产物，
 * 它"不在树里"是正确状态，把它报成缺口就成了谁都不服的噪声。
 */
const DATA_RE = /["'`](\.?\.?\/?[\w./-]*\/[\w.-]+\.(?:json|axsp|md|txt|csv|toml|sql|py))["'`]/g;
const dataFiles = execFileSync(
  "git",
  ["ls-files", "--", "*.ts", "*.tsx", "*.mjs", "*.cjs", "*.js", "*.json", "*.py"],
  { cwd: ROOT, encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);
const dataRaw = new Map();
for (const file of dataFiles) {
  let src;
  try {
    src = readFileSync(join(ROOT, file), "utf8");
  } catch {
    continue;
  }
  for (const m of src.matchAll(DATA_RE)) {
    for (const cand of dataCandidates(file, m[1])) {
      // 已跟踪的不算缺口——这一句正是本脚本的"该 add 什么"成立的前提，
      // 也正是原版那条对照组会在文件被正确提交后失效的原因（见下面 DG_CONTROLS 的注释）。
      if (tracked.has(cand)) continue;
      const abs = join(ROOT, cand);
      if (existsSync(abs) && statSync(abs).isFile()) dataRaw.set(cand, file);
    }
  }
}
/*
 * `git check-ignore` 的退出码是**语义**的一部分：0＝有路径被忽略，1＝一个都没忽略，128＝真错误。
 * 直接用 execFileSync 会把"没忽略任何东西"当成异常抛出来（第一版就是这么炸的），
 * 所以 status===1 要当空结果收下，其余才继续抛。
 */
let ignoredStdout = "";
if (dataRaw.size) {
  try {
    ignoredStdout = execFileSync("git", ["check-ignore", "--stdin"], {
      cwd: ROOT,
      encoding: "utf8",
      input: [...dataRaw.keys()].join("\n"),
    });
  } catch (e) {
    if (e.status !== 1) throw e;
    ignoredStdout = e.stdout ?? "";
  }
}
const ignoredSet = new Set(ignoredStdout.split("\n").filter(Boolean));
const dataGaps = [...dataRaw].filter(([p]) => !ignoredSet.has(p));
/*
 * `Clearance/` 这类**仓外目录**要单独一档，绝不能混进"该 add 什么"：它未纳管、里面还有 `.env`，
 * 一句"把这 20 个文件加进去"就是危险的处置建议。这里只把它当成一个事实打印：
 * 已跟踪的 `backend/*.py` 按路径引用了仓库外的代码 ⇒ 后端连 clone 下来都跑不起来，
 * 这条证据是给 `backend/` 退场那个决策用的，不是给提交用的。
 */
const EXTERNAL_RE = /^(?:Clearance|\/(?:Users|home)\/)/;
const externalRefs = dataGaps.filter(([p]) => EXTERNAL_RE.test(p));
const dataRealGaps = dataGaps.filter(([p]) => !EXTERNAL_RE.test(p));
console.log(
  `[chain-tracked] 数据缺口：本仓内 ${dataRealGaps.length} 个 ／ 引用仓外未纳管目录 ${externalRefs.length} 个（不计入"该 add"，见下）`,
);
for (const [p, by] of externalRefs) console.log(`  仓外依赖：${p} ⇐ ${by}`);

/*
 * 第五面：**未跟踪的测试文件**。它不是"跑不起来"，是"跑起来但少测"——
 * 干净 clone 上 `test:unit` 的通过数会比本机少 N 条，而那盏绿灯读起来和这台机器一模一样。
 * 本仓已经吃过同一形状的苦：门禁脚本自己没进树时，"gates 0"只是一机读数；同一件事发生在判据数量上
 * 同样致命，而且更隐蔽，因为两边都是"全绿"。
 */
const untrackedTests = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: ROOT,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .filter((p) => /(?:^|[/.-])(?:[A-Za-z0-9._-]+\.)?(?:test|spec)\.(ts|tsx)$/.test(p))
  .sort();
console.log(
  `[chain-tracked] 未跟踪的测试文件：${untrackedTests.length} 个 ⇒ 干净 clone 上 test:unit 会静默少掉这么多条判据`,
);
for (const p of untrackedTests) console.log(`  少掉的判据：${p}`);
/*
 * 这一档的对照组同样**不许问"某某文件现在是不是未跟踪"**（2026-10-18 改）。
 * 原版写着「clipboard.test.ts 必须未跟踪——正是这一档该抓的形状」，
 * 于是那个文件一旦被**正确提交**，这条对照就在**每一台**机器上变红。
 * 写门禁的人正在被自己门禁的红字教育「红=有未跟踪测试」，而真相是「红=那个测试已经被提交了」。
 *
 * 改成问这一档**自己**的判定，而不是树的状态：
 *   - 形状认得出来（`.test.ts` / `.spec.tsx` / 带目录前缀的那种写法）
 *   - 形状认不错（`latest.ts` 里的 `test` 子串不算；已跟踪的 `.test.ts` 不算）
 * 这两条与"现在有哪些文件没提交"完全无关。
 */
const isTestPath = (p) => /(?:^|[/.-])(?:[A-Za-z0-9._-]+\.)?(?:test|spec)\.(ts|tsx)$/.test(p);
const UT_CONTROLS = [
  { p: "apps/web/src/shared/lib/clipboard.test.ts", want: true, why: "`.test.ts` 形状必须认出来（文件名直接以 .test.ts 结尾）" },
  { p: "packages/core/src/thing.spec.tsx", want: true, why: "`.spec.tsx` 形状必须认出来" },
  { p: "apps/web/src/shared/lib/a.b.test.ts", want: true, why: "带前缀的写法 `a.b.test.ts` 也必须认出来" },
  { p: "apps/web/src/features/writer/lib/latest.ts", want: false, why: "`latest.ts` 里那个 `test` 子串不是测试文件——放进来就是假阳性的形状" },
];
// 形状对照只问形状：把"是否已跟踪"混进来过一次（第一版改稿），于是已跟踪的 .test.ts
// 把自己判成"认不出来"——形状对了、判据反而红。已跟踪那一条改成下面的不变量来压。
const utFail = UT_CONTROLS.filter((c) => isTestPath(c.p) !== c.want).map((c) => `${c.p}（${c.why}）`);
// 「未被跟踪」那一半是另一条腿，且必须与树形状无关：报出来的每一条都得真的没被跟踪。
const utFake = untrackedTests.filter((f) => tracked.has(f));
if (utFake.length > 0) utFail.push(`把已跟踪文件算成了少掉的判据：${utFake.join(", ")}`);

const needAdd = [
  ...new Set([
    ...untracked,
    ...compileGapFiles,
    ...dataRealGaps.map(([p]) => p),
    ...untrackedTests,
  ]),
].sort();
console.log(
  `[chain-tracked] 数据文件引用缺口：候选 ${dataRaw.size} 个，其中 gitignore 的生成物 ${dataRaw.size - dataGaps.length} 个，` +
    `本仓真缺口 ${dataRealGaps.length} 个`,
);
for (const [p, by] of dataRealGaps) console.log(`  数据缺口：${p} ⇐ ${by}`);
console.log(
  `[chain-tracked] 并集：**要让干净 clone 真能跑，需 add ${needAdd.length} 个文件**` +
    `（链面 ${untracked.length} ⊕ 编译面 ${compileGapFiles.length} ⊕ 数据面 ${dataRealGaps.length}，去重后 ${needAdd.length}）`,
);
for (const p of needAdd) console.log(`  待 add：${p}`);

/*
 * 这一档的对照组（2026-10-18 重写）。
 *
 * 原版第一行是「`scripts/ports.json` 必须出现在缺口里」——而这一面**故意跳过已跟踪文件**
 * （"该 add 什么"只该列没进树的）。2026-10-18 把那批文件提交进树之后，
 * 这条对照就在**每一台**机器上失效：脚本红着，而它查的那件事早已修好。
 *
 * 改成与树形状无关的两类：
 *   A 解析能力：字面量 → 候选路径的映射必须算得对（不依赖任何文件是否已跟踪）。
 *   B 无假阳性：报出来的每一条都得**真的既存在、又没被跟踪、也没被 gitignore**。
 *     只压 A 的话，"什么都扫不到"照样全绿——那正是本项目反复在治的恒零退化。
 */
const DG_CONTROLS = [
  {
    what: "相对字面量解成调用方同目录",
    got: dataCandidates("scripts/check-chain-tracked.mjs", "./ports.json").includes("scripts/ports.json"),
    want: true,
    why: "`./ports.json` 写在 scripts/ 下 ⇒ 必须解成 scripts/ports.json",
  },
  {
    what: "仓根相对字面量也能解",
    got: dataCandidates("packages/core/src/x.ts", "scripts/ports.json").includes("scripts/ports.json"),
    want: true,
    why: "字面量按仓根给时也要能解出来，不能只认相对写法",
  },
  {
    what: "逃出仓外的落点被丢掉",
    got: dataCandidates("scripts/x.mjs", "../../../etc/passwd").some((c) => c.startsWith("..")),
    want: false,
    why: "`../..` 往上跑的落点必须被滤掉，否则这条面会去指仓外的文件",
  },
];
const dgFail = DG_CONTROLS.filter((c) => c.got !== c.want)
  .map((c) => `${c.what}：得到 ${JSON.stringify(c.got)}、期望 ${JSON.stringify(c.want)}（${c.why}）`);
// B 档：每条真缺口都得真的未跟踪、真的存在、真的没被 ignore
const dgFake = dataRealGaps.filter(
  ([p]) => tracked.has(p) || ignoredSet.has(p) || !existsSync(join(ROOT, p)),
);
if (dgFake.length > 0) {
  dgFail.push(`报出了假缺口 ${dgFake.map(([p]) => p).join(", ")}：落点要么已跟踪、要么被 ignore、要么磁盘上不存在`);
}

/*
 * 第二档：**清单**，不参与判定。退出码只由上面几条腿决定；这里只是把全部未跟踪路径
 * 按目录形状分桶，让"该 add 什么"不再靠人翻 `git status`。
 * 分桶只看路径不看作者——未跟踪文件的**归属**在本仓没有干净机械信号（§6 在册限度）。
 */
const untrackedAll = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((l) => l.startsWith("?? "))
  .map((l) => l.slice(3).trim());
const BUCKETS = [
  [/^scripts\/(?:[\w.-]+-baseline\.json|[\w.-]*judgements\.json)$/, "基线与台账"],
  [/^scripts\//, "门禁与普查脚本"],
  [/\/[\w.-]+\.(test|spec)\.[cm]?[jt]sx?$/, "单元测试"],
  [/^testdata\//, "夹具与 golden"],
  [/^(?:apps|packages)\//, "生产模块"],
  [/^(?:docs\/|README)/, "文档"],
  // 仓外/本机私有的顶层目录与 backend/ 同一桶：`Clearance/`（未纳管、含 .env）与
  // `articles/`（用户私稿）**刻意留在仓外**，把它们报成"该 add 什么"不只是噪声——
  // 一句"把 Clearance/ 加进去"就是危险建议（里面有 .env）。
  [/^(?:backend\/|Clearance\/|articles\/|Clearance\/)/, "非本战场（他人在飞／域外）"],
];
const bucketCount = new Map();
const bucketLeftover = [];
for (const p of untrackedAll) {
  const hit = BUCKETS.find(([re]) => re.test(p));
  if (hit) bucketCount.set(hit[1], (bucketCount.get(hit[1]) ?? 0) + 1);
  else bucketLeftover.push(p);
}
console.log(
  `[chain-tracked] 清单档（不判定）：未跟踪 ${untrackedAll.length} 项 ＝ ` +
    [...bucketCount].map(([k, v]) => `${k} ${v}`).join(" ／ ") +
    (bucketLeftover.length ? ` ／ 未归类 ${bucketLeftover.length}` : " ／ 未归类 0"),
);
for (const p of bucketLeftover) console.log(`  未归类：${p}`);
for (const s of jsonSuspects) console.log(`  解析可疑：${s}`);
for (const p of untracked) console.log(`  未跟踪：${p}`);
if (missingNow.length) {
  for (const p of missingNow) console.log(`  import 指向却不存在的文件：${p}`);
}

const verdicts = [];
/*
 * `facts` 与 `verdicts` 分开：前者只打印、不碰退出码，后者才判红。
 * 判据该不该红取决于**有没有可行动的修法**——一条自己都说"不由 git add 解决"的观察，
 * 红了只会让人学会忽略红灯（2026-10-18 把仓外依赖那条从 verdicts 挪进这里）。
 */
const facts = [];
if (ALIASES.length === 0) {
  verdicts.push(
    "UNRELIABLE — 一条 `compilerOptions.paths` 都没解析到：编译面退化成只认相对说明符，" +
      "别名指向的未跟踪文件会被整条面藏住（这正是 2026-10-10 修掉的那个洞，别让它静默回来）",
  );
}
if (utFail.length) {
  verdicts.push(`UNRELIABLE — 未跟踪测试文件那一档的对照组不符：${utFail.join("；")} ⇒ 上面那份"少掉的判据"清单不可信`);
}
if (untrackedTests.length > 0) {
  verdicts.push(
    `REGRESSION — ${untrackedTests.length} 个测试文件未跟踪：干净 clone 的 test:unit 会少掉同样多条判据（两边都是绿灯，但量的不是同一件事）`,
  );
}
if (selfTestFail.length) {
  verdicts.push(`UNRELIABLE — 本档的跟踪判定自测失败：${selfTestFail.join("；")}`);
}
if (CHAIN.length < 10) {
  // 面异常小 = 链没解析出来（改名／scripts.gates 不在了），此时"全部已跟踪"是假证据
  verdicts.push(`UNRELIABLE — 只解析出 ${CHAIN.length} 道链上命令，面小得可疑，别把结果当证据`);
}
if (jsonSuspects.length) {
  verdicts.push(
    `UNRELIABLE — ${jsonSuspects.length} 个链上脚本有 JSON 字面量却一个文件都没解到：解析器漏面，` +
      `那份"未跟踪清单"不可信（先修解析器）`,
  );
}
if (bucketLeftover.length) {
  verdicts.push(
    `UNRELIABLE — 清单档有 ${bucketLeftover.length} 项落不进任何桶：分桶规则落后于树的形状，` +
      `这份"该 add 什么"不可信（补桶，别删掉这一档）`,
  );
}
if (cgFail.length) {
  verdicts.push(
    `UNRELIABLE — 编译缺口那条面的对照组不符：${cgFail.join("；")} ⇒ 上面那份清单不可信`,
  );
}
if (compileGapFiles.length > 0) {
  verdicts.push(
    `REGRESSION — ${compileGapFiles.length} 个模块被**已跟踪源码**相对 import 却没进树：` +
      `${compileGapFiles.join(", ")}。干净 clone 上这不是少一道门禁，是 tsc/build 直接断`,
  );
}
if (dgFail.length) {
  verdicts.push(
    `UNRELIABLE — 数据面对照组不符：${dgFail.join("；")} ⇒ 这份缺口清单不可信（先修 gitignore 过滤或解析）`,
  );
}
if (dataRealGaps.length) {
  verdicts.push(
    `REGRESSION — ${dataRealGaps.length} 个本仓数据文件被已跟踪代码按路径读却没进树（fixture／端口表一类）：` +
      dataRealGaps.map(([p]) => p).join(", ") +
      "。干净 clone 上这些不是编译错，是测试／脚本跑起来才炸",
  );
}
/*
 * 仓外依赖：**事实，不判红**（2026-10-18 从 `verdicts` 里移出来）。
 *
 * 它原来是一条 `REGRESSION`，可这条消息**自己**就写着"不由 git add 解决（那些路径本就不该进树）"，
 * 而脚本也已经把它排除在"该 add 什么"之外（`needAdd` 用的是 `dataRealGaps`，不含它）。
 * 一条声明自己不可行动、又已被排除在建议清单外的判据，却驱动退出码——
 * 那是**自相矛盾**，而且判红时间还取决于"这台机器隔壁有没有那个目录"：
 * 有 `Clearance/` 的机器红、没有的绿，同一份代码两种读数，正是本脚本这一轮在治的那件事。
 *
 * 现在它照旧打印（证据一个字不少，`externalRefs` 那几行一直在），但不进 `verdicts`。
 * 要把它变成"可行动的判据"得先有**行动**：那属 `backend/` 退场那条线（S13-6），
 * 判据该在那条线上长出来，而不是在这里假装已经红了。
 */
if (externalRefs.length) {
  facts.push(
    `事实（不判红）— ${externalRefs.length} 处**已跟踪代码引用了仓外未纳管目录**：` +
      externalRefs.map(([p]) => p).join(", ") +
      "。这条不由 git add 解决（那些路径本就不该进树），它是 `backend/` 退场决策的证据：现在连后端都必须在有隔壁目录的机器上才跑得起来",
  );
}
if (untracked.length > 0 || missingNow.length > 0) {
  verdicts.push(
    `REGRESSION — 命令面不完整：未跟踪 ${untracked.length} 个／import 指向却不存在 ${missingNow.length} 个；` +
      `干净 clone 上链会在用到它们的那道断掉`,
  );
}
/*
 * 各条腿**独立出结论并全部打印**，不写 else-if 链：写成链的话，靠后的腿在今天的树上永远走不到，
 * 等于一条没被真实语料行使过的判据——它有没有牙没人知道。
 */
if (verdicts.length) {
  for (const f of facts) console.log(f);
for (const v of verdicts) console.log(v);
  process.exitCode = 1;
} else {
  console.log(
    "[chain-tracked] OK —— 链上的可执行文件、相对 import 与基线全部已跟踪，且清单分桶无漏项",
  );
  process.exitCode = 0;
}
