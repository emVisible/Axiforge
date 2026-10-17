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
const compileGaps = [];
for (const file of trackedSrc) {
  let src;
  try {
    src = readFileSync(join(ROOT, file), "utf8");
  } catch {
    continue;
  }
  for (const spec of [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])) {
    const isRel = spec.startsWith(".");
    // 同一个前缀可以来自多份 tsconfig（实测 `@/` 有三条：admin／nexus／web）。
    // 只取第一条会把后面两根整个藏住——2026-10-10 那次"别名面没生效"就是这个原因：
    // `@/shared/lib/clipboard` 被解成 `apps/admin/src/shared/lib/clipboard`（不存在）于是静默无命中。
    const aliasRoots = isRel ? [] : ALIASES.filter((a) => spec.startsWith(a.prefix));
    if (!isRel && aliasRoots.length === 0) continue;
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
    const hit = cands[0];
    if (hit && !tracked.has(hit)) compileGaps.push(`${spec}（→ ${hit}）⇐ ${file}`);
  }
}
const compileGapFiles = [...new Set(compileGaps.map((g) => g.split("（→ ")[1].split("）")[0]))].sort();
console.log(
  `[chain-tracked] 已跟踪源码的相对 import 里，落点存在却未跟踪：${compileGapFiles.length} 个模块（出现 ${compileGaps.length} 处）`,
);
for (const g of compileGaps) console.log(`  编译缺口：${g}`);

// 这条面自己的对照组：该拦的必须被拦、该放的必须被放，否则上面那份清单不可信
const CG_CONTROLS = [
  { p: "packages/axs/src/condition.ts", want: true, why: "被 index.ts/parse.ts/print.ts import 且未跟踪" },
  { p: "packages/axs/src/print.ts", want: false, why: "同样被 import，但它在树里，不该被报" },
  {
    p: "apps/web/src/shared/lib/clipboard.ts",
    want: true,
    why:
      "只被别名说明符 `@/shared/lib/clipboard` 指到。第一版这条面看不见它，根因是同一个 `@/` 前缀来自三份 tsconfig、" +
      "而 `find()` 取第一条 ⇒ 解到 apps/admin/src 里不存在的路径，静默零命中",
  },
];
const cgFail = CG_CONTROLS.filter((c) => compileGapFiles.includes(c.p) !== c.want)
  .map((c) => `${c.p}（${c.why}）`);

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
    for (const cand of [
      rel(resolve(ROOT, dirname(file), m[1])),
      rel(resolve(ROOT, m[1])),
    ]) {
      if (cand.startsWith("..") || tracked.has(cand)) continue;
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
const UT_CONTROLS = [
  { p: "apps/web/src/shared/lib/clipboard.test.ts", want: true, why: "本会话新增、未提交——正是这一档该抓的形状" },
  { p: "apps/web/src/features/writer/lib/projection.test.ts", want: false, why: "已跟踪，不该被算成少掉的判据" },
];
const utFail = UT_CONTROLS.filter((c) => untrackedTests.includes(c.p) !== c.want).map((c) => `${c.p}（${c.why}）`);

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

const DG_CONTROLS = [
  { p: "scripts/ports.json", want: true, why: "被三个 config 与 loader 读，却没进树" },
  { p: "apps/desktop/src-tauri/gen/schemas/desktop-schema.json", want: false, why: "Tauri 生成物，gitignore 内，不该报" },
  { p: "scripts/file-size-baseline.json", want: false, why: "已跟踪，不该出现在缺口里" },
];
const dgFail = DG_CONTROLS.filter(
  (c) => dataGaps.some(([p]) => p === c.p) !== c.want,
).map((c) => `${c.p}（${c.why}）`);

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
  [/^(?:backend\/|Clearance\/)/, "非本战场（他人在飞／域外）"],
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
if (externalRefs.length) {
  verdicts.push(
    `REGRESSION — ${externalRefs.length} 处**已跟踪代码引用了仓外未纳管目录**：` +
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
  for (const v of verdicts) console.log(v);
  process.exitCode = 1;
} else {
  console.log(
    "[chain-tracked] OK —— 链上的可执行文件、相对 import 与基线全部已跟踪，且清单分桶无漏项",
  );
  process.exitCode = 0;
}
