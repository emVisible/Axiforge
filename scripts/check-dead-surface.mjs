#!/usr/bin/env node
/**
 * 死表面棘轮（第 15 道门禁）：从**真入口** `apps/web/src/main.tsx` 走 import 闭包，
 * 闭包之外的 `.ts/.tsx` 模块必须**逐条在册**，多一条就红。
 *
 * 为什么值得从"普查"升成"门禁"：`cloud:callmap` 第十一段给的是一张给人看的清单，
 * 它不会挡住"今天新写了一个没人 import 的模块"。这张清单里已经躺着两个零消费者 barrel
 * （`shared/api/index.ts`、`shared/hooks/index.ts`）和整条试玩云端通路 `usePlayer.ts`——
 * 说明这一族不是理论风险，是已经发生过四次的事实。
 *
 * 判据只取**闭包档**，不取名字档：名字判据会被同名本地组件骗过去
 * （实测 `shared/components/ItemCard.tsx` 已死，而 `ItemsPage` 里有个同名本地 `function ItemCard` 在渲染）。
 * 模块图与遮蔽口径全部来自 `scripts/source-graph.mjs`（与 `cloud-callmap.mjs` 同一个真相源），本脚本不自建一份。
 *
 * 三条腿（护栏脚本必须自带）：
 *   - 该拦：出现不在基线里的死模块 ⇒ FAIL 并点名；
 *   - 该放且清干净：命中集合等于基线 ⇒ OK；清掉一个 ⇒ 提示跑 `--update` 缩短基线（具名基线不缩短等于没关）；
 *   - 失效锁可收回：文件面或闭包异常小 ⇒ 报 `UNRELIABLE` 并 FAIL，绝不让"判据没跑成"伪装成"没有死模块"。
 *
 * 已知不覆盖（自报限度）：
 *   - 面只有 `apps/web/src` 的 `.ts/.tsx`；`.css` / 图片 / JSON / 别的 app（admin、nexus 的 electron）都不在这一面；
 *   - 只认静态 `from "…"` 与字符串字面量的 `import("…")`；运行时拼出来的路径看不见（会误判成死）；
 *   - 被测试 import 的模块**不算死**（机制读者在册）；`*.test.ts(x)` 自身不进基线。
 *
 * 2026-10-09 加**第二档：多余的对外出口**（导出级）——模块在闭包内，但某个具名值导出零外部读者。
 * 加它的直接证据：`shared/lib/identityLink.ts` 的三个身份绑定导出全仓没人 import，而模块因为 `reportContent`
 * 活着 ⇒ **模块级判据结构性看不见这一档**（"活着的面包着死的口"）。判据、口径与限度写在那一段注释里，
 * 一句话版本：按名字数读者、保留字符串内容 ⇒ 这一档刻意**少判死不判死**；它说的是对外暴露面宽了，不是函数死了。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { walk, maskComments, createSourceGraph } from "./source-graph.mjs";

const root = process.cwd();
const ALIAS_ROOT = "apps/web/src";
const ENTRY = "apps/web/src/main.tsx";
const baselinePath = join(root, "scripts/dead-surface-baseline.json");

const graph = createSourceGraph({ root, aliasRoot: ALIAS_ROOT });
const files = graph.files;
const isTest = (rel) => /\.test\.tsx?$/.test(rel);
const nonTest = files.filter((rel) => !isTest(rel));

const reach = graph.closureOf([ENTRY]);
// 测试文件也算读者：机制读者在册的模块不判死（按在册纪律，撤视图不等于撤字段）
const readByTest = new Set(files.filter(isTest).flatMap((t) => graph.importsOf(t)));

const dead = nonTest.filter((rel) => !reach.has(rel) && !readByTest.has(rel)).sort();

const graphBroken = !files.length || !reach.size || !existsSync(join(root, ENTRY)) || files.length < 100;
if (graphBroken) {
  console.log(
    `UNRELIABLE —— 面=${files.length} 个文件、闭包=${reach.size} 个、入口存在=${existsSync(join(root, ENTRY))}；` +
      "这几个数说明图没建起来，这份「零死模块」不能算数",
  );
  process.exitCode = 1;
} else if (process.argv.includes("--update")) {
  writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        allow: dead,
        _note:
          "不在 main.tsx 的 import 闭包里的模块（第 15 道门禁的死表面棘轮基线）。摘掉一个之后重跑 --update 让它缩短，不要留着当豁免。",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`[dead-surface] baseline 已写入：${dead.length} 个闭包外模块`);
} else {
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : { allow: [] };
  const allow = new Set(baseline.allow ?? []);
  const fresh = dead.filter((v) => !allow.has(v));
  const cleared = [...allow].filter((v) => !dead.includes(v));
  if (!existsSync(baselinePath)) {
    console.log(`UNRELIABLE —— 基线文件不在（${relative(root, baselinePath)}），先跑 --update 生成`);
    process.exitCode = 1;
  } else if (fresh.length) {
    console.log(
      `[dead-surface] FAIL —— 闭包外模块 ${dead.length} 个（在册 ${allow.size}），新增 ${fresh.length} 个：界面加载不到它们`,
    );
    for (const v of fresh) console.log(`  - ${v}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[dead-surface] OK —— 闭包外 ${dead.length} 个模块全部在册（基线 ${allow.size}）；面 ${files.length} 个文件、闭包内 ${reach.size} 个` +
        (cleared.length ? `；已摘除 ${cleared.length} 个 ⇒ 基线该缩短：node scripts/check-dead-surface.mjs --update` : ""),
    );
    for (const v of dead) console.log(`  · ${v}`);
  }
}

/*
 * ============ 第二档：多余的对外出口（导出级） ============
 * 判据形状：**模块在闭包内（活着）**，但某个**具名值导出**在别的文件里一次都没出现。
 * 为什么要加这一档：`shared/lib/identityLink.ts` 的三个身份绑定导出（`linkCreatorEmail`／`linkPlayerEmail`／
 * `restoreIdentityFromEmail`）全仓零外部读者，而这个模块因为 `reportContent` 被人 import 着——
 * **模块级判据结构性看不见"活着的面包着死的口"**。云端面上这一档正是 S13-3 判死名单该数清楚的东西：
 * 一个多余的导出口＝一组没人能点到的云端调用点。
 *
 * 口径要说准，别 overclaim：这一档说的是**对外暴露面宽了**，不是"函数是死的"——
 * 同一个符号在本文件内部完全可能还在被用（`linkPlayerEmail` 就调 `linkCreatorEmail`）。
 *
 * 三条设计决定（都是方向性的，改动前先读这段）：
 *  - **参考池比导出面宽**（含 `apps/web/src` 全部（测试也算读者）、`e2e/`、`scripts/`、`apps/admin/src`、
 *    `packages/*`），且遮蔽只剥注释、**保留字符串内容**。按名字算读者会**少判死**——这是刻意的：
 *    把活代码判成死是图判据最坏的方向（已在册），宁可漏报不可误杀。
 *  - 只算**值导出**（function／const／let／class），`export type`／`interface`／`default` 不参与：
 *    类型不进运行时，default 的名字由引用方决定（按名字数必然误配）。
 *  - 基线是**具名棘轮**（`scripts/dead-export-baseline.json`）：现存条目在册，多一条就红并点名。
 *
 * 三条腿：该拦（新增多余出口 ⇒ FAIL 点名）／该放且清干净（等于基线 ⇒ OK，摘掉一条提示 `--update` 缩短）／
 * 失效锁可收回（参考池或导出面异常小、或对照组不成立 ⇒ `UNRELIABLE` 退出 1，"没跑成"绝不伪装成"没问题"）。
 */
const exportBaselinePath = join(root, "scripts/dead-export-baseline.json");
const POOL_DIRS = ["apps/web/src", "e2e", "scripts", "apps/admin/src", "packages/ui/src", "packages/core/src", "packages/editor-core/src"];
const EXP_RE = /export\s+(?:async\s+)?(?:function\s+|const\s+|let\s+|class\s+)([A-Za-z0-9_]+)/g;

const poolTexts = new Map();
for (const dir of POOL_DIRS) {
  for (const abs of walk(join(root, dir), [".ts", ".tsx"])) {
    const rel = relative(root, abs);
    poolTexts.set(rel, maskComments(readFileSync(abs, "utf8")));
  }
}
const refCountIn = (pool, name, selfRel) => {
  const re = new RegExp(`\\b${name}\\b`, "g");
  let n = 0;
  for (const [f, text] of pool) {
    if (f === selfRel) continue;
    const hits = text.match(re);
    if (hits) n += hits.length;
  }
  return n;
};
/*
 * 内建自测跑**真实函数**（在册纪律：判据分支没被真语料行使过就等于没验过，而这里三种形状都有真样本）：
 * ①别处真引用 ⇒ 不算多余；②同名符号躺在别的文件里 ⇒ 算读者（少判死那一侧）；
 * ③只在本文件里用 ⇒ 导出口仍是多余（`*_KEYS` 那一族就是这种）；④谁都找不到 ⇒ 多余。
 */
const EXP_ST = [
  (() => {
    const p = new Map([["a.ts", "export function used() {}"], ["b.ts", "used();"]]);
    return refCountIn(p, "used", "a.ts") > 0;
  })(),
  (() => {
    const p = new Map([["a.ts", "export function twin() {}"], ["b.ts", "function twin() {}"]]);
    return refCountIn(p, "twin", "a.ts") > 0;
  })(),
  (() => {
    const p = new Map([["a.ts", "export const KEYS = 1;\nconst k = () => KEYS;"]]);
    return refCountIn(p, "KEYS", "a.ts") === 0;
  })(),
  (() => {
    const p = new Map([["a.ts", "export function lone() {}"], ["b.ts", "nothing to see"]]);
    return refCountIn(p, "lone", "a.ts") === 0;
  })(),
];
const closureLive = nonTest.filter((rel) => reach.has(rel));
const exportPairs = closureLive.flatMap((rel) => {
  const text = poolTexts.get(rel) ?? "";
  if (!poolTexts.has(rel)) throw new Error(`导出面里的文件不在参考池里：${rel}（池的目录口径变了，这一档的分母不能用）`);
  return [...text.matchAll(EXP_RE)].map((m) => `${rel} :: ${m[1]}`);
});
const extraExports = exportPairs.filter((v) => {
  const [rel, name] = v.split(" :: ");
  return refCountIn(poolTexts, name, rel) === 0;
}).sort();
const CTRL_DEAD = "apps/web/src/shared/lib/identityLink.ts :: linkCreatorEmail";
const CTRL_LIVE = "apps/web/src/shared/lib/creatorId.ts :: getCreatorId";
const ctrlOk = extraExports.includes(CTRL_DEAD) && !extraExports.includes(CTRL_LIVE);
const poolSmall = poolTexts.size < 200;
const faceSmall = exportPairs.length < 100;

if (graphBroken) {
  console.log("[dead-surface] 第二档（多余导出口）跳过——图没建起来，第一档已经报过 UNRELIABLE");
} else if (poolSmall || faceSmall || !ctrlOk || !EXP_ST.every(Boolean)) {
  console.log(
    `UNRELIABLE —— 第二档不能用：参考池=${poolTexts.size} 个文件、导出面=${exportPairs.length} 个、` +
      `自测=${EXP_ST.filter(Boolean).length}/${EXP_ST.length}、` +
      `对照（${CTRL_DEAD} 该在／${CTRL_LIVE} 该不在）⇒ ${ctrlOk ? "通过" : "**失败**"}`,
  );
  process.exitCode = 1;
} else if (process.argv.includes("--update")) {
  writeFileSync(
    exportBaselinePath,
    JSON.stringify(
      {
        allow: extraExports,
        _note:
          "活着模块里零外部读者的具名值导出（第 15 道门禁第二档）。说的是**对外暴露面宽了**，不是函数死了；" +
          "参考池按名字数读者、且保留字符串内容，所以这一档刻意少判死。摘掉一条之后重跑 --update 让它缩短。",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`[dead-surface] 第二档 baseline 已写入：${extraExports.length} 个多余导出口`);
} else {
  const expBaseline = existsSync(exportBaselinePath)
    ? JSON.parse(readFileSync(exportBaselinePath, "utf8"))
    : { allow: [] };
  const expAllow = new Set(expBaseline.allow ?? []);
  const freshExp = extraExports.filter((v) => !expAllow.has(v));
  const clearedExp = [...expAllow].filter((v) => !extraExports.includes(v));
  if (!existsSync(exportBaselinePath)) {
    console.log(`UNRELIABLE —— 第二档基线不在（${relative(root, exportBaselinePath)}），先跑 --update 生成`);
    process.exitCode = 1;
  } else if (freshExp.length) {
    console.log(
      `[dead-surface] FAIL —— 多余导出口 ${extraExports.length} 个（在册 ${expAllow.size}），新增 ${freshExp.length} 个：` +
        "模块活着，但这个对外面没有任何读者",
    );
    for (const v of freshExp) console.log(`  - ${v}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[dead-surface] 第二档 OK —— 闭包内 ${closureLive.length} 个模块的 ${exportPairs.length} 个具名值导出里，` +
        `零外部读者 ${extraExports.length} 个（基线 ${expAllow.size}）；参考池 ${poolTexts.size} 个文件` +
        (clearedExp.length ? `；已收口 ${clearedExp.length} 个 ⇒ 基线该缩短：node scripts/check-dead-surface.mjs --update` : "") +
        `\n  限度：按名字数读者（同名即算读者，保留字符串内容）⇒ 这一档少判死不判死；类型与 default 导出不参与。`,
    );
    for (const v of extraExports) console.log(`  · ${v}`);
  }
}
