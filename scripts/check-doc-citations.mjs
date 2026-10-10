#!/usr/bin/env node
/**
 * 文档引用对账：`docs/**` 与 `README.md` 里写的 `路径:行号` 必须**文件存在且行号落在范围内**。
 *
 * 为什么要有这一道：今天一天里 `parse.ts` 的同一个域外提了三次（`edges.ts` / `condition.ts` / `instructions.ts`），
 * 每次搬家都会让文档里的行号引用失去落点。文档可以带日期地记录历史（"决策当时的落点"），
 * 但**不能指到一个不存在的文件或一个越界的行号**——那会让下一会话按错坐标去改代码。
 * 只判"存在 + 在范围内"这一条，不判"那一行内容对不对"（内容层要靠人，见 ADR-027 的行号搬家补记）。
 *
 * 已知不覆盖（自报限度，出现时按提示升级判据而不是放宽档位）：
 *   - 不校验行号所指内容是否仍是当初那段代码（`file.ts:234-318` 只要还在文件长度内就算过）。
 *     **这一条今天试过并否掉了，别再往内容层走**：把同行反引号里的标识符拿去目标文件里找，
 *     52 条可判引用里 20 条被标（**误报率 38%**），逐条看全是同一个成因——
 *     一行同时引用两个文件时（`print.ts` 那条与 `axsImport.ts` 那条各带自己的符号），
 *     "标识符属于哪一个引用"没有机械可依据的邻近关系，于是 `_edges` 被拿去 `print.ts` 找、
 *     `parseAxsToPlan` 被拿去 `axsImport.ts` 找，一半必然对不上。
 *     要判内容就得先解"标识符↔引用"配对，而散文写法不支持可靠配对；放宽成"任一文件出现即可"又等于没判。
 *   - 不认没有反引号/路径前缀的裸行号（`见 :123` 单独出现的写法）；
 *   - 不认格式变体：全角冒号（`parse.ts：12`）、反引号只包住文件名（`` `parse.ts`:12 ``）、
 *     `#` 分隔（`parse.ts#12`）都不在这条正则的识别面内，写成那样就静默不判；
 *   - `CITATION_RE` 的扩展名枚举漏了 `.sh`（`SRC_EXT` 里有），所以 `setup-db.sh:12` 这类引用不被判；
 *   - `ambiguous`（多个同名/同后缀文件）是**静默跳过**，只计数不棘轮：多一个同名文件就静默关掉一整类引用。
 *     复审已把候选集收窄到 `tracked`（当天 28 条因此从"歧义跳过"变回"真的被判"），但这条出口本身还在。
 *
 * 2026-10-01 复审修掉的三处**假绿**（都出在"判了但判不出来"这一侧，而不是"没判"）：
 *   ① `suffixHits` 吃的是 `everyFile`（含 `node_modules/` 与 `Clearance/` 的副本），候选一多就全变 ambiguous
 *      而静默跳过——已判定数因此虚低 28 条。改成只吃 `tracked`。
 *   ② 「只在被跳目录里找到」那一档原按 **basename** 匹配 `everyFile`，等于把"文件不存在"整档关掉：
 *      仓里任何地方有个同名文件，不存在的路径就绿。实测当时就中着 `packages/core/compiler.ts`
 *      （真实路径少写了一段 `src/`），已改正文。变量名写着 `inSkipped`，代码实现的却是"按 basename 找"。
 *   ③ `SKIP_DIR` 在收集阶段被喂**绝对路径**、在 `suffixHits`/`inSkipped` 被喂**相对路径**，
 *      而原式要求目录名前面有一个 `/`，于是**位于仓库根的** `Clearance/` 两种输入下结论相反
 *      （收集时算被跳、判定时不算）。同一份判据只能有一种输入形状，否则"跳过"与"不存在"的界线随调用点漂移。
 *   三处修完，已判定数 168 → 197（29 条此前根本没被判的引用回到了判据面内），
 *   并浮出 1 条真的路径写错（已改正文）＋ 2 条历史快照的行号（按"历史文本不重写"入基线）。
 *   牙：临时放一条「不存在的路径 + 仓里有同名文件」⇒ FAIL 点名、退出码 1；删净 ⇒ OK。
 *
 * 基线身份**不含文档行号**（2026-10-01 04:04 改）：原先每条在册记录写成 `某文档.md:1939 行号越界 → parse.ts:417`，
 * 于是**只要在那一行之上插入任何文字**，同一条历史记录就会被当成"新增悬空"报红——今天写第十七批时就是这样误报了 3 条。
 * 位置不是身份：在册项的意义是"某文档里有一条指向某文件某行的历史引用"，所以身份键改成 `某文档.md → parse.ts:417`，
 * 打印时仍带上当前行号方便人去修。**这类棘轮的键必须只用"被改动时不变"的量**——否则每次写文档都在制造假新增。
 * 光去掉行号还不够（04:07 又抓到一次，客户还是我自己）：键里再加上**所在句子前 200 字符的指纹**。
 * 理由：去掉行号后"同文档 + 同目标行"就归成一个键，于是一条基线项能白掉任意多次复述——
 * 实测那一跑是 `越界 8 / 基线 3 / 退出码 0`，因为我在解释这道门禁的段落里**把那三个坏目标原样引用了一遍**。
 * 指纹不是位置（句子搬家仍是同一句），所以两条要求同时满足：既不被插入顶红，也不被复述绕白。
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const DOC_ROOTS = ["docs", "README.md", "BLUEPRINT_v1.0.md"];
const baselinePath = join(root, "scripts/doc-citation-baseline.json");

const files = [];
function walk(p) {
  if (!statSync(p).isDirectory()) {
    if (p.endsWith(".md")) files.push(p);
    return;
  }
  for (const name of readdirSync(p)) walk(join(p, name));
}
for (const rel of DOC_ROOTS) {
  const abs = join(root, rel);
  if (existsSync(abs)) walk(abs);
}

/**
 * `path.ts:12` / `path.ts:12-20` / `path.ts:12,20` / 反引号内 `path.ts:12,34` 都认
 */
const CITATION_RE = /([A-Za-z0-9_@./-]+\.(?:ts|tsx|py|json|mjs|rs|md|bash|yml|yaml)):(\d[\d,\-\s]*)/g;

const lineCountCache = new Map();
function lineCount(relPath) {
  if (lineCountCache.has(relPath)) return lineCountCache.get(relPath);
  const n = readFileSync(join(root, relPath), "utf8").split("\n").length;
  lineCountCache.set(relPath, n);
  return n;
}

/**
 * 文档大量使用**裸文件名**（`parse.ts:234`、`ai_draft.py:109`），这在建立过上下文的段落里是正常写法。
 * 所以按 basename 在受追踪源码里找唯一匹配：唯一才判、多个就跳过（不能凭猜判定坐标错），
 * 一个都没有才算"文件不存在"。构建目录与依赖目录不参与匹配，否则 `target/` 里的副本会让判据变宽。
 *
 * **这一段必须是相对仓库根的形状**（`(^|[/\\])` 而不是只 `[/\\]`）：2026-10-01 复审实测，
 * 原式对 `Clearance/core/gateway.py` 这种**位于仓库根的**被跳目录不匹配——
 * 于是它既不在 `tracked` 里、也不算"落在被跳目录"，被判成"文件不存在"，
 * 而它其实好好地躺在那里。同一份 `SKIP_DIR` 在收集阶段被喂绝对路径（匹配）、
 * 在 `suffixHits` / `inSkipped` 被喂相对路径（不匹配），两处口径不一致就是这个下场。
 * 一份判据只该有一种输入形状，否则"跳过"与"不存在"的分界线随调用点漂移。
 */
const SKIP_DIR =
  /(^|[/\\])(node_modules|Clearance)([/\\]|$)|[/\\](dist|build|target)[/\\]|[/\\]\.venv[/\\]/;
const SRC_EXT = /\.(ts|tsx|py|json|mjs|rs|bash|sh|yml|yaml|md)$/;

/**
 * 「仓外未纳管」档（2026-10-10 加，由干净 clone 对照逼出来的）。
 *
 * 起因：`pnpm gates` 在这台机器上 0，在同一条 commit 的干净 clone 上 **FAIL**——
 * ADR-028 与 REFACTOR_DESKTOP 引的 `engines.py`／`gateway.py`／`store.py` 住在隔壁那个
 * **未纳管的 `Clearance/`** 里。本机磁盘上有它 ⇒ 落进 `skippedHit`；clone 上没有 ⇒ 同样的
 * 引用落进 `missing`。**一个事实两种读法，就是"这台机器的读数"本身**。
 *
 * 所以这一档必须在**碰磁盘之前**判完：清单是手写的（doc, ref）对，身份**不含行号**
 * （同一天两次踩过的坑：拿行号当身份 ⇒ 写一次文档就假红一次），也**不从磁盘反推**
 * （反推就等于把判据重新绑回本机目录形状）。
 *
 * 三件事各自有腿：①清单里的对必须真被行使过，否则棘轮等于没关（`stale` 那条 FAIL）；
 * ②判定面为空（`已判定 0`）不算通过；③本函数自带合成对照——一条必须判出、
 * 两条必须不判出，不依赖真实清单非空。
 *
 * **残余限度（2026-10-10 由配对对照量出来，别把它当成已消除）**：这一档只覆盖**登记过**的
 * 引用。没登记的那一类"只有在本机隔壁未纳管目录里才存在"的引用，仍然随磁盘形状在两台上
 * 给出不同读法（本机 `skippedHit`、clone `missing`）。所以"该拦"这条腿**在开发机上结构性
 * 点不亮**——实测摘掉清单里一对，本机仍 exit 0（它掉进 skippedHit 而不是 missing），
 * 只有干净 clone 才点亮它。⇒ 取这条腿的数必须在 clone 上取；本机跑出来的绿只说明
 * "这台机器上没有新的悬空引用"。要彻底消除得改 `SKIP_DIR` 那一档的口径（从"磁盘上有"
 * 改成"形状上属于仓外"），而那会把裸文件名的引用一并暴露在两种读法下——是口径决策，
 * 已登记待决，不在这里顺手改。
 */
const EXTERNAL_PATH = join(root, "scripts/doc-citation-external.json");
const externalPairs = new Set(
  existsSync(EXTERNAL_PATH)
    ? (JSON.parse(readFileSync(EXTERNAL_PATH, "utf8")).pairs ?? [])
    : [],
);

/** 纯谓词：一对（文档, 引用）是否在「仓外未纳管」清单里。不读磁盘、不看目录是否存在。 */
function externalPairHit(pairs, docRel, ref) {
  return pairs.has(`${docRel}|${ref}`);
}

// 合成对照（真实清单为空也照跑）：摘掉这一腿，整档会退化成"清单写什么算什么"。
const extControls = [
  { want: true, desc: "在册的对必须判出", got: externalPairHit(new Set(["a.md|x.py"]), "a.md", "x.py") },
  { want: false, desc: "同一个 ref 换文档不许判出", got: externalPairHit(new Set(["a.md|x.py"]), "b.md", "x.py") },
  { want: false, desc: "不在册的对不许判出", got: externalPairHit(new Set(["a.md|x.py"]), "a.md", "y.py") },
];
const extControlFails = extControls.filter((c) => c.got !== c.want);
const tracked = [];
const everyFile = [];
function collect(p, intoSkipped) {
  let st;
  try {
    st = statSync(p);
  } catch {
    return;
  }
  const skipped = SKIP_DIR.test(p);
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) collect(join(p, name), skipped);
  } else if (SRC_EXT.test(p)) {
    const rel = relative(root, p).split("\\").join("/");
    everyFile.push(rel);
    if (!skipped && !intoSkipped) tracked.push(rel);
  }
}
for (const name of readdirSync(root)) collect(join(root, name), false);

const byBase = new Map();
for (const rel of tracked) {
  const base = rel.split("/").pop();
  if (!byBase.has(base)) byBase.set(base, []);
  byBase.get(base).push(rel);
}

/** 后缀命中：文档常从子根写起（`projection/axs.ts`、`features/studio/components/ScriptEditor.tsx`），
 *  这跟裸文件名一样是合法简写；唯一后缀才判，多个后缀算歧义，一个都没有才算不存在。
 *
 * 只能吃 `tracked`（跟踪文件、不在被跳目录里）。2026-10-01 复审改：原写吃 `everyFile`，
 * 也就是把 `node_modules/` 与 `Clearance/` 里的副本也算进候选——后果不是"判得更宽"，
 * 而是**候选变多 → 命中变多 → 变成 ambiguous → 静默跳过**：同一天实测 28 条本该判的引用
 * 掉进这个洞（`core/src/ir.ts` 命中 15 份、`projection/axs.ts` 4 份），已判定数因此虚低。
 * "多个同名文件判不了就跳过"那条规矩是对的，但**候选集必须先收窄**，
 * 否则"歧义"这个出口会把整类引用静默变成不判。 */
function suffixHits(rel) {
  return tracked.filter((f) => f === rel || f.endsWith("/" + rel));
}

function resolveRef(rawPath, docRel) {
  if (rawPath.includes("...")) return { kind: "ellipsis" };
  const direct = join(root, rawPath);
  if (existsSync(direct) && statSync(direct).isFile()) return { kind: "ok", rel: rawPath };
  const hits = rawPath.includes("/")
    ? suffixHits(rawPath)
    : (byBase.get(rawPath) ?? []).filter((f) => !SKIP_DIR.test(f));
  if (hits.length === 1) return { kind: "ok", rel: hits[0] };
  if (hits.length === 0) {
    // 先查手写清单，再碰磁盘：顺序反过来，同一句引用在本机算 skippedHit、在干净 clone 算
    // missing，门禁就从"判一个事实"退化成"判这台机器上有没有那个隔壁目录"。
    if (externalPairHit(externalPairs, docRel, rawPath)) return { kind: "external" };
    // 「只在被跳目录里找到」——2026-10-01 复审改，原实现是**按 basename 匹配 `everyFile`**，
    // 那等于把"文件不存在"这一档整档关掉：仓库里任何地方（含 node_modules、Clearance/）
    // 有个同名文件，一条**根本不存在的路径**就被判成 skippedHit 而放行。
    // 实测当时就中着 4 条，其中 `packages/core/compiler.ts` 真的不存在（真实路径少写了一段 `src/`），
    // 却因为 `packages/core/src/compiler.ts` 存在而绿。变量名 `inSkipped` 描述的是意图，代码没实现它。
    // 现在两条都要成立：**路径后缀对得上** 且 **落在被跳目录里**。
    const inSkipped = everyFile.filter(
      (f) => SKIP_DIR.test(f) && (f === rawPath || f.endsWith("/" + rawPath)),
    ).length;
    return inSkipped ? { kind: "skippedHit" } : { kind: "missing" };
  }
  // 多个同名/同后缀文件：判不了就跳过这一条，并单独计数——
  // "跳过多少"必须可见，否则判据退化成了沉默放行
  return { kind: "ambiguous" };
}

const violations = [];

/**
 * 身份键要同时满足两条（2026-10-01 连着各踩一次）：
 * ① **不含文档行号**——否则在它上方插入文字就把在册项变成"新增"，写一次文档假红一次，
 *    而假红的标准处置是 `--update`，等于每写一段文档都把漂移重新登记成合法；
 * ② **含引用所在句子的指纹**——否则同一文档里另起一句复述同一个坏目标会撞上同一个键，
 *    一条白名单就白掉 N 次越界（04:06 实测：越界 8、基线 3、退出码 0）。
 */
function citationKey(file, target, lineText) {
  const fingerprint = createHash("sha1")
    .update(lineText.trim().slice(0, 200))
    .digest("hex")
    .slice(0, 10);
  return `${relative(root, file)} → ${target} #${fingerprint}`;
}

const tally = { ok: 0, ambiguous: 0, ellipsis: 0, skippedHit: 0, external: 0, missing: 0, outOfRange: 0 };
const matchedExternal = new Set();
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const docLines = src.split("\n");
  const docRel = relative(root, file).split("\\").join("/");
  for (let i = 0; i < docLines.length; i++) {
    for (const m of docLines[i].matchAll(CITATION_RE)) {
      const [, rawPath, rawNumbers] = m;
      const r = resolveRef(rawPath, docRel);
      if (r.kind === "ellipsis") {
        tally.ellipsis += 1;
        continue;
      }
      if (r.kind === "ambiguous") {
        tally.ambiguous += 1;
        continue;
      }
      if (r.kind === "external") {
        tally.external += 1;
        matchedExternal.add(`${docRel}|${rawPath}`);
        continue;
      }
      if (r.kind === "skippedHit") {
        tally.skippedHit += 1;
        continue;
      }
      if (r.kind === "missing") {
        tally.missing += 1;
        violations.push({
          key: citationKey(file, `${rawPath}`, docLines[i]),
          display: `${relative(root, file)}:${i + 1} 文件不存在 → ${rawPath}`,
        });
        continue;
      }
      tally.ok += 1;
      // 行号只取出现的最大者：区间与列表都以"最后一项必须落在文件里"为判据
      const nums = rawNumbers.match(/\d+/g) ?? [];
      const max = Math.max(...nums.map(Number));
      const total = lineCount(r.rel);
      if (max > total) {
        tally.outOfRange += 1;
        violations.push({
          key: citationKey(file, `${r.rel}:${String(max)}`, docLines[i]),
          display: `${relative(root, file)}:${i + 1} 行号越界 → ${r.rel}:${max}（该文件共 ${total} 行）`,
        });
      }
    }
  }
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : { allow: [] };
const allow = new Set(baseline.allow ?? []);
const fresh = violations.filter((v) => !allow.has(v.key));
// 各档计数必须打出来：判据退化（全变成 ambiguous/ellipsis）时，只有计数会暴露它
const shape = `已判定 ${tally.ok}、越界 ${tally.outOfRange}、不存在 ${tally.missing}、歧义跳过 ${tally.ambiguous}、省略号跳过 ${tally.ellipsis}、只落在被跳目录 ${tally.skippedHit}`;

if (process.argv.includes("--update")) {
  writeFileSync(
    baselinePath,
    JSON.stringify(
      { allow: [...new Set(violations.map((v) => v.key))].sort(), _note: "文档里的悬空引用；清偿后应缩短" },
      null,
      2,
    ) + "\n",
  );
  console.log(`[doc-citations] baseline 已写入：${new Set(violations.map((v) => v.key)).size} 条（${shape}）`);
} else if (fresh.length) {
  console.log(`[doc-citations] FAIL —— 扫描 ${files.length} 个文档，${shape}；${fresh.length} 条新增悬空/越界`);
  for (const v of fresh.slice(0, 40)) console.log(`  - ${v.display}`);
  process.exitCode = 1;
} else {
  console.log(`[doc-citations] OK —— 扫描 ${files.length} 个文档，${shape}（基线 ${allow.size} 条在册）`);
}

/**
 * 「仓外未纳管」这一档必须自己说话，而且要单独打印：它不在 shape 那行里，而它恰恰是
 * 本机读数与干净 clone 读数的分界处（同一个事实，两种读法就是"这台机器的读数"本身）。
 *
 * 三条腿各自独立、全部打印，不折成布尔：
 * ①合成对照不成立 ⇒ UNRELIABLE（判据自己坏了，不能拿它去判别人）；
 * ②判定面为空 ⇒ UNRELIABLE（引用面被搬走或全被判成跳过，绿灯不携带信息）；
 * ③清单里的对今天一次都没出现 ⇒ FAIL（清偿了就删，留着就是把豁免敞在那里）。
 */
console.log(
  `[doc-citations] 仓外未纳管 ${tally.external} 次（清单 ${externalPairs.size} 对，被行使 ${matchedExternal.size} 对）`,
);
const staleExt = [...externalPairs].filter((k) => !matchedExternal.has(k));
if (extControlFails.length) {
  console.log(
    `[doc-citations] UNRELIABLE —— 仓外档自测 ${extControlFails.length} 条不符（应当一条判出、两条不判出）`,
  );
  for (const c of extControlFails) console.log(`  - ${c.desc}：期望 ${c.want}，实得 ${c.got}`);
  process.exitCode = 1;
} else if (files.length === 0 || tally.ok === 0) {
  console.log(
    `[doc-citations] UNRELIABLE —— 判定面为空（文档 ${files.length} 个、已判定 ${tally.ok}），这一档今天没在判任何东西`,
  );
  process.exitCode = 1;
} else if (staleExt.length) {
  console.log(
    `[doc-citations] FAIL —— 仓外清单有 ${staleExt.length} 对今天不再出现：清偿了就删掉，留着等于把豁免敞着`,
  );
  for (const k of staleExt) console.log(`  - 过期豁免：${k}`);
  process.exitCode = 1;
}
