import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { walk, createSourceGraph, maskComments, maskNonCode, blockPairs, stmtEnd, lineOf, parseRoutes, lazyImports } from "./source-graph.mjs";

/**
 * 云端调用面的具名清单（S13-3「云端功能处置」的定档附件）。
 *
 * 为什么要脚本化：这个判断此前**每次都靠人读**（`shared/api/**` 逐个函数看谁在调、有没有本地替身），
 * 于是每轮都得重做一遍，而且上一轮的结论会随代码漂移变成假话。
 * `pnpm e2e:desktop` 那套只测**页面装载时**发不发（桌面臂实测 0 笔），
 * 它测不到**用户点某个按钮**时才发出去的那些——本脚本量的就是这一面：可达的调用点。
 *
 * 六档裁决（判法在下面的 `tier` 分支，这段只是索引）：
 *   - 死面    ：api 层定义了函数，但 `apps/web/src` 里（除 api 层与测试）**没有任何调用点**
 *              ⇒ S13-3 判死清单里最容易摘的一档（删掉不影响任何界面）。
 *   - 仅 HTTP 实现侧：只有 `shared/storage/http*.ts` 引用它 ⇒ 那是 Provider 的 fallback 实现本身，界面没有调用点。
 *   - 已有分派口引用（云端是 fallback）：**分派口文件**（`*Saves` / `assetPool*` / `achievementDefs`）里出现了这次调用。
 *   - 调用者已接本地库：所有调用点文件都 import 了某个分派口（`*Saves` / `assetPool*` / `axspImport` / `desktopSeed` / `getStorageProvider`）。
 *   - 混合：只有一部分调用者接了本地库 ⇒ 同一个函数有的走本地有的直连云端，要逐个看。
 *   - 绕过（无分派口引用）：有界面调用点，但调用点文件没 import 任何分派口，分派口里也没引用这个函数
 *              ⇒ 桌面态真会打到 `/api/v1` 的那一类，是要逐个定性的主体（表末再按本地承载 + 可达性切成三态）。
 *
 * 已知不覆盖（自报限度，出现时按提示升级判据而不是放宽档位）：
 *   - 调用点按 `xxxApi.method(` 的**符号名**匹配，不看类型层：只把 api 函数当**类型**导入的文件不计为调用点
 *     （实测这一族会虚报，所以按调用语法匹配；类型导入是另一个问题，不进本表）。
 *   - 经 `index.ts` 再导出后改名再调用的形状会**漏计**（按原名匹配）。
 *   - 不解析路径模板：`/characters/${id}` 原样印出，不做变量代入。
 *   - 分派口的判定只看 import，不看那次调用是否真走本地支——那是 `check:dispatch` 与点击层判据的活，不在这里冒充。
 *   - 表末的「本地承载」段：词元按 `_` / camelCase 切分后**全等**比较（子串包含会把 `play` 匹进 `player_achievements`），
 *     且**只有路径末段命中才算"该资源自身有承载"**，父段命中只记"子资源无专属表"。
 *     这两条收紧的是匹配形状，不是结论资格：**正向匹配仍必须回代码核对**
 *     （活例 `GET /play/sessions/${id}/characters` 命中 `characters`，实为一次会话的角色状态，不是角色记录）。
 *   - 「桌面不可达」档只认**调用者集合完全落在 `features/discover/` 下**；混合调用者（一处 discover、一处 studio）保守地留在可达侧。
 *   - 壳守卫分档的扫描面是「绕过 + 混合」两面：只扫绕过会让 S2（`if (guard) { api.x() }`）这一形状**永远没有样本**，
 *     而没被行使过的判据分支等于没验过的判据。本面 S2 实测 0 命中，该形状另用合成样本验过（含两条反向：块头没守卫、守卫在隔壁函数里，都判 null）。
 *   - 最后一段的宿主可达性用 **import 闭包**，它比"渲染可达"宽：`import 了却从没 `<它>` 的面板` 由"除 import 外全仓无引用点"单独摘一档，
 *     而**消费者级条件渲染不认**（实测 `AppHeader.tsx:69` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`
 *     挡住了整块搜索，但 `GlobalSearch.tsx` 自己一行守卫都没有）——这一条让计数**偏保守**（宁可多列，不许藏缺陷）。
 *   - 早退判据只认**组件体的直接子语句**（深度 0）且带 `return`/`throw`：`PlayerPage.tsx:369` 那句写在 `load` 回调里（深度 1），
 *     只保护那一行，不能算整页不渲染。
 *   - 死表面普查有两档强度，别混用：**闭包档**（不在 `main.tsx` 的 import 闭包里）是可靠的"走不到"；
 *     **名字档**（除 import 语句外全仓无引用点）只能列名不能判死——实测 `shared/components/ItemCard.tsx` 已死，
 *     而 `ItemsPage` 里有一个同名**本地** `function ItemCard` 在渲染：名字判据会被这种撞车骗过去，闭包判据不会。
 *
 * 用法：`pnpm cloud:callmap`。退出码：0 = 正常出表；1 = **这次没跑成**（api 目录读不到 / 一个端点都没解析出来）。
 */
/** 目录遍历（含 `Clearance/` 禁入的跳过清单）在 `source-graph.mjs` 里，本脚本不另存一份 */
const root = process.cwd();

/**
 * 模块图与两份遮蔽都来自 `source-graph.mjs`（唯一真相源）：本脚本与 `check-dead-surface.mjs`
 * 必须对"什么算引用、什么算入口"给同一个答案，否则两张表会对同一个模块说反话。
 */
const ALIAS_ROOT = "apps/web/src";
const graph = createSourceGraph({ root, aliasRoot: ALIAS_ROOT });
const allPool = graph.files;
const SRC_POOL = allPool.filter((rel) => !/\.test\.tsx?$/.test(rel));
const maskedSrc = graph.maskedOf;
const codeSrc = graph.codeOf;
const resolveSpec = graph.resolveSpec;
const importsOf = graph.importsOf;
const closureOf = graph.closureOf;

const apiDir = join(root, "apps/web/src", "shared", "api");
const srcDir = join(root, "apps/web/src");
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".vite"]);

function tsFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      tsFiles(join(dir, e.name), out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(e.name)) continue;
    out.push(join(dir, e.name));
  }
  return out;
}

const apiFiles = existsSync(apiDir)
  ? tsFiles(apiDir).filter(
      (f) => !["client.ts", "index.ts"].includes(basename(f)),
    )
  : [];

const METHOD_RE = /^\s*([A-Za-z0-9_]+):\s*(?:async\s*)?\(/;
const CALL_RE = /apiClient\.(get|post|put|patch|delete)(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)/;
/**
 * 分派口的识别信号（2026-10-09 修过两次，都记在这里免得再犯）：
 *   - 只认 `*Saves` 那一种命名会**漏**：hooks 层走的是 `getStorageProvider()`（Provider 工厂）
 *     与 `isTauriEnvironment()`，实测 `useCharacters.ts` 因此被误判成「直连云端」，
 *     而它第 5 行就 import 了工厂。
 *   - `shared/storage/http*.ts` 是 Provider 的 **HTTP 实现侧**，它出现在调用点里不代表"绕过"，
 *     只代表"这条 fallback 得有人实现"，所以单列一档、不计入绕过面。
 */
const DISPATCH_RE = /(Saves|assetPool|achievementDefs|axspImport|desktopSeed|getStorageProvider|createStorageProvider|draftDispatch|storage\/index|from\s+["']@\/shared\/storage["'])/;
const IMPL_RE = /shared\/storage\/http[A-Za-z]*\.ts$/;
/**
 * 分派口文件本身。`check:dispatch` 的面是 `shared/storage/` 那一个目录（按 `<域>Saves.ts` 命名 + `assetPool*` +
 * `achievementDefs` 一条已知偏差），**看不见同样在分派的 `shared/api/draftDispatch.ts`** ⇒ 这里把它补进来，
 * 两个判据读的是各自的面，不再假装同一个集合（差异已登记进 HANDOFF §6）。
 */
const DISPATCH_FILE_RE = /(?:shared\/storage\/(?:[A-Za-z0-9]+Saves|assetPool[A-Za-z0-9]*|achievementDefs)|shared\/api\/draftDispatch)\.ts$/;

/**
 * 壳守卫的**调用点级**判据。为什么不能用"文件里出现过守卫"：实测 `useRelations.ts` 五条查询里
 * 只有 `presets` 带 `enabled: !isLocalOnlyDeployment()`，另外四条没有——按文件算会把五条全判成安全，
 * 而那四条正是"桌面态真会打出去"的调用点。**方向上宁可少判成安全**（漏判守卫 = 多列一条候选，
 * 误判守卫 = 把一条真缺陷藏起来）。
 *   S1 同块：守卫在包住这次调用的最内层 `{}` 内（react-query 的 `enabled:` 即此形状）
 *   S2 同句：守卫在这条调用语句自己的前缀里（`if (!isTauriEnvironment()) api.x()`）
 *   S3 早退：守卫是某个祖先块的**直接子语句**、含 `return`/`throw`、且整条语句在这次调用之前
 *      （`if (isLocalOnlyDeployment()) return null;` 之后才定义动作）
 * 限度：字符串/注释内容按同长度空白遮蔽，所以写在模板串插值里的守卫会判成"无守卫"；正则字面量里的引号会带偏遮蔽。
 */
const GUARD_CALL = String.raw`is(?:TauriEnvironment|LocalOnlyDeployment)\(\)`;
/**
 * 守卫形状的字面式 **加上同一文件里的布尔别名**。
 *
 * 为什么要认别名：桌面闸门常常写成 `const localOnly = isLocalOnlyDeployment()`，
 * 之后在 effect 首行 `if (localOnly) return;`（discover 那 6 页今天就是这么补的——
 * 闸门必须同时挡 effect，只在渲染层早退挡不住请求）。
 * 只认字面调用的后果是实测到的：那条 `if (localOnly) return;` 完全符合 S3（祖先块直接子语句 + `return` + 在调用之前），
 * 却因文本对不上而判不出 ⇒ 调用点从"无守卫"掉进"文件有守卫但该调用点未判出"（15 → 22 处），
 * 静态上界跟着虚高，而 §6 ② 那份判死名单正是拿这个上界当分母的。
 *
 * 两处克制，免得把判据放宽成"藏缺陷"：
 *   - 只认**由守卫式调用直接初始化**的变量名，且**同文件内**有效（不追跨文件传参）；
 *   - S3/S2 本身已经要求它处在判定位置（`if (` 之后紧跟、或整条语句含 `return`/`throw`），
 *     所以别名不会把 `[id, localOnly]` 这种依赖数组里的出现误当守卫。
 */
function guardSrc(masked) {
  const aliases = [
    ...new Set(
      [...masked.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*is(?:TauriEnvironment|LocalOnlyDeployment)\(\)/g)].map((m) => m[1]),
    ),
  ];
  /**
   * 别名只认**处在布尔位置**上的用法，而不是"这个标识符在块里出现过"：
   * 前面必须贴着一层判断结构 —— `if (localOnly`、`if (!localOnly`、`!localOnly`、`&& localOnly`、`|| localOnly`、
   * `: localOnly`（`enabled: !localOnly` 这类条件属性）、`? localOnly`。
   *
   * 为什么不是"出现过就算"：那会把 `[id, localOnly]`（依赖数组）与 `{localOnly}` 这类**只是搬值**的位置
   * 也算成守卫 ⇒ 把真没挡住的调用判成有守卫，**误判守卫就是把缺陷藏起来**。
   * 为什么也不是更严的"必须紧跟 `)`/`&&`/`?`"：实测那样会把
   * `enabled: !!character && !localOnly,`（CharacterDetailPage 的版本查询，155 行）判成没有守卫——
   * 它明明是真闸门。**两头各错过一次，取中间那条：看它前面贴没贴判断结构。**
   */
  const ALIAS_USE = String.raw`(?:if\s*\(\s*!?|!?&&\s*|!?\|\|\s*|[?:]\s*|!)\b%s\b`;
  const alts = aliases.map((a) => ALIAS_USE.replace("%s", a));
  return alts.length ? `${GUARD_CALL}|(?:${alts.join("|")})` : GUARD_CALL;
}
/**
 * 守卫形状判据的内建自测：**直接跑 `guardShape`**（真实判据路径），不测"调用点之前的文本"——
 * 上一版自测就是这么错的：真实代码里 `enabled: !localOnly` 写在 `queryFn` **之后**，
 * 靠的是 S1「同块」而不是前缀，用前缀当 harness 会把这条真闸门判成"没守卫"却自称通过。
 * 四条样本各自一种形状，两条正反成对：
 *   - S3：组件体里 `if (localOnly) return`，调用在后面的 effect 里 ⇒ 要判出
 *   - S1：`{ queryFn: () => api.x(), enabled: !!a && !localOnly }`（同块，写在调用之后）⇒ 要判出
 *   - 反例 A：别名只出现在依赖数组 `[id, localOnly]` ⇒ **不许**判出
 *   - 反例 B：别名只是被搬进对象字面量 `{ localOnly }`，调用在它之后 ⇒ **不许**判出
 */
function guardSelfTest() {
  const shape = (t) => guardShape(t, blockPairs(t), t.indexOf("api.x("));
  const DEF = "const localOnly = isLocalOnlyDeployment();";
  const shapes = {
    S3闸门早退: shape(`function C(){ ${DEF} if (localOnly) return 0; q(() => { api.x(); }); }`),
    S1同块条件属性: shape(`function C(){ ${DEF} const qs = { queryFn: () => api.x(), enabled: !!a && !localOnly }; }`),
    依赖数组: shape(`function C(){ ${DEF} q(() => { api.x(); }, [id, localOnly]); }`),
    搬值: shape(`function C(){ ${DEF} const cfg = { localOnly }; api.x(); }`),
  };
  const res = {
    闸门早退判出: shapes.S3闸门早退 !== null,
    同块条件属性判出: shapes.S1同块条件属性 !== null,
    依赖数组不误判: shapes.依赖数组 === null,
    搬值不误判: shapes.搬值 === null,
  };
  console.log("  （自测实际判到的形状：" + Object.entries(shapes).map(([k, v]) => `${k}=${v ?? "null"}`).join("、") + "）");
  return { ok: Object.values(res).every(Boolean), res };
}

/**
 * 只遮注释、保留字符串：给模块图与路由表用。
 * 分开两份遮蔽是有原因的——`maskNonCode` 连字符串一起遮（守卫判据要数花括号，串里的 `{` 会把嵌套带偏），
 * 但 `import("…")` 的**路径本身就在字符串里**，用前者去抽模块图会得到"0 条路由 + 全是零挂载"这种假读数。
 */

function guardShape(masked, pairs, idx) {
  /**
   * 「这块里有守卫」必须是**处在判定位置**的守卫，不包括把结果存进变量的那句定义。
   * 这一条不是理论洁癖：`const localOnly = isLocalOnlyDeployment()` 写在组件体里，
   * 而 S1 扫的是整个最内层块 ⇒ 不过滤定义位的话，**只要调用体和这句声明在同一个块里就算"有守卫"**，
   * 那是把真没挡住的调用判成安全（藏缺陷方向）。自测的「搬值不误判」就是为它加的。
   */
  const guardSrcAll = guardSrc(masked);
  const guardInBlock = (text) => {
    for (const m of text.matchAll(new RegExp(guardSrcAll, "g"))) {
      if (/=\s*$/.test(text.slice(0, m.index))) continue;
      return true;
    }
    return false;
  };
  const anc = pairs
    .filter(([o, c]) => o < idx && idx < c)
    .sort((a, b) => a[1] - a[0] - (b[1] - b[0]));
  // S1 看的是**整个最内层块**而不是"调用之前的那截"：react-query 的 `enabled:` 常常写在 `queryFn` 后面
  if (anc.length && guardInBlock(masked.slice(anc[0][0] + 1, anc[0][1]))) return "S1";
  let s = idx;
  while (s > 0 && !";{}".includes(masked[s - 1])) s--;
  // 停在 `{` 上说明这次调用是某个块语句的第一条：守卫写在这个块的**头部**（`if (guard) { api.x() }`），
  // 只回头看块内那一截会什么都看不见（合成样本实测：修之前 S2 对这一形状返回 null）。
  if (s > 0 && masked[s - 1] === "{") {
    let h = s - 1;
    while (h > 0 && !";{}".includes(masked[h - 1])) h--;
    if (guardInBlock(masked.slice(h, s))) return "S2";
  }
  if (guardInBlock(masked.slice(s, idx))) return "S2";
  for (const [o, c] of anc) {
    const seg = masked.slice(o + 1, idx);
    // `const 本地旗标 = isTauriEnvironment()` 这种**定义**不算判定：S1 看的是整块，
    // 不过滤的话"同一块里声明过闸门变量"就会被当成"这块调用都被守卫了"（自测的「搬值不误判」当场抓到）。
    const cands = [...seg.matchAll(new RegExp(guardSrc(masked), "g"))]
      .filter((m) => !/=\s*$/.test(seg.slice(0, m.index)))
      .reverse();
    for (const m of cands) {
      const p = o + 1 + m.index;
      const before = masked.slice(o + 1, p);
      const relDepth = (before.match(/{/g) || []).length - (before.match(/}/g) || []).length;
      if (relDepth !== 0) continue;
      const end = stmtEnd(masked, p);
      if (end > idx) continue;
      if (!/\b(?:return|throw)\b/.test(masked.slice(p, end))) continue;
      return "S3";
    }
  }
  return null;
}

const endpoints = [];
for (const file of apiFiles) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  // 一个文件里可以有多个 `export const xxxApi = {`——符号归属必须跟着行走，
  // 否则第二个对象的方法会被挂到第一个对象名下（2026-10-09 实测 `discoverApi.dashboard`
  // 被误标成 `creatorApi.dashboard`，于是表里凭空多出一条重复端点）。
  let currentApi = null;
  let currentKey = null;
  for (const line of lines) {
    const objMatch = line.match(/export const (\w+Api)\s*=\s*\{/);
    if (objMatch) {
      currentApi = objMatch[1];
      currentKey = null;
      continue;
    }
    const keyMatch = line.match(METHOD_RE);
    if (keyMatch) currentKey = keyMatch[1];
    const call = line.match(CALL_RE);
    if (!call || !currentKey || !currentApi) continue;
    endpoints.push({
      symbol: `${currentApi}.${currentKey}`,
      verb: call[1].toUpperCase(),
      path: call[2],
      file: relative(root, file),
    });
    currentKey = null;
  }
}

/**
 * 消费者面以前整目录排除 `shared/api/`，于是**api 层内部的分派层看不见**：
 * `aiApi.proseToScript` 被报成「死面・零读者」，而它其实被 `shared/api/draftDispatch.ts` 用作云端 fallback
 * （那个文件是本地分派口：`isLocal: isTauriEnvironment` + 本地模型 + 规则保底 + `remote:` 走 aiApi）。
 * 现在只排除真正不算消费者的三类：定义该符号的文件自身、传输层 `client.ts`、再导出 barrel `index.ts`（测试已由 tsFiles 排掉）。
 */
const NON_CONSUMER_API = /shared\/api\/(?:client|index)\.ts$/;
const consumers = tsFiles(srcDir).filter(
  (f) => !NON_CONSUMER_API.test(relative(root, f)),
);
const consumerSrc = consumers.map((f) => ({ rel: relative(root, f), src: readFileSync(f, "utf8") }));
const productHitsAll = consumerSrc.filter((c) => !IMPL_RE.test(c.rel));

const rows = endpoints.map((e) => {
  const parts = e.symbol.split(".");
  const apiName = parts[0];
  const method = parts.slice(1).join(".");
  // 不带 g：这是一个跨多个文件复用的 .test()，g 会让 lastIndex 在命中后跟着对象走（实测今日读数两版全等，但形状上是漏计调用点的洞）
  const useRe = new RegExp(`\\b${apiName}\\s*\\.\\s*${method}\\s*\\(`);
  // 定义自身不算读者（`charactersApi.get` 出现在 `characters.ts` 里只是声明）
  const hits = consumerSrc.filter((c) => c.rel !== e.file && useRe.test(c.src));
  // 实现侧不算绕过面：`shared/storage/http*.ts` 引用 apiClient 是 Provider 的 fallback 实现本身
  const implHits = hits.filter((c) => IMPL_RE.test(c.rel));
  const productHits = hits.filter((c) => !IMPL_RE.test(c.rel));
  const withDispatch = productHits.filter((c) => DISPATCH_RE.test(c.src));
  /**
   * 「有没有分派口引用这个函数」是比「调用者 import 了什么」更硬的一条事实：
   * `charactersSaves.ts` 里出现 `characterApi.fork(` 说明这个域**已经有本地分支**、云端只是 fallback；
   * 一条都不出现，才是"桌面态真会打出去"的绕过面。分派口的定义沿用 `check:dispatch` 的命名约定，
   * 这样两道判据读的是同一个集合，不会各说各话。
   */
  const dispatchFiles = productHitsAll.filter((c) => DISPATCH_FILE_RE.test(c.rel));
  const referencedInDispatch = dispatchFiles.filter((c) => useRe.test(c.src));
  let tier;
  if (productHits.length === 0) tier = implHits.length ? "仅 HTTP 实现侧（界面无调用点）" : "死面";
  else if (referencedInDispatch.length > 0) tier = "已有分派口引用（云端是 fallback）";
  else if (withDispatch.length === productHits.length) tier = "调用者已接本地库";
  else if (withDispatch.length > 0) tier = "混合（部分调用者已接本地库）";
  else tier = "绕过（无分派口引用）";
  const uiHits = productHits.filter((c) => !DISPATCH_FILE_RE.test(c.rel));
  return {
    ...e,
    tier,
    callSites: productHits.length,
    implSites: implHits.length,
    dispatchRefs: referencedInDispatch.map((c) => c.rel),
    hitFiles: uiHits.map((c) => c.rel),
    hitSrc: uiHits,
    files: uiHits.map((h) => h.rel).slice(0, 4),
  };
});

if (!apiFiles.length || !rows.length) {
  console.log(
    `UNRELIABLE — api 目录文件 ${apiFiles.length} 个、解析出端点 ${rows.length} 个；` +
      "要么路径变了要么解析正则失效，这份表不能当结论用",
  );
  process.exitCode = 1;
} else {
  const byTier = new Map();
  for (const r of rows) byTier.set(r.tier, (byTier.get(r.tier) ?? 0) + 1);
  const order = ["死面", "仅 HTTP 实现侧（界面无调用点）", "绕过（无分派口引用）", "已有分派口引用（云端是 fallback）", "混合（部分调用者已接本地库）", "调用者已接本地库"];
  console.log(`云端端点定义总数=${rows.length}（api 文件 ${apiFiles.length} 个，消费者扫描 ${consumerSrc.length} 个文件）`);
  for (const t of order) console.log(`  ${t}=${byTier.get(t) ?? 0}`);
  console.log("");
  for (const t of order) {
    const list = rows.filter((r) => r.tier === t).sort((a, b) => a.symbol.localeCompare(b.symbol));
    if (!list.length) continue;
    console.log(`### ${t}（${list.length}）`);
    for (const r of list) {
      const tail = r.dispatchRefs.length ? "  分派口: " + r.dispatchRefs.join(", ") : "";
      console.log(
        "  " + r.verb + " " + r.path + "  ← " + r.symbol + "  界面调用点 " + r.callSites +
          "  " + r.files.join(", ") + tail,
      );
    }
    console.log("");
  }
  /**
   * 资源词元 → 本地表 / L4 契约方法：把 S13-3 需要的两侧事实并到同一屏。
   * 这是**词元匹配**（复数去尾 s 的朴素单数化），不是结论——匹配不到 ≠ 一定没有替身
   * （关系存在 `characters.character_data` 的 JSON 里就是典型例子），匹配到了也不代表语义一致。
   * 脚本刻意只报"依据"，把"判死还是本地化"留给人：让工具冒充判断，是这份表最容易坏掉的方式。
   */
  const ddlPath = join(root, "packages/editor-core/src/storage/sqlite/backend.ts");
  const ifPath = join(root, "packages/editor-core/src/storage/types.ts");
  const tables = existsSync(ddlPath)
    ? [...readFileSync(ddlPath, "utf8").matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/g)].map((m) => m[1])
    : [];
  const ifaceSrc = existsSync(ifPath) ? readFileSync(ifPath, "utf8") : "";
  const ifaceBody = ifaceSrc.slice(ifaceSrc.indexOf("export interface StorageProvider"));
  const contractMethods = [...ifaceBody.matchAll(/^ {2}([A-Za-z0-9_]+)\s*[(:]/gm)].map((m) => m[1]);
  console.log(`### 本地表 ${tables.length} 张 / L4 契约方法 ${contractMethods.length} 个（读不到就是 0，那说明路径变了，别信下面的匹配）`);
  /**
   * 把「绕过」档按"本地有没有承载"分成可勾选的三态。
   * 匹配用**表名/契约名的下划线词元全等**，不用 substring——上一版 `play` 会匹到
   * `player_achievements`（假阳性），而试玩会话根本没有表。词元全等后这条被修掉。
   * 三态的用处：`只差分派` 是本地化最便宜的一批（表和契约都在，缺的是把调用接进 `*Saves`）；
   * `无本地承载` 才需要真决定"判死还是新建"；`JSON 承载` 是关系那一族（读侧在 `character_data` 里、写侧没有）。
   */
  const tableTokens = new Set();
  for (const t of tables) for (const w of t.split("_")) tableTokens.add(w);
  const contractTokens = new Set();
  for (const m of contractMethods) {
    for (const w of m.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/)) {
      if (w) contractTokens.add(w);
    }
  }
  const forms = (seg) => [seg, seg.replace(/s$/, ""), seg.replace(/ies$/, "y")].filter(Boolean);
  const resSegs = (path) =>
    path.split("/").filter((s) => s && !s.startsWith("${") && s !== "v1" && !/[A-Z]/.test(s) && !/^\d/.test(s));
  const matchOf = (seg) => {
    const hitT = forms(seg).some((f) => tableTokens.has(f));
    const hitC = forms(seg).some((f) => contractTokens.has(f));
    return { hitT, hitC };
  };
  /**
   * 资源词元 → 承载的并排事实表。这一版和下面的三态分类**共用同一个 `matchOf`**：
   * 上一版这里还是 substring 包含（`x.includes(n)`）而三态已是词元全等，同一个脚本两个半边两套口径，
   * 读表的人无法知道哪一条是哪种匹配出来的——口径分叉本身就是误报源。
   */
  const ownerTables = (seg) =>
    tables.filter((x) => x.split("_").some((w) => forms(seg).includes(w)));
  const ownerMethods = (seg) =>
    contractMethods.filter((x) =>
      x.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/).some((w) => forms(seg).includes(w)),
    );
  for (const seg of [...new Set(rows.flatMap((r) => resSegs(r.path)))].sort()) {
    const { hitT, hitC } = matchOf(seg);
    console.log(
      "  " + seg.padEnd(14) + " 表:" + (hitT ? ownerTables(seg).join(",") : "无") +
        "   契约:" + (hitC ? ownerMethods(seg).join(",") : "无"),
    );
  }
  console.log("");
  /**
   * 三态里最关键的一笔：**父资源有表 ≠ 子资源有表**。
   * `/characters/{id}/versions/{vid}` 的 owner 是 characters（有表有契约），但"版本"这个子资源根本没有专属表；
   * 上一版只看"路径里有没有任何词元被承载"，于是把它误报成「只差分派」。现在按**命中的是不是最后一个资源词元**分开：
   *   own(末段命中) = 该资源自身有承载；parent(只有前段命中) = 子资源没有专属承载，别当成"只差接一下"。
   */
  const carriedBy = (path) => {
    const segs = resSegs(path);
    for (let i = segs.length - 1; i >= 0; i--) {
      const { hitT, hitC } = matchOf(segs[i]);
      if (!hitT && !hitC) continue;
      return {
        seg: segs[i],
        verdict: hitT && hitC ? (i === segs.length - 1 ? "该资源自身有承载（只差分派）" : "仅父资源有承载（子资源无专属表）") : "半承载（表或契约只一侧）",
      };
    }
    return null;
  };
  const bypass = rows.filter((r) => r.tier === "绕过（无分派口引用）");
  const groups = new Map();
  for (const r of bypass) {
    const c = carriedBy(r.path);
    // 可机械判的可达性提示：调用者全在 features/discover/ 下 ⇒ 桌面结构性无该入口（桌面首屏是 /studio/projects）
    // 用 hitFiles 而不是展示用的 files（后者截到 4 个，超过 4 个调用点时会把可达性判反）
    const onlyDiscover =
      r.hitFiles.length > 0 && r.hitFiles.every((f) => f.includes("/features/discover/"));
    const key = (c ? c.verdict : "无本地承载") + (onlyDiscover ? " · 调用者仅 Discover（桌面不可达）" : "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ r, c });
  }
  console.log(`### 「绕过」${bypass.length} 条按本地承载 + 可达性归类（词元全等；末段命中才算"自身承载"）`);
  for (const [k, list] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}=${list.length}`);
    for (const { r, c } of list) {
      console.log(`    ${r.verb} ${r.path}  ← ${r.symbol}  命中词元:${c ? c.seg : "-"}  ${r.files.join(", ")}`);
    }
  }
  console.log("");
  /**
   * 壳守卫按**调用点**算，不按文件算（文件级会把"五条查询里只有一条带 enabled"读成"五条都安全"）。
   * 顺带一个控制位：分档匹配跑在**遮蔽注释与字符串之后**的文本上，而上面六档的匹配跑在原文上——
   * 两边对不上的行 = 那个"界面调用点"只活在注释里。不静默吞掉，单独点名。
   */
  const cache = new Map();
  const maskedOf = (rel) => {
    if (!cache.has(rel)) {
      const m = maskNonCode(readFileSync(join(root, rel), "utf8"));
      cache.set(rel, [m, blockPairs(m)]);
    }
    return cache.get(rel);
  };
  const shapeCount = { S1: 0, S2: 0, S3: 0 };
  const guardRows = [];
  const suspect = [];
  // 扫描面 = 绕过 + 混合：只扫绕过会让 S2（`if (guard) api.x()`）这一形状**永远拿不到样本**，
  // 一条从没被行使过的判据分支等于一条没验过的判据；混合面里恰好有它（PlayerPage 的 recordView）。
  const scanRows = rows.filter(
    (r) => r.tier === "绕过（无分派口引用）" || r.tier === "混合（部分调用者已接本地库）",
  );
  for (const r of scanRows) {
    const sites = [];
    for (const h of r.hitSrc) {
      const [m, pairs] = maskedOf(h.rel);
      const [apiName, ...rest] = r.symbol.split(".");
      const re = new RegExp("\\b" + apiName + "\\s*\\.\\s*" + rest.join("\\.") + "\\s*\\(", "g");
      const fileHasGuard = new RegExp(guardSrc(m)).test(m);
      for (const mm of m.matchAll(re)) {
        const sh = guardShape(m, pairs, mm.index);
        if (sh) shapeCount[sh]++;
        sites.push({ at: h.rel + ":" + lineOf(m, mm.index), sh });
        if (fileHasGuard && !sh) suspect.push(`${r.symbol} @ ${h.rel}:${lineOf(m, mm.index)}`);
      }
    }
    guardRows.push({ r, sites, guarded: sites.filter((s) => s.sh).length, total: sites.length });
  }
  // 人工复核线索：调用点文件里**有**守卫，而这一条调用点没判成被守卫——
  // 可能是判据漏了形状（要复查），也可能那条守卫属于隔壁的查询（正当，VersionPanel 就是这种）。
  const guardedSites = shapeCount.S1 + shapeCount.S2 + shapeCount.S3;
  const siteTotal = guardRows.reduce((a, g) => a + g.total, 0);
  const allG = guardRows.filter((g) => g.total > 0 && g.guarded === g.total).length;
  const partG = guardRows.filter((g) => g.guarded > 0 && g.guarded < g.total).length;
  const noneG = guardRows.filter((g) => g.guarded === 0).length;
  const ghostRows = guardRows.filter((g) => g.total === 0 && g.r.callSites > 0);
  console.log(
    `### 「绕过 + 混合」${scanRows.length} 条（绕过 ${bypass.length} / 混合 ${scanRows.length - bypass.length}）按调用点的壳守卫分档（S1 同块 / S2 同句 / S3 早退；查不到守卫 = 桌面态真会打出去）\n` +
      `  调用点 ${siteTotal} 处：有守卫 ${guardedSites}（S1=${shapeCount.S1} S2=${shapeCount.S2} S3=${shapeCount.S3}）` +
      ` / 无守卫 ${siteTotal - guardedSites}\n` +
      `  端点级 ${scanRows.length} 条：调用点全有守卫=${allG} / 部分=${partG} / 全无=${noneG}` +
      `（相加 ${allG + partG + noneG}，不等于 ${scanRows.length} 就是有行的调用点一个都没定位到）\n` +
      `  只活在注释里的行（原文算成调用点、遮蔽后 0 处）=${ghostRows.length}` +
      (ghostRows.length ? "：" + ghostRows.map((g) => g.r.symbol).join(", ") : "") +
      // 人工复核线索：调用点文件里有守卫、而这一条调用点没判成被守卫。
      // 可能是判据漏形状（要复查），也可能是那条守卫属于隔壁的查询（正当——VersionPanel 的 `enabled:` 只管 list）。
      `\n  待人工复核（文件有守卫但该调用点未判出）=${new Set(suspect).size}：` + [...new Set(suspect)].join(", "),
  );
  /** 守卫判据的内建自测（合成样本，正反各两条）；不过就把这一档标成不可信并退出码 1 */
  const gst = guardSelfTest();
  console.log(
    `  守卫形状自测（别名闸门）：` +
      Object.entries(gst.res).map(([k, v]) => `${k}=${v ? "通过" : "**失败**"}`).join("、") +
      ` ⇒ ${gst.ok ? "判据可信" : "**判据不可信：别名这条放宽要么藏缺陷、要么把真闸门漏判成待复核**"}`,
  );
  if (!gst.ok) process.exitCode = 1;
  for (const g of guardRows.filter((x) => x.total > 0 && x.guarded < x.total).sort((a, b) => b.total - b.guarded - (a.total - a.guarded))) {
    const un = g.sites.filter((s) => !s.sh).map((s) => s.at);
    const tag = g.r.tier.startsWith("混合") ? "[混合] " : "";
    console.log(`    ${tag}守 ${g.guarded}/${g.total}  ${g.r.verb} ${g.r.path}  ← ${g.r.symbol}  未守卫调用点: ${un.join(", ")}`);
  }
  console.log(
    "  已判成有守卫的调用点（逐条可回代码核）：" +
      guardRows
        .flatMap((g) => g.sites.filter((s) => s.sh).map((s) => `${g.r.symbol}@${s.at}(${s.sh})`))
        .join(", "),
  );
  if (guardedSites === 0) {
    console.log(
      "UNRELIABLE —— 一处守卫都没判出来。这份语料里 `enabled: !isLocalOnlyDeployment()` 至少出现四次，" +
        "所以这是判据没跑通，不是代码变干净了。",
    );
    process.exitCode = 1;
  }
  /**
   * 死面 = api 层定义了、界面里一个调用点都没有。判死之前按在册纪律数**活读者**（界面读者与机制读者分开数），
   * 并把后端路由那一侧的事实并到同一屏：**前端能摘 ≠ 端点会消失**（端点的归宿在 S13-6）。
   * 读者匹配跑在遮蔽注释之后的文本上（注释里提一句不算读者），范围是 apps/ + packages/ + e2e/ + scripts/，
   * 排除 `shared/api` 自身（定义处不算读者）。
   */
  const deadRows = rows.filter((r) => r.tier === "死面");
  const readerPool = ["apps", "packages", "e2e", "scripts"]
    .flatMap((d) => walk(join(root, d), [".ts", ".tsx", ".mjs", ".cjs", ".js"]))
    .map((f) => relative(root, f))
    .filter((rel) => !NON_CONSUMER_API.test(rel));
  const poolCache = new Map();
  const poolOf = (rel) => {
    if (!poolCache.has(rel)) poolCache.set(rel, maskNonCode(readFileSync(join(root, rel), "utf8")));
    return poolCache.get(rel);
  };
  const readersOf = (symbol, ownFile) => {
    const [apiName, ...rest] = symbol.split(".");
    const re = new RegExp("\\b" + apiName + "\\s*\\.\\s*" + rest.join("\\.") + "\\s*\\(");
    const hits = readerPool.filter((rel) => rel !== ownFile && re.test(poolOf(rel)));
    return { n: hits.length, test: hits.filter((x) => /\.test\.|^e2e\//.test(x)).length, files: hits };
  };
  const normSeg = (p) => {
    const s = p.split("?")[0].split("/").filter(Boolean).map((x) => (/^\$\{|^\{/.test(x) ? "*" : x));
    return s[0] === "api" && s[1] === "v1" ? s.slice(2) : s;
  };
  const pyPool = walk(join(root, "backend/app"), [".py"]);
  const routes = [];
  for (const f of pyPool) {
    const s = readFileSync(f, "utf8");
    const pref = new Map();
    for (const m of s.matchAll(/(\w+)\s*=\s*APIRouter\(\s*prefix="([^"]*)"/g)) pref.set(m[1], m[2]);
    for (const m of s.matchAll(/@(\w+)\.(get|post|put|delete|patch)\(\s*"([^"]*)"/g)) {
      routes.push({ verb: m[2].toUpperCase(), segs: normSeg((pref.get(m[1]) ?? "") + m[3]) });
    }
  }
  const routeIn = (verb, path) => routes.some((r) => r.verb === verb && r.segs.join("/") === normSeg(path).join("/"));
  const ctrl = rows
    .filter((r) => r.tier === "调用者已接本地库" || r.tier === "已有分派口引用（云端是 fallback）")
    .slice(0, 3)
    .map((r) => r.symbol + " 读者=" + readersOf(r.symbol, r.file).n);
  const testFilesTouchingApi = readerPool.filter(
    (rel) => /\.test\.|^e2e\//.test(rel) && /\b\w+Api\s*\.\s*\w+\s*\(/.test(poolOf(rel)),
  );
  console.log(
    `### 死面 ${deadRows.length} 条：前端读者 × 后端路由（判死候选的两侧证据）\n` +
      `  读者面=${readerPool.length} 个文件；后端 .py=${pyPool.length} 个、解析出路由 ${routes.length} 条\n` +
      `  正对照（这几条按定义不该零读者）：${ctrl.join(" / ")}\n` +
      `  「测试」列的结构性前提：调用过任何 \`xxxApi.method(\` 的测试/e2e 文件数=${testFilesTouchingApi.length}` +
      (testFilesTouchingApi.length ? "（" + testFilesTouchingApi.join(", ") + "）" : " ⇒ 下面那一列恒 0 是**测试层不 import api 层**这个事实，不是判据坏了"),
  );
  if (!routes.length || !readerPool.length) {
    console.log("UNRELIABLE —— 后端路由或读者面解析出 0，这一段的两侧证据都不成立");
    process.exitCode = 1;
  }
  for (const r of [...deadRows].sort((a, b) => a.symbol.localeCompare(b.symbol))) {
    const rd = readersOf(r.symbol, r.file);
    console.log(
      `    ${r.verb} ${r.path}  ← ${r.symbol}  前端读者=${rd.n}（测试 ${rd.test}）  ` +
        `后端路由=${routeIn(r.verb, r.path) ? "在" : "不在"}` +
        (rd.n ? "  读者: " + rd.files.join(", ") : ""),
    );
  }
  /**
   * 宿主级可达性：桌面到底走不走得到这一条调用点。
   * 上一段只算到"调用点文件自己有没有守卫"，但**保护常常写在宿主文件里**——
   * 实测 `AppHeader.tsx:69` 用 `{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}` 挡掉整个搜索框，
   * 而 `GlobalSearch.tsx` 自己一行守卫都没有。这一段量的是"模块图 + 宿主页早退"，
   * **消费者级的条件渲染不认**（方向上是保守的：宁可多列一条候选，不漏一条真缺陷）。
   */
  const appRel = "apps/web/src/app/App.tsx";
  const appSrc = codeSrc(appRel);
  const lazyMod = new Map();
  for (const { name, spec } of lazyImports(appSrc)) {
    const mod = name ? resolveSpec(appRel, spec) : null;
    if (mod) lazyMod.set(name, mod);
  }
  /**
   * 静态 import 进来的布局/页面同样是路由元素（实测 `PlayerLayout` 不是 lazy，
   * 上一版只认 lazy ⇒ `/play/:projectId` 整棵子树看不见，`usePlayer.ts` 被误判成"界面走不到"）。
   */
  for (const m of appSrc.matchAll(/import\s+(\w+)\s+from\s*["']([^"']+)["']/g)) {
    const mod = resolveSpec(appRel, m[2]);
    if (mod && !lazyMod.has(m[1])) lazyMod.set(m[1], mod);
  }
  /**
   * 路由表读 `parseRoutes`（`source-graph.mjs`），不在这里再抄一遍正则。
   * 本仓刚为此付过一次钱：旧正则被 `element={<StudioLayout />}` 里那个 `/>` 提前截断，
   * 把带子路由的父 Route 当成自闭合，于是整棵 `/studio/**` 丢掉前缀——
   * 键变成 `projects/:id` 而不是 `/studio/projects/:id`，宿主列出来的"页"根本不是一个能打开的 URL。
   * 同一份解析现在也被加载面普查（`desktop-http-inventory.mjs`）用，两边不会对不上。
   *
   * 值是一个**集合**不是单个模块：`<Route path="/play/:projectId" element={<PlayerLayout/>}>`
   * 和它里面的 `<Route index element={<PlayerPage/>} />` 展开成同一个绝对路径。
   * 先到先得只留布局的话，PlayerPage 的闭包就整个消失 ⇒ 把活代码标成"界面走不到"，
   * 那是最坏的方向（给可删标签骗人）。
   */
  const routeMods = new Map();
  const parsedRoutes = parseRoutes(appSrc);
  const routeCount = parsedRoutes.length;
  const elementCount = parsedRoutes.filter((r) => r.element).length;
  for (const r of parsedRoutes) {
    const mod = r.element ? lazyMod.get(r.element) : undefined;
    if (!mod) continue;
    if (!routeMods.has(r.label)) routeMods.set(r.label, new Set());
    routeMods.get(r.label).add(mod);
  }
  /** 在册"零挂载页面"的机器版：lazy 了但没有任何 `<Route element={<它/>}` —— PromptExport 那一族的形状 */
  const renderedElements = new Set(parsedRoutes.map((r) => r.element).filter(Boolean));
  const orphanPages = [...lazyMod.entries()]
    .filter(([name]) => !renderedElements.has(name))
    .map(([name, mod]) => `${name}（${mod}）`);
  const closures = [...routeMods.entries()].map(([path, mods]) => [
    path,
    [...mods].reduce((acc, m) => {
      for (const f of closureOf([m])) acc.add(f);
      return acc;
    }, new Set()),
  ]);
  const hostsOf = (rel) => closures.filter(([, set]) => set.has(rel)).map(([p]) => p);
  /**
   * 宿主页"桌面早退"的判据要卡在**组件体的直接子语句**上，而不是"这个文件里出现过守卫"：
   * 实测 `PlayerPage.tsx` 的 `if (!isTauriEnvironment()) projectApi.recordView(...)` 写在 `load` 回调里面（深度 1），
   * 它只保护那一行，绝不构成"整页在桌面不渲染"。上一版用一条宽松正则，会把这种页面整个算成"早退页"——
   * 那是**过度信任的方向**（把真缺陷藏起来），比漏判更危险。
   *
   * 纯函数版收在这里，是为了能被**自测**直接调用（`earlyReturnFrom`）：
   * 上一版只有 `(mod)` 那个包装，读的是磁盘文件，于是这条判据从来没有一条合成样本压着——
   * 结果连错两次都没人发现（别名式漏判见下；还有 `DiscoverProjectDetailPage` 那种"函数体取错"的漏判）。
   */
  const earlyReturnFrom = (c) => {
    const fnIdx = c.search(/export\s+default\s+(?:function\s+)?[A-Z]/);
    if (fnIdx < 0) return false;
    /**
     * 函数体不能取"`export default` 之后第一个**块对**"：实测 `DiscoverProjectDetailPage.tsx` 第二行是
     * `const { id = "" } = useParams<{ id: string }>();`，解构与泛型里的 `{}` 会先成一对，
     * 于是"函数体"退化成第 24 行那一个单行块，扫描窗口里一行守卫都没有 ⇒ 整页早退被漏判。
     * 改成"第一个 `{` 起、按深度配平找它的闭合"，与文件里有多少内层块无关。
     */
    const open = c.indexOf("{", fnIdx);
    if (open < 0) return false;
    let depth = 0;
    let close = -1;
    for (let i = open; i < c.length; i++) {
      if (c[i] === "{") depth++;
      else if (c[i] === "}" && --depth === 0) {
        close = i;
        break;
      }
    }
    if (close < 0) return false;
    const body = [open, close];
    for (const m of c.slice(body[0] + 1, body[1]).matchAll(new RegExp(guardSrc(c), "g"))) {
      const p = body[0] + 1 + m.index;
      const before = c.slice(body[0] + 1, p);
      if ((before.match(/{/g) || []).length - (before.match(/}/g) || []).length !== 0) continue;
      /**
       * 两种形状都要认：直接式 `if (isLocalOnlyDeployment())` 的匹配从**调用本身**开始，
       * `if (` 落在匹配之前；别名式 `if (localOnly)` 的匹配把 `if (` 一起**吃进匹配串**（见 `ALIAS_USE`），
       * 所以只看"前面 24 字符"会把别名式全部漏掉——实测五个 discover 详情页的整页早退都因此没被认出来，
       * 「桌面真会打出」那个保守上界跟着虚高（§6 的判死名单正拿它当分母）。
       */
      const selfIf = /^if\s*\(/.test(m[0]);
      const prefixIf = /if\s*\(\s*!?\s*$/.test(c.slice(Math.max(0, p - 24), p));
      if (!selfIf && !prefixIf) continue;
      // 判定范围取"这条 if 自己的那个块"，而不是 stmtEnd：别名式的 p 落在 `if (` 上，块尾才含 return
      const block = blockPairs(c).filter(([o]) => o >= p).sort((a, b) => a[0] - b[0])[0];
      const spanEnd = block ? block[1] : stmtEnd(c, p);
      if (!/\b(?:return|throw)\b/.test(c.slice(p, spanEnd))) continue;
      return true;
    }
    return false;
  };
  const earlyReturn = (mod) => earlyReturnFrom(maskedSrc(mod));
  /**
   * `earlyReturn` 的内建自测（2026-10-09 补）。**这条判据此前一条合成样本都没有**，
   * 所以它连着漏判两次都没人发现：别名式 `if (localOnly)` 整类漏判、
   * 以及"函数体取成解构那一行"（`DiscoverProjectDetailPage.tsx` 实测）造成的漏判。
   * 四条成对：两种真早退形状要判出，两种"看着像守卫但其实没挡住整页"的形状不许判出——
   * 只测正例会把判据放宽成"藏缺陷"（那是这个工具最危险的方向）。
   */
  const ER_SAMPLES = [
    {
      name: "解构在前 + 别名式早退（DiscoverProjectDetailPage 的形状）",
      want: true,
      src: `export default function P() {
  const { id = "" } = useParams();
  const localOnly = isLocalOnlyDeployment();
  if (localOnly) { return 0; }
  q(() => { api.x(); });
}`,
    },
    {
      name: "直接式早退",
      want: true,
      src: `export default function P() {
  const { a } = u();
  if (isLocalOnlyDeployment()) { return 0; }
  q(() => { api.x(); });
}`,
    },
    {
      name: "守卫只包一行、在回调里（PlayerPage 那种深度 1）⇒ 不许判整页早退",
      want: false,
      src: `export default function P() {
  const { a } = u();
  const load = async () => {
    if (!isLocalOnlyDeployment()) { api.x(); }
  };
  return 0;
}`,
    },
    {
      name: "别名只出现在依赖数组里 ⇒ 不算守卫",
      want: false,
      src: `export default function P() {
  const localOnly = isLocalOnlyDeployment();
  useEffect(() => { api.x(); }, [id, localOnly]);
  return 0;
}`,
    },
    {
      name: "同一行里有 URL 正则（`\\/\\/`）+ 别名式早退（DiscoverProjectDetailPage 实测形状）",
      want: true,
      src: `export default function P() {
  const u = a.replace(/^https?:\\/\\//, "");
  const { id = "" } = useParams();
  const localOnly = isLocalOnlyDeployment();
  if (localOnly) { return 0; }
  q(() => { api.x(); });
}`,
    },
  ];
  const erGot = ER_SAMPLES.map((s) => earlyReturnFrom(maskNonCode(s.src)));
  if (erGot.some((v, i) => v !== ER_SAMPLES[i].want)) {
    console.log(
      "UNRELIABLE —— earlyReturn 的合成样本判错：" +
        ER_SAMPLES.map((s, i) => `${s.name}：期望 ${s.want}，实得 ${erGot[i]}`).join("；"),
    );
    process.exitCode = 1;
  }
  const hostOfSite = (rel) => {
    if (neverRendered(rel)) return { kind: "模块的任何导出除 import 语句外全仓无引用点 ⇒ 零引用，界面走不到", hosts: hostsOf(rel) };
    const hosts = hostsOf(rel);
    if (!hosts.length) return { kind: "不在任何路由页的 import 闭包里 ⇒ 界面确定走不到", hosts };
    const live = hosts.filter((h) => [...routeMods.get(h)].some((m) => !earlyReturn(m)));
    return live.length
      ? { kind: "宿主不早退 ⇒ 桌面真会打出（保守上界：import 可达≠渲染可达）", hosts: live }
      : { kind: "只在桌面会早退的宿主页里（弱信号，要人工确认早退覆盖这条路径）", hosts };
  };
  /**
   * 叶子级"死组件"判据：import 图会把"被 import 却从没渲染"的面板算成可达（实测 PromptExport 就落在
   * `characters/mine` 等三条路由的闭包里，而全仓没有一处 `<PromptExport`）。
   * 所以补这一条：PascalCase 的组件文件，若全仓代码里没有任何 `<Name` 的 JSX 使用点 ⇒ 桌面走不到它。
   * hooks / lib（小写开头）不适用这一条——它们的使用点就是函数调用，本来就在 import 闭包里。
   */
  /**
   * "被引用"要认三种真实形状（第一版只认 `<名字>`，把三条活代码误判成零挂载——那是**最坏的方向**：
   * 给活代码贴上"可删"的标签）：
   *   ① 直接渲染 `<Name>`；② 注册表值 `component: Name` / `axis: Name`；
   *   ③ 改名懒加载 `const LazyX = lazy(() => import("…X"))` 后渲染 `<LazyX>`——这里原名字根本不出现，
   *      所以"是某文件 lazy() 的目标"本身就算被引用。
   * 名字必须出现在 **import/export 语句之外**才算引用（否则一个 barrel 的再导出就当"有人用了"）。
   */
  /**
   * import / 再导出语句的区间（这些位置里出现的名字**不算引用**，否则 barrel 的再导出会被当成"有人用了"）。
   * 用整条语句的正则而不是"从关键字往后扫 900 字符"：后者会把 `export default function App() {` 当成语句、
   * 把下面 900 字符里的 JSX 一起抹掉——实测就这么吞掉了 App.tsx:95 的 `<StudioLayout />`，把活代码判成零挂载。
   */
  const importRanges = (text) => [
    ...[...text.matchAll(/^[ \t]*(?:import|export)[\s\S]{0,400}?\bfrom\s*["'][^"']+["']\s*;?[ \t]*$/gm)]
      .map((m) => [m.index, m.index + m[0].length]),
    ...[...text.matchAll(/^[ \t]*import\s*["'][^"']+["'];?[ \t]*$/gm)].map((m) => [m.index, m.index + m[0].length]),
  ];
  const usedOutsideImports = (text, name, ranges) =>
    [...text.matchAll(new RegExp(`\\b${name}\\b`, "g"))].some((m) => !ranges.some(([s, e]) => m.index >= s && m.index < e));
  const lazyTargets = new Map();
  for (const rel of allPool) {
    for (const { spec } of lazyImports(codeSrc(rel))) {
      const mod = resolveSpec(rel, spec);
      if (mod) (lazyTargets.get(mod) || lazyTargets.set(mod, []).get(mod)).push(rel);
    }
  }
  /**
   * 候选名字 = **全部导出符号**，不只是默认导出：
   * `shared/layouts/PublicLayout.tsx` 只被 `import { DiscoverLayout, AccountLayout }` 用（默认导出没人碰），
   * 只查默认导出会给一个**活模块**贴"零挂载"标签——那正是最坏的方向。
   */
  const exportNames = (rel) => {
    const c = codeSrc(rel);
    const names = [
      ...[...c.matchAll(/export\s+default\s+(?:function|class)\s+(\w+)/g)].map((m) => m[1]),
      ...[...c.matchAll(/export\s+default\s+([A-Za-z]\w*)\s*;/g)].map((m) => m[1]),
      ...[...c.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)].map((m) => m[1]),
      ...[...c.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) =>
        m[1].split(",").map((part) => {
          const as = part.trim().split(/\s+as\s+/);
          return (as[1] || as[0] || "").trim();
        }),
      ),
    ];
    return [...new Set(names)].filter((n) => n && /^[A-Za-z_$][\w$]*$/.test(n));
  };
  const referencedElsewhere = (rel) => {
    const names = exportNames(rel);
    if (!names.length) return true;
    if (lazyTargets.has(rel)) return true;
    for (const g of allPool) {
      if (g === rel) continue;
      const t = codeSrc(g);
      const ranges = importRanges(t);
      if (names.some((n) => usedOutsideImports(t, n, ranges))) return true;
    }
    return false;
  };
  const neverRendered = (rel) => exportNames(rel).length > 0 && !referencedElsewhere(rel);
  const unguardedSites = guardRows
    .filter((g) => g.total > 0 && g.guarded < g.total)
    .flatMap((g) => g.sites.filter((s) => !s.sh).map((s) => ({ symbol: g.r.symbol, at: s.at })));
  const byKind = new Map();
  for (const s of unguardedSites) {
    const rel = s.at.split(":")[0];
    const k = hostOfSite(rel).kind;
    byKind.set(k, (byKind.get(k) ?? 0) + 1);
  }
  /** 计数与清单共用同一个谓词，否则"报 3 条、列 4 个"这种自相矛盾就是白送的 */
  const earlyHosts = [...routeMods.entries()].filter(([, ms]) => [...ms].every((m) => earlyReturn(m)));
  console.log(
    `### 未被守卫的 ${unguardedSites.length} 处调用点 × 宿主可达性（\`<Route\` ${routeCount} 处 / 带 element ${elementCount} 处 / 解析到模块 ${routeMods.size} 条 / lazy 模块 ${lazyMod.size} 个）\n` +
      [...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${k}=${n}`).join("\n") +
      `\n  未被任何路由引用的 lazy/静态页面=${orphanPages.length}：${orphanPages.join(", ") || "无"}` +
      `\n  判成"桌面早退"的路由页=${earlyHosts.length}：` +
      earlyHosts.map(([p, ms]) => `${p}(${[...ms].map((m) => basename(m)).join("+")})`).join(", ") +
      `\n  正对照：ProjectListPage ⇒ ${hostOfSite("apps/web/src/features/studio/pages/ProjectListPage.tsx").kind}（在册可达，不该判成走不到）` +
      ` / PromptExport ⇒ ${hostOfSite("apps/web/src/features/character/components/PromptExport.tsx").kind}（在册零挂载 #60）` +
      ` / 二者宿主列表=${JSON.stringify(hostOfSite("apps/web/src/features/character/components/PromptExport.tsx").hosts)}`,
  );
  if (!routeMods.size || !elementCount) {
    console.log("UNRELIABLE —— 一条路由模块都没解析出来（App.tsx 的形状变了？），闭包判据不成立");
    process.exitCode = 1;
  }
  const detail = new Map();
  const perRowKinds = [];
  for (const g of guardRows) {
    const kinds = g.sites.filter((s) => !s.sh).map((s) => hostOfSite(s.at.split(":")[0]).kind);
    if (g.total > 0 && g.guarded < g.total) perRowKinds.push({ g, kinds });
  }
  const allUnreachable = perRowKinds.filter((r) => r.kinds.every((k) => k.includes("走不到")));
  const someLive = perRowKinds.filter((r) => r.kinds.some((k) => !k.includes("走不到")));
  console.log(
    `  端点级 ${perRowKinds.length} 条（有未守卫调用点的）：所有未守卫点都桌面走不到=${allUnreachable.length}` +
      ` / 至少一处走得到=${someLive.length}（相加 ${allUnreachable.length + someLive.length}）` +
      `\n  走不到的这些：${allUnreachable.map((r) => r.g.r.symbol).join(", ") || "无"}`,
  );
  for (const s of unguardedSites) {
    const rel = s.at.split(":")[0];
    const h = hostOfSite(rel);
    /**
     * 「要人工确认早退覆盖这条路径」这句以前没法执行——它不说是**哪条路由页**在驱动这个档。
     * 宿主页名直接进这一行（`不早退` 那一档存的就是驱动它的那几条；其余档存全部宿主），超过 6 条截断。
     */
    const hostList = h.hosts ?? [];
    const hostNote = hostList.length
      ? "  宿主[" + hostList.slice(0, 6).join(", ") + (hostList.length > 6 ? ` …+${hostList.length - 6}` : "") + "]"
      : "";
    const k = h.kind + " ← " + rel + hostNote;
    detail.set(k, (detail.get(k) ?? []).concat(s.symbol));
  }
  for (const [k, syms] of [...detail.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}  ${[...new Set(syms)].join(", ")}`);
  }
  /**
   * 第十二段（2026-10-09）：把「桌面真会打出」那批**未守卫调用点**再切一刀 —— 装载即发 vs 点了才发。
   *
   * 为什么要切：`check:http-inventory` 的桌面臂量的是「进入页面那一刻」发出去的请求，
   * 所以它报 `DESKTOP_UNIQUE=0` 只证到**装载面**干净；凡是只在事件处理器里发的调用，这条判据**结构上看不见**。
   * 两类收口的方式根本不同：
   *   - 装载即发：现在靠**页面级闸门**挡着（`isLocalOnlyDeployment()` 早退那种），
   *     闸门被绕开（新增入口、去掉早退、布局改动）就立刻漏 —— 这类才是 S13-3 判死的硬分母；
   *   - 点了才发：只能逐条写点击判据（E19/E40/E41 那种形状）或整体判死，装载普查帮不上忙。
   *
   * 静态判据是**就近胜出**的启发式（调用点之前最近的装载家族 vs 交互家族），
   * 两边都不沾就落「不明」——**不明一律不计入"已被装载判据覆盖"**，宁可少认。
   * 运行时那一列从普查自己写的输出取（`LOADFACE=<普查输出文件> pnpm cloud:callmap`）：
   * 端点路径里的 `${id}` 换成 `[^/]+` 再与实测路径对齐；**没给文件就明说缺这一列，不当 0 用**。
   */
  const LOAD_RE = /useEffect\s*\(|useQuery\s*\(|queryFn\s*:|useMutation\s*\(|\.refetch\s*\(|\bload\s*=\s*(?:async\s*)?\(/g;
  const ACTION_RE = /\bon[A-Z]\w*\s*=\s*[{(]|(?:const|function)\s+(?:handle[A-Z]\w*|on[A-Z]\w*)\s*=?\s*(?:async\s*)?\(/g;
  const lineStart = (text, line) => {
    let i = 0, n = 1;
    while (n < line && i < text.length) {
      if (text[i] === "\n") n++;
      i++;
    }
    return i;
  };
  const lastHit = (re, text, before) => {
    re.lastIndex = 0;
    let last = -1;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (m.index >= before) break;
      last = m.index;
    }
    return last;
  };
  const liveSites = unguardedSites
    .map((s) => ({ symbol: s.symbol, rel: s.at.split(":")[0], line: Number(s.at.split(":")[1]) || 1 }))
    .filter((s) => !hostOfSite(s.rel).kind.includes("走不到"));
  const loadFace = process.env.LOADFACE ? readFileSync(process.env.LOADFACE, "utf8") : null;
  const observed = loadFace
    ? [...loadFace.matchAll(/^\s+浏览器态：\/api\/v1\/(\S+)$/gm)].map((m) => m[1])
    : [];
  const normP = (p) => (p.startsWith("/") ? p : "/" + p);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /**
   * 静态端点路径 → 匹实测 pathname 的正则。**两个方向都错过**，所以这里同时钉两头：
   *   - 先转义再抠 `${id}` 是错的：转义把 `$ { }` 变成 `\$\{id\}`，之后按未转义形状去换**一条都换不掉**，
   *     于是所有带参数的端点在运行时列里都成"没见过"——上一版 B=18 就是这么造出来的假数。
   *   - 用 `[^/]*` 当参数占位又太宽：`/editor/projects/${id}` 会把真端点 `/editor/projects/discover` 也认下，
   *     连"把带参数路径从产物里拿掉"的变异都挡不住（实测如此）。
   * 现在按 `${...}` 切段、**只转义字面段**、用 `[^/]+`（不跨段）接回；
   * 末段是插值时再多给一条"缺席"的模式——普查记的是 `URL.pathname`，`${qs}` 这种查询串根本不在里面。
   * 口径两边统一成带前导斜杠（静态表带，普查打的路径剥掉了 `/api/v1`）。
   * **这一列是上界**：模板与端点之间天然存在包含关系，只能当线索，不能当"确实发过"的证据。
   */
  const epPatterns = (epPath) => {
    const bare = normP(epPath).split("?")[0].split("#")[0];
    const lit = bare.split(/\$\{[^}]*\}/).map(esc);
    const pats = ["^" + lit.join("[^/]+") + "$"];
    if (bare.endsWith("}")) pats.push("^" + lit.slice(0, -1).join("[^/]+") + "$");
    return pats.map((s) => new RegExp(s));
  };
  const one = (ep, p) => epPatterns(ep).some((re) => re.test(normP(p)));
  const pathSeen = (epPath) => observed.some((p) => one(epPath, p));
  /** 内建自测：不依赖当天数据，专挡"量法坏了伪装成结论" */
  const selfTest = {
    模板吃到参数: one("/editor/projects/${id}", "/editor/projects/probe-1"),
    参数不跨段: !one("/editor/projects/${id}", "/editor/projects/probe/extra"),
    末段查询可缺席: one("/editor/projects/${id}/view${qs}", "/editor/projects/probe-1/view"),
    不把别的端点认进来: !one("/editor/projects/${id}", "/editor/projects/discover/x"),
    无参模板要全等: !one("/users/session", "/users/sessions"),
  };
  const selfOk = Object.values(selfTest).every(Boolean);
  const byFire = new Map();
  for (const s of liveSites) {
    const text = codeSrc(s.rel);
    const ls = lineStart(text, s.line);
    // 搜到"这一行末尾"而不是行首：`onClick={() => api.x()}` 的扳机与调用在同一行，切在行首会整条判成不明
    const at = text.indexOf("\n", ls) === -1 ? text.length : text.indexOf("\n", ls);
    const l = lastHit(LOAD_RE, text, at);
    const a = lastHit(ACTION_RE, text, at);
    const kind = a === l ? "不明" : a > l ? "点了才发" : "装载即发";
    (byFire.get(kind) || byFire.set(kind, []).get(kind)).push(s);
  }
  const epOfSymbol = new Map();
  for (const r of rows) (epOfSymbol.get(r.symbol) || epOfSymbol.set(r.symbol, []).get(r.symbol)).push(r);
  const epsFor = (sym) => (epOfSymbol.get(sym) || []).map((r) => r.path);
  const liveEps = [...new Set(liveSites.flatMap((s) => epsFor(s.symbol)))];
  const loadEps = [...new Set((byFire.get("装载即发") ?? []).flatMap((s) => epsFor(s.symbol)))];
  const otherEps = liveEps.filter((p) => !loadEps.includes(p));
  const seenLoad = loadEps.filter((p) => pathSeen(p));
  const notSeenLoad = loadEps.filter((p) => !pathSeen(p));
  /**
   * 第二道对照（上一版只挡了"一条都没对上"，被自己绕过去了）：按**路径里有没有 `${参数}`** 拆开看。
   * 带参数的端点**全军覆没**而无参数的都对上，那不是"运行时没发"，是 **`${...}` 的转换失效**——
   * 量法坏了会伪装成结论，而且专挑最需要看的那几条（带参数的）下手。
   */
  const paramEps = loadEps.filter((p) => p.includes("${"));
  const paramSeen = paramEps.filter((p) => pathSeen(p));
  /**
   * 「静态说装载会发、普查没见到」那 18 条**在这里就分完档**，不留给人逐条猜。
   * 用的判据是模块图，不是运气：这条端点的**消费者文件**在不在某条路由页的 import 闭包里。
   *   - 不在任何闭包 ⇒ 装载普查**结构上量不到它**（那条路根本没有页面能走到），静态与运行时不矛盾，
   *     这一档该并进"界面走不到"那边去（§6 ② 的名单就该缩）；
   *   - 在闭包内、浏览器臂却没发 ⇒ 静态把时机**判高了**（多半是条件渲染或点了才发），
   *     这一档才是真欠的点击判据。
   */
  const relsOfEp = new Map();
  for (const r of rows) (relsOfEp.get(r.path) || relsOfEp.set(r.path, []).get(r.path)).push(...r.hitSrc.map((h) => h.rel));
  const orphan = [];
  const inClosure = [];
  /** 第十四段要的是**机器读的键**（原样的路径模板），不是上面那种给人看的装饰串 */
  const inClosureRaw = [];
  for (const p of notSeenLoad) {
    const rels = [...new Set(relsOfEp.get(p) || [])];
    const hosts = [...new Set(rels.flatMap((rel) => hostsOf(rel)))];
    if (hosts.length) inClosureRaw.push(p);
    (hosts.length ? inClosure : orphan).push(`${p}（消费者 ${rels.length} 个：${rels.map((x) => x.split("/").pop()).join(", ")}${hosts.length ? "；宿主 " + hosts.join(",") : ""}）`);
  }
  console.log(
    `### 「静态说装载会发、普查没见到」的 ${notSeenLoad.length} 条，这里当场分成两档（相加 ${orphan.length + inClosure.length}）\n` +
      `  A 消费者不在任何路由闭包 ⇒ 装载普查结构上量不到=${orphan.length}：${orphan.join("  ") || "无"}\n` +
      `  B 在闭包内但浏览器臂也没发 ⇒ 静态把时机判高了（条件渲染或点了才发），真欠点击判据=${inClosure.length}：${inClosure.join("  ") || "无"}\n` +
      `  ⇒ 对 §6 ② 的意义：A 档该并进「界面走不到」那边（判死名单可缩 ${orphan.length} 条），B 档不能算走不到（它只是装载时不发）。`,
  );
  console.log(
    `### 「桌面真会打出」的 ${liveSites.length} 处未守卫调用点，按**发出去的时机**再切\n` +
      ["装载即发", "点了才发", "不明"].map((k) => `  ${k}=${(byFire.get(k) ?? []).length}`).join("、") +
      `（相加 ${liveSites.length}；不明不计入"装载判据已覆盖"）\n` +
      `  装载即发的端点=${loadEps.length} 点了才发或不明的端点=${otherEps.length}\n` +
      (loadFace
        ? `  运行时列来自 ${process.env.LOADFACE}（实测路径 ${observed.length} 条）：装载类里**普查真见过**的=${seenLoad.length}` +
          `／**静态说装载会发、普查没见到**的=${loadEps.length - seenLoad.length}` +
          `（其中带参数的 ${paramEps.length - paramSeen.length} 条／无参数的 ${loadEps.length - seenLoad.length - (paramEps.length - paramSeen.length)} 条）` +
          "（前者要么页面已早退、要么参数路由取不到数据，要单独看）\n" +
          (paramEps.length && paramSeen.length === 0
            ? "  ⚠ **第二道对照失败**：无参数的端点对得上、**带参数的 ${...} 一条都对不上** ⇒ 这不是「运行时没发」，" +
              "是路径模板→正则的转换失效（量法坏了）。这一列**不能用**，先修 `pathSeen` 再看数\n"
            : "") +
          (loadEps.length && observed.length && seenLoad.length === 0
            ? "  ⚠ **对照失败**：静态说会在装载时发的端点，与实测路径**一条都没对上** —— 这几乎一定是口径问题" +
              "（前导斜杠、`${id}` 换成 `[^/]+` 的转义、或普查跑的是另一份代码），这一列**不能用**，先修对齐再看数\n"
            : "")
        : "  运行时列**缺失**（没给 `LOADFACE=`）：这一版只有静态分档，交叉核对没做——不当 0 用"),
  );
  console.log(
    `  路径匹配自测（内建、不依赖当天数据）：` +
      Object.entries(selfTest).map(([k, v]) => `${k}=${v ? "通过" : "**失败**"}`).join("、") +
      ` ⇒ ${selfOk ? "口径可用（这一列仍是上界：模板与端点天然存在包含关系）" : "**口径不可用，运行时列全部作废**"}`,
  );
  if (!selfOk) process.exitCode = 1;
  console.log(
    `  点了才发的调用点（装载普查看不见的那些，逐条点名）：` +
      (((byFire.get("点了才发") ?? []).map((s) => `${s.symbol}@${s.rel.split("/").pop()}:${s.line}`).join(", ")) || "无"),
  );
  console.log(
    `  不明的调用点：` +
      (((byFire.get("不明") ?? []).map((s) => `${s.symbol}@${s.rel.split("/").pop()}:${s.line}`).join(", ")) || "无"),
  );
  console.log(
    `  限度（必须连着读数一起看）：① 静态分档只看**定义形态**——` +
      "`const load = async () => api.x()` 既可能被 `useEffect` 调、也可能被 `onClick` 调，" +
      "这一段不做调用图，所以这类会偏判成「装载即发」；② 正因为①，" +
      "**「静态说装载会发、普查没见到」那一条差值才是本段真正要看的数**——它对不上的每一处，" +
      "都要人工确认到底是" + "谁调用它" + "（点了才发）还是页面已经早退；" +
      "③ 运行时列来自临时产物（`LOADFACE=` 指的那个文件），**代码一改就得重取**，否则对的是旧世界。\n",
  );
  /**
   * 死表面普查（第十一段）：从**真正的入口** `main.tsx` 走 import 闭包，闭包之外的模块就是界面加载不到的死表面。
   * 两档要分开，因为"删掉的代价"完全不同：
   *   - 只有测试在读 ⇒ 机制读者还在（按在册纪律：撤视图不等于撤字段，先数读者再谈删）；
   *   - 无人 import ⇒ 真死（`shared/hooks/index.ts` 这种零消费者 barrel 就落在这一档）。
   * 另外补一档"在闭包内、但除 import 语句外全仓没有任何引用点"的模块（看全部导出，不看默认导出：`PublicLayout` 只被具名导入用过，只查默认导出会给活模块贴死标签）——import 了不渲染（`PromptExport` 形状）不属真死，属**零挂载**。
   * 限度：用组件注册表（`const map = {a: A}` 再 `<map.a/>`）渲染的组件会被误判成零挂载，所以这一档只列名、不判死。
   */
  const ENTRY = "apps/web/src/main.tsx";
  const reach = closureOf([ENTRY]);
  const testPool = allPool.filter((rel) => /\.test\.tsx?$/.test(rel));
  const deadFiles = allPool.filter(
    (rel) => !reach.has(rel) && !/\.test\.tsx?$/.test(rel) && !rel.endsWith(".d.ts"),
  );
  const testOnly = deadFiles.filter((rel) => testPool.some((t) => importsOf(t).includes(rel)));
  const trulyDead = deadFiles.filter((rel) => !testOnly.includes(rel));
  const zeroMount = allPool.filter((rel) => reach.has(rel) && /\.tsx$/.test(rel) && neverRendered(rel));
  const ctrlDead = ["apps/web/src/shared/hooks/index.ts", "apps/web/src/shared/hooks/usePlayer.ts"];
  const ctrlLive = "apps/web/src/features/studio/pages/ProjectListPage.tsx";
  const ctrlOk =
    ctrlDead.every((f) => trulyDead.includes(f)) &&
    !trulyDead.includes(ctrlLive) &&
    !testOnly.includes(ctrlLive) &&
    !zeroMount.includes(ctrlLive);
  console.log(
    `### 死表面普查（从 ${ENTRY} 走 import 闭包；面=apps/web/src 共 ${allPool.length} 个 .ts/.tsx）\n` +
      `  闭包内=${reach.size} / 闭包外（排除测试与 .d.ts）=${deadFiles.length}\n` +
      `  只有测试在读（机制读者仍在）=${testOnly.length}：${testOnly.join(", ") || "无"}\n` +
      `  真死·无人 import=${trulyDead.length}：${trulyDead.join(", ") || "无"}\n` +
      `  在闭包内但全仓零引用（只列名不判死）=${zeroMount.length}：${zeroMount.join(", ") || "无"}\n` +
      `  对照：${ctrlDead.join(", ")} 必须在"真死"里、${ctrlLive} 三档都不该出现 ⇒ ${ctrlOk ? "通过" : "**失败（判据不可信）**"}`,
  );
  if (!ctrlOk) {
    console.log("UNRELIABLE —— 死表面判据的对照组不成立，这一段的读数不能用");
    process.exitCode = 1;
  }
  console.log("");
  console.log(
    "注：本表只列 apps/web/src 里的调用点；`@axiforge/ui`/`packages/*` 不参与桌面渲染，不在面内。" +
      "死面一档不是「可以立刻删」——先按在册纪律数活读者（界面读者与机制读者分开）。",
  );

  /*
   * 第十三段：调用者侧闸门审计。**这一档今天只读数，不动第十段的档位**
   * （在册纪律：新判据先原样指过去量误报，逐条证据读得通，才谈并进分档）。
   * 形状是 `apps/web/src/shared/components/AppHeader.tsx:84` 的
   * `{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}`：
   * `GlobalSearch.tsx` 里读不到任何判定，挡着那条云调用的是**挂载它的那一句**，
   * 而 import 闭包不知道这件事 ⇒ 这条永远留在「桌面真会打出」那个保守上界里下不来。
   */
  const stmtStartOf = (text, idx) => {
    let s = idx;
    while (s > 0 && !";{}".includes(text[s - 1])) s--;
    return s;
  };
  const gateEvidenceBefore = (masked, mountIdx, gsrc) => {
    const from = stmtStartOf(masked, mountIdx);
    const seg = masked.slice(from, mountIdx);
    const cands = [...seg.matchAll(new RegExp(gsrc, "g"))];
    const last = cands[cands.length - 1];
    if (!last) return null;
    const between = seg.slice(last.index + last[0].length);
    if (!between.includes("&&")) return null;
    if (/[?:}]/.test(between)) return null;
    return seg.replace(/\s+/g, " ").trim().slice(0, 96);
  };
  const auditMounts = (rel) => {
    if (!rel.endsWith(".tsx")) return null;
    const name = basename(rel).replace(/\.tsx$/, "");
    if (!/^[A-Z]/.test(name)) return null;
    const out = [];
    for (const f of allPool) {
      if (f === rel) continue;
      const c = maskedSrc(f);
      for (const m of c.matchAll(new RegExp(`<${name}[\\s/>]`, "g"))) {
        out.push({ at: `${f}:${lineOf(c, m.index)}`, gated: gateEvidenceBefore(c, m.index, guardSrc(c)) });
      }
    }
    return out;
  };
  // 合成自测必须走真实谓词（近似 harness 判错了还会自称通过）
  const stSrc = [
    "<div>",
    "  {show && !isLocalOnlyDeployment() && <Probe />}",
    "  {cond && !isLocalOnlyDeployment() ? <Other /> : <Probe />}",
    "  {cond && !isLocalOnlyDeployment() && other ? <Other /> : <Probe />}",
    "  <Probe />",
    "</div>",
  ].join("\n");
  const stMounts = [...stSrc.matchAll(/<Probe[\s/>]/g)].map((m) => !!gateEvidenceBefore(stSrc, m.index, guardSrc(stSrc)));
  /*
   * 四条样本各挡在哪一道判据上，别把它们压成一个布尔：
   * ① 同句 `&&` 前置 ⇒ 挡住；② 闸门后是 `? :` 且中间没有 `&&` ⇒ 靠"`&&` 必须在闸门与挂载之间"挡下；
   * ③ 裸挂载没有闸门 ⇒ 靠"有没有闸门命中"挡下；④ 闸门后**既有 `&&` 又跨了三元** ⇒ 只有 `[?:}]` 那一条能挡下它。
   * 去掉第④条样本时，把 `[?:}]` 那行删掉自测照样绿——那叫"两道判据里有一道从没被行使过"，等于没验过。
   */
  const stOk =
    stMounts.length === 4 &&
    stMounts[0] === true &&
    stMounts[1] === false &&
    stMounts[2] === false &&
    stMounts[3] === false;

  const audited = [...new Set(unguardedSites.map((s) => s.at.split(":")[0]))]
    .map((rel) => ({ rel, mounts: auditMounts(rel) }))
    .filter((r) => r.mounts && r.mounts.length);
  const allGated = audited.filter((r) => r.mounts.every((m) => m.gated));
  const someGated = audited.filter((r) => r.mounts.some((m) => m.gated) && !r.mounts.every((m) => m.gated));
  console.log(
    `### 调用者侧闸门审计（挂载那一句里的部署判定；**只读数，第十段档位没动**）\n` +
      `  有未守卫调用点的 .tsx 组件模块=${audited.length}：全部挂载都带闸门=${allGated.length} / 部分带=${someGated.length} / 一处都没带=${audited.length - allGated.length - someGated.length}\n` +
      `  全部挂载都带闸门的（贴挂载原文，人工确认"这句挡住的就是那条调用路径"）：\n` +
      (allGated.length
        ? allGated.map((r) => `    ${r.rel} ⇒ ${r.mounts.map((m) => `${m.at} [${m.gated}]`).join("；")}`).join("\n")
        : "    无") +
      `\n  合成自测（同句 AND 前置=挡住 / 三元且中间无 &&=不算 / 裸挂载=不算 / && 后跨三元=不算）实际判到=${JSON.stringify(stMounts)} ⇒ ${stOk ? "通过" : "**失败（谓词不可信）**"}` +
      `\n  限度：hooks 与 lib（小写开头的 .ts）不在这一段的面里——它们没有 JSX 挂载点，` +
      `要判"调用者侧闸门"得沿 export→消费者再走一跳，这一段不做。\n`,
  );
  if (!audited.length) {
    console.log("⚠ 一个组件模块都没 aud 到 ⇒ 这一段没在真语料上跑过，读数不能用");
    process.exitCode = 1;
  }
  /*
   * 消失告警要落在**具体那一个**上，不能只看计数：`GlobalSearch` 这一处挂载闸门是本段唯一在真语料上
   * 行使过判定的样本（E50 那条点击判据也钉着它），它哪天从"全部门被挡"里掉出去，
   * 要么是世界变了、要么是谓词退化了——两种都不能当"没有"用。
   * 对照组另一头选 `ProjectListPage`：它的挂载（路由 `<Route element={…}>`）本来就没带闸门，
   * 要是它也进了"全部门被挡"，那就是过度信任的方向（把活路径判成走不到）。
   */
  const ctrlGated = "apps/web/src/shared/components/GlobalSearch.tsx";
  const ctrlUngated = "apps/web/src/features/studio/pages/ProjectListPage.tsx";
  const ctrl13 =
    allGated.some((r) => r.rel === ctrlGated) &&
    !allGated.some((r) => r.rel === ctrlUngated) &&
    someGated.every((r) => r.rel !== ctrlUngated);
  console.log(
    `  对照：${ctrlGated} 必须在"全部门被挡"里、${ctrlUngated} 不该进那两档 ⇒ ${ctrl13 ? "通过" : "**失败（判据不可信）**"}\n`,
  );
  if (!ctrl13) {
    console.log("UNRELIABLE —— 调用者侧闸门的对照组不成立，第十三段读数不能用");
    process.exitCode = 1;
  }
  if (!stOk) {
    console.log("UNRELIABLE —— 调用者侧闸门的合成自测不成立，第十三段读数不能用");
    process.exitCode = 1;
  }

  /*
   * 第十四段：判据台账对账（`scripts/desktop-cloud-judgements.json`）。
   * 动因：README 与 §6 那句「第十二段那 12 条已逐条有界面级判据」今天**只活在散文里**——改一次测试标题、
   * 删一条桌面半断言，那句话就静默变成假话，而下一个人（包括明天的我）会当它是真的。
   * 在册纪律：散文承重的判据要抽成脚本；台账的棘轮方向**只有一个**——B 档多出一条没判据的端点 ⇒ 红。
   * 四条腿：
   *   ① 台账自己读得出（文件缺失／解析失败／一条都没有 ⇒ UNRELIABLE；"这次没跑成"不许当成"没问题"）
   *   ② 每条证据的**文件与标题原文**都还在树上（拿剥注释后的源码 grep。身份用标题不用 E 编号——
   *      编号会被重组，E20/E29 就是在册的幽灵编号，按编号 grep 迟早指向不存在的东西）
   *   ③ B 档每一条都要被台账点名（缺 ⇒ 红）；台账里**多出的条目只打印不判红**——端点掉出 B 档
   *      可能是量法退化而不是判据建成了，那种时候该问的是工具
   *   ④ 五条合成样本跑**真实谓词** `sameEndpoint`：前缀**不算**覆盖（`/comments` 挡不住
   *      `/comments/${commentId}/report`，否则一条判据抵掉一整族）
   * 没给 `LOADFACE` 时 B 档算不出来 ⇒ 只做 ①②④，并明写「覆盖腿未跑」，不拿"没红"读成"全覆盖"。
   * **实测限度（2026-10-09 变异取到的，不是推的）**：没有 LOADFACE 时，从台账里删掉**任意一条**都不会红，
   * 只有写死的那条对照组（E58 的 `/comments/${commentId}/report`）会红。所以这一段的两条红是分工的：
   * 控制位管"这一次跑没跑成"，覆盖腿管"B 档有没有漏"——**要让覆盖腿真跑，必须成对取数**
   * （`pnpm check:http-inventory > /tmp/x.txt` 再 `LOADFACE=/tmp/x.txt pnpm cloud:callmap`）。
   */
  const LEDGER = "scripts/desktop-cloud-judgements.json";
  const epKey = (p) => String(p).split("?")[0].replace(/\/+$/, "");
  const sameEndpoint = (a, b) => epKey(a) === epKey(b);
  const JD_SAMPLES = [
    ["/search/all?q=${encodeURIComponent(q)}", "/search/all", true],
    ["/tags/", "/tags", true],
    ["/users/profile", "/users/profile", true],
    ["/comments", "/comments/${commentId}/report", false],
    ["/characters/${characterId}/relations", "/characters/${characterId}/relations/${relationId}", false],
  ];
  const jdStOk = JD_SAMPLES.every(([a, b, want]) => sameEndpoint(a, b) === want);
  let ledgerErr = "";
  let ledger = null;
  if (!existsSync(LEDGER)) ledgerErr = "文件不存在";
  else {
    try {
      ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
    } catch (e) {
      ledgerErr = String(e).slice(0, 140);
    }
  }
  const entries = ledger && Array.isArray(ledger.endpoints) ? ledger.endpoints : [];
  const maskedCache = new Map();
  const ledgerMaskedOf = (f) => {
    if (!maskedCache.has(f)) maskedCache.set(f, existsSync(f) ? maskComments(readFileSync(f, "utf8")) : null);
    return maskedCache.get(f);
  };
  const dupKeys = entries.map((e) => epKey(e.endpoint)).filter((k, i, arr) => arr.indexOf(k) !== i);
  const ghost = [];
  for (const e of entries) {
    if (!Array.isArray(e.evidence) || !e.evidence.length) {
      ghost.push(`${e.endpoint} 没有任何证据条目`);
      continue;
    }
    for (const v of e.evidence) {
      const text = ledgerMaskedOf(v.file);
      if (text === null) ghost.push(`${e.endpoint} ← 证据文件不存在：${v.file}`);
      else if (!text.includes(v.title)) ghost.push(`${e.endpoint} ← 标题找不到：${v.file} 里的「${v.title}」`);
    }
  }
  const CONTROL_EP = "/comments/${commentId}/report";
  const controlIn = entries.some((e) => sameEndpoint(e.endpoint, CONTROL_EP));
  /** 覆盖腿要有真分母才跑：没有 LOADFACE 时 B 档是空的，那不能读成「台账多余 12 条」 */
  const hasB = Boolean(loadFace);
  const missing = !hasB ? [] : entries.length ? inClosureRaw.filter((p) => !entries.some((e) => sameEndpoint(e.endpoint, p))) : inClosureRaw;
  const stale = !hasB ? [] : entries.filter((e) => !inClosureRaw.some((p) => sameEndpoint(e.endpoint, p))).map((e) => e.endpoint);
  console.log(
    `### 第十四段：判据台账对账（${LEDGER}）\n` +
      `  台账=${entries.length} 条 · B 档=${hasB ? inClosureRaw.length : "未取（缺 LOADFACE）"} 条 · B 档里没判据=${hasB ? missing.length : "未对账"} · 幽灵证据=${ghost.length} · 重复键=${dupKeys.length}\n` +
      (entries.length
        ? hasB
          ? `  缺判据的 B 档端点：${missing.join(", ") || "无"}\n` +
            `  台账多余（该端点已不在 B 档 ⇒ 只提示，人来决定是裁条目还是查量法）：${stale.join(", ") || "无"}\n`
          : "  ⚠ **覆盖腿未跑**（没给 LOADFACE）：本次只验了台账自洽与证据存在性，**不能**读成「每条都有判据」\n"
        : `  ⚠ 台账空：${ledgerErr}\n`) +
        (hasB && inClosureRaw.length === 0
          ? "  ⚠ B 档为 0：这一段的「没缺判据」是空载，不能读成「都覆盖了」（先问 LOADFACE 是不是同一份代码跑出来的）\n"
          : "") +
      `  对照：本会话刚入册的 ${CONTROL_EP}（E58 守的那条）必须在台账里 ⇒ ${controlIn ? "通过" : "**失败**"}\n` +
      `  证据腿逐条走真实文件与真实标题（${entries.reduce((a, e) => a + (e.evidence?.length ?? 0), 0)} 处引用）\n` +
      "  限度：台账说的是「B 档这一条**由谁守着**」，不是「那条判据强不强」——判据自己的牙仍要靠变异取。",
  );
  if (!entries.length) {
    console.log("UNRELIABLE —— 判据台账读不出条目，第十四段不能当「没问题」");
    process.exitCode = 1;
  }
  if (ghost.length || dupKeys.length) {
    console.log(
      "FAIL —— 台账指向不存在的东西：\n" +
        [...ghost, ...dupKeys.map((k) => `重复键：${k}`)].map((x) => `  · ${x}`).join("\n"),
    );
    process.exitCode = 1;
  }
  if (missing.length) {
    console.log(`FAIL —— B 档有 ${missing.length} 条端点没有判据在册：${missing.join(", ")}`);
    process.exitCode = 1;
  }
  if (!controlIn) {
    console.log("UNRELIABLE —— 对照组不成立（刚补的那条判据不在台账里），台账对账不能用");
    process.exitCode = 1;
  }
  if (!jdStOk) {
    console.log("UNRELIABLE —— sameEndpoint 的合成自测不成立（前缀冒充覆盖那一类会在这里露出来）");
    process.exitCode = 1;
  }
}
