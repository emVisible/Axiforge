#!/usr/bin/env node
/**
 * 候选判据（**尚未接进 `gates`**）：`/api/v1` 字面量的允许落点。
 *
 * 为什么单列一个脚本而不是直接进门禁链：这条判据的**措辞本身**还在等人定档
 * （`docs/HANDOFF.md` §6 定档清单第①条——原文「`/api/v1` 只剩测试宿主所需」不可判，
 * 因为它没说"哪些位置算测试宿主"）。这里把建议措辞写成机械形式，先量今天有没有例外：
 *
 *   `/api/v1` 只允许出现在 ① `*.test.*` ② 注释行 ③ `shared/api/client.ts` 的基址定义；
 *   其余任何出现都算「新的云端调用点」，必须为 0。
 *
 * **判定面只有 `apps/web/src`**（2026-10-10 的口径决定）：其余面只报读数不判红。
 * 理由是定档①没规定这条规则管不管 `apps/admin`／`packages/*`／`e2e`——那些面今天有没有例外
 * 是**决策的输入**，不是它的结论。把它们算进判定会让一个还没被认可的措辞偷偷生效。
 *
 * 已知不覆盖（自报限度，2026-10-10 扩面后复审）：
 *   - 判据吃的是**字面量子串**。写成 `` `/api/${V}/x` ``、`"/api/" + "v1"`、或大小写不同（`/API/V1`）
 *     严格档看不见——那都是真实的云端调用点。这类写法现在**单独数出来**（`可疑写法` 那一档，只读数），
 *     所以"看不见"变成了"看见了但不下结论"；它仍然只能当"防顺手加"，不能当"没有云端调用"。
 *   - 注释判定是**行首**锚定的（`//`、`/*`、`*`）：块注释不带 `*` 续写的中间行、以及行尾注释
 *     都会被算成违规。这一档今天也**单独数出来**（`其中行尾注释`），因为「行尾注释算不算例外」
 *     正是定档①要回答的问题之一——先量出代价，再让人拍。
 *   - `vite.config.ts` 的 `/api` 代理在面外（那是 dev server 配置，不是调用点）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const NEEDLE = "/api/v1";
const BASE_FILE = "apps/web/src/shared/api/client.ts";

/** 判定面（红绿由它决定）＋ 只读面（给定档①当输入） */
const FACES = [
  { dir: "apps/web/src", verdict: true },
  { dir: "apps/admin/src", verdict: false },
  { dir: "packages", verdict: false },
  { dir: "e2e", verdict: false },
];

/** 绕开严格档的写法：模板拼接／字符串相加／大小写变体 */
const BYPASS_RES = [/\/api\/\$\{/, /["'`]\/api\/["'`]\s*\+/, /\/API\/V1/i];

function sourceFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const BASE_DEF_RE = /^\s*(?:export\s+)?(?:const|let|var)\s+apiBase\b/;

/**
 * 一行的归类（纯函数，被下面的合成样本对照组直接调用）。
 * 顺序是判据的一部分：测试优先于注释优先于基址定义。
 * 「测试宿主」这一档含 `*.spec.*`（Playwright 那份也是测试宿主）——这不是定档，是把 2026-10-10
 * 第一次扩面时量到的假阳性归位：`e2e/` 的 80 条命中里绝大多数是断言文案与请求监听器的路径判断，
 * 它们不是云端调用点。
 */
function classify(rel, line) {
  if (/(?:^|\/)(?:[\w.-]+\.)?(?:test|spec)\.(ts|tsx)$/.test(rel)) return "test";
  if (/^\s*(\/\/|\/\*|\*)/.test(line)) return "comment";
  if (rel === BASE_FILE && BASE_DEF_RE.test(line)) return "baseDef";
  return "violation";
}

/** 行尾注释：代码在前、注释在后，且这一行确实带字面量 */
function isTrailingComment(line) {
  const idx = line.indexOf("//");
  return idx > 0 && !/^\s*\/\//.test(line);
}

function isBypass(line) {
  if (line.includes(NEEDLE)) return false;
  return BYPASS_RES.some((re) => re.test(line));
}

const tally = { test: 0, comment: 0, baseDef: 0, violation: 0, trailing: 0, bypass: 0 };
const faceCount = {};
const violations = [];
const readoutHits = [];
let fileTotal = 0;
const missingFaces = [];

for (const face of FACES) {
  const abs = join(root, face.dir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    missingFaces.push(face.dir);
    continue;
  }
  const files = sourceFiles(abs);
  fileTotal += files.length;
  faceCount[face.dir] = { files: files.length, hits: 0, bypass: 0 };
  for (const file of files) {
    const rel = relative(root, file);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes(NEEDLE)) {
          faceCount[face.dir].hits += 1;
          const kind = classify(rel, line);
          if (face.verdict) {
            tally[kind] += 1;
            if (kind === "violation") {
              if (isTrailingComment(line)) tally.trailing += 1;
              violations.push(`${rel}:${i + 1} ${line.trim().slice(0, 90)}`);
            }
          } else {
            faceCount[face.dir][kind] = (faceCount[face.dir][kind] || 0) + 1;
            if (kind === "violation") {
              readoutHits.push(`[${face.dir}] ${rel}:${i + 1} ${line.trim().slice(0, 80)}`);
            }
          }
          return;
        }
        if (isBypass(line)) {
          faceCount[face.dir].bypass += 1;
          tally.bypass += 1;
        }
      });
  }
}

const shape = `判定面命中：测试 ${tally.test}、注释 ${tally.comment}、基址定义 ${tally.baseDef}、越界调用点 ${tally.violation}（其中行尾注释 ${tally.trailing}）`;
const faceShape = FACES.map((f) => {
  const c = faceCount[f.dir];
  if (!c) return `${f.dir} —`;
  const extra = f.verdict
    ? ""
    : `（只读：疑似调用点 ${c.violation || 0}／注释 ${c.comment || 0}／测试 ${c.test || 0}）`;
  return `${f.dir} ${c.hits}${extra}`;
}).join(" ／ ");
const bypassShape = `可疑写法（绕开严格档的模板拼接／字符串相加／大小写变体）：${tally.bypass}`;

// ---- 合成样本对照组：判据自己必须先被证明能判对 ----
const CONTROLS = [
  { rel: "apps/web/src/shared/lib/x.ts", line: '  const u = apiBase + "/api/v1/things";', want: "violation" },
  { rel: "apps/web/src/shared/lib/x.ts", line: "  // 说明里提到 /api/v1", want: "comment" },
  { rel: BASE_FILE, line: '  let apiBase = "/api/v1";', want: "baseDef" },
  { rel: "apps/web/src/shared/storage/x.test.ts", line: '  const p = "/api/v1/y";', want: "test" },
  { rel: "e2e/desktop-http.spec.ts", line: '      if (path.startsWith("/api/v1/")) hits.push(path);', want: "test" },
];
const failedControls = CONTROLS.filter((c) => classify(c.rel, c.line) !== c.want).map(
  (c) => `${c.rel} 期望 ${c.want} 实得 ${classify(c.rel, c.line)}`,
);
const BYPASS_CONTROLS = [
  { line: "  const u = `/api/${v}/x`;", want: true },
  { line: '  const u = "/api/" + "v1/y";', want: true },
  { line: '  const u = "GET /API/V1/thing";', want: true },
  { line: '  const u = "/api/v1/thing";', want: false }, // 负控：严格档自己命中的行不算可疑写法
  { line: '  const u = "/apiv1";', want: false }, // 负控：不含 `/api/` 分隔就不算
];
const failedBypass = BYPASS_CONTROLS
  .filter((c) => isBypass(c.line) !== c.want)
  .map((c) => `「${c.line.trim()}」期望可疑=${c.want} 实得=${isBypass(c.line)}`);

for (const q of readoutHits.slice(0, 10)) console.log(`  只读面里的疑似调用点：${q}`);
if (readoutHits.length > 10) console.log(`  只读面里的疑似调用点：另有 ${readoutHits.length - 10} 条（同上格式）`);
for (const v of violations) console.log(`  越界：${v}`);
console.log(`[apibase] ${shape}`);
console.log(`[apibase] 面：${faceShape}；合计扫描 ${fileTotal} 个文件；${bypassShape}`);
if (missingFaces.length) console.log(`[apibase] 面缺席（本仓没有这些目录，不是漏扫）：${missingFaces.join("、")}`);

if (failedControls.length || failedBypass.length) {
  console.log(
    `UNRELIABLE —— 本档的归类自测失败：${[...failedControls, ...failedBypass].join("；")}`,
  );
  process.exitCode = 1;
} else if (fileTotal < 50) {
  console.log(`UNRELIABLE —— 只扫到 ${fileTotal} 个文件，面小得可疑，别把"越界 0"当证据`);
  process.exitCode = 1;
} else if (!existsSync(join(root, BASE_FILE))) {
  console.log(`UNRELIABLE —— 基址定义那一档的宿主文件 ${BASE_FILE} 不在树里（分派口被搬走了？）`);
  process.exitCode = 1;
} else if (tally.test + tally.comment + tally.baseDef === 0) {
  console.log(`UNRELIABLE —— 判定面一个例外都没算到（${shape}）：路径变了还是字面量已被清掉，分不清就别下结论`);
  process.exitCode = 1;
} else if (tally.violation) {
  console.log(`REGRESSION —— 判定面出现新的云端调用点：${shape}`);
  process.exitCode = 1;
} else {
  console.log(`OK —— 判定面（apps/web/src）越界 0；只读面与可疑写法只是读数，等 §6 定档①决定它们算不算`);
}
