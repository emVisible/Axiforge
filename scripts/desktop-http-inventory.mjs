import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { origins } from "./ports.mjs";
import { maskComments, parseRoutes } from "./source-graph.mjs";

/**
 * 桌面态 / 浏览器态的云端调用普查（S13-3「云端功能处置」的分母来源）。
 * 端口真相源 scripts/ports.json → ports.mjs 派生；这里硬写会让普查连到另一个 dev server。
 *
 * 为什么一次跑**两臂**（2026-10-09 加）：
 *   - desktop 臂注入 `window.__TAURI_INTERNALS__`（`isTauriEnvironment()` 的判据）**并带 `?storage=memory`**；
 *     只注入标记不算数：那样选到的是 Tauri 支，chromium 里 plugin-sql 必败、页面没数据可读，
 *     "零请求"是**空载伪装出来的**（与本脚本第 1 条腿挡的是同一类假象，只是它藏在"挂载成功"底下）。
 *   - browser 臂不注入，app 走 HTTP 支。
 *   只测桌面臂的「零调用」是**没有对照的 0**：它分不清「真的不发」与「根本没能力发」。
 *   浏览器臂就是那条正对照——它必须 >0，否则普查方法本身失效（拦截器没接住，
 *   或页面把本地支误判成桌面支），此时桌面臂的 0 是恒真读数，不能当结论用。
 *   这正是本项目被教育过两次的形状：0 命中先问它是不是恒为 0。
 *
 * 为什么用 `page.route` 把 `/api/v1/**` **abort 掉而不是放行**：
 *   本机 8000 上往往是别人起的 uvicorn，而且它连的是**开发库**（不是 `axiforge_e2e`）；
 *   放行普查请求等于往别人的库里写数据。abort 之后量的是「尝试发了几笔、发到哪些路径」，零副作用。
 *   代价照实标注：被拦掉的请求会让组件进错误态，所以浏览器臂的 `pageErrors`
 *   不是产品缺陷读数，只是「这些调用确实发生过」的旁证。
 *
 * 五条腿判据（缺一不可，缺了就是一份会骗人的报告）：
 *   0. **路由面本身**非空、且仍是「曾经手抄那 8 条」的超集（解析器一旦丢前缀，覆盖就静默缩水）；
 *   1. 每条路由自己证明 React 挂载出了界面（`#root` 有子节点），否则空数组是「根本没跑成」；
 *   2. 桌面臂唯一调用点应为 **0**（不为 0 ⇒ REGRESSION，退出码 1）；
 *   3. 浏览器臂唯一调用点应 **> 0**（为 0 ⇒ 判据本身失效，退出码 1）；
 *   4. **e2e 那三张手抄路由表要解析得出条目**（解析出 0 条 ⇒ 判据在消失，退出码 1）；
 *      同时点名"解析出的路由面里，哪几条在 `desktop-http.spec.ts` 既不在三张表、也没被任何 `goto` 字面量走到"
 *      ——那是个**上界读数**（模板串拼出来的地址看不见），所以只报不判红：
 *      "要不要为某条路由写点击判据"是排期决定，会静默发生的只有"没人提醒你新增了路由"。
 */
const BASE = origins.web;
/**
 * 路由从 `apps/web/src/app/App.tsx` **解析**得出（2026-10-09：原先手抄 9 条）。
 * 手抄的失效方式是静默少测：新加一条 `<Route>` 不会有人提醒普查，于是"桌面态零云端调用"
 * 这句结论覆盖的页数是写死的那几条，而产品早已不止那几条——同一份路由表在
 * `cloud-callmap.mjs` 里也解析一遍，两处各抄必分叉，所以两边都读 `parseRoutes`。
 *
 * 只导航 `kind === "page"` 的叶子：布局（`/studio`）没有自己的地址，重定向壳
 * （`/studio/characters`、`/`、`*`、`ProjectFlowLegacyRedirect`）导航它只会立刻跳走，
 * 记到的笔数其实是**跳过去那一页**的——那会把同一页算两遍、把真页面漏一遍。
 *
 * 参数路由一律填 `PROBE`（一个确定不存在的 id）。这不是偷懒，是把覆盖面对齐到**最危险那一支**：
 * `?storage=memory` 那条支路**不播种**（`createStorageProvider` 直接 return 内存 Provider，
 * 由 `index.test.ts` 的「不建素材仓、不播种」钉着），所以任何 id 在本地都查不到。
 * ⇒ 本普查量的是「本地查不到时会不会偷偷发云端」；
 * ⇒ **命中支**（本地真有一条工程/角色时的路径）不在这里覆盖，它在 `e2e:desktop` 的点击层里。
 * 两条互补：不要把这里的 0 读成"桌面全路径零云端依赖"。
 */
const APP_ROUTES = "apps/web/src/app/App.tsx";
const PROBE = "inventory-probe";
/** 曾经手抄的那 8 条无参路由：解析结果必须仍然是它们的超集，否则就是解析器又丢了前缀 */
const MUST_INCLUDE = [
  "/discover",
  "/studio/projects",
  "/studio/items",
  "/studio/scenes",
  "/studio/characters/mine",
  "/studio/dashboard",
  "/profile",
  "/docs",
];
const parsed = parseRoutes(maskComments(readFileSync(join(process.cwd(), APP_ROUTES), "utf8")));
const navigable = [];
const seenPath = new Set();
for (const r of parsed) {
  if (r.kind !== "page") continue;
  const url = r.path
    .split("/")
    .map((seg) => (seg.startsWith(":") ? PROBE : seg === "*" ? PROBE : seg))
    .join("/");
  if (seenPath.has(url)) continue;
  seenPath.add(url);
  navigable.push({ url, pattern: r.path, params: r.params.length, splat: r.splat, element: r.element });
}
const ROUTES = navigable.map((r) => r.url);
const missing = MUST_INCLUDE.filter((p) => !ROUTES.includes(p));
/**
 * 第五条腿（2026-10-09 加）：**e2e 那份手抄路由清单要与这张解析出的路由面对账**。
 * `e2e/desktop-http.spec.ts` 里有三张表（`CLEAN_ROUTES` / `CLOUD_ONLY_ROUTES` / `LOCAL_UNAVAILABLE_ROUTES`），
 * 它们和普查原先那份是**同一类债**：新加一条 `<Route>` 不会有人提醒你去点它，
 * 于是"桌面点击层已覆盖"这句话会随产品长大而静默变薄。
 * 这里只做**可见化**：缺的条目点名并报数，不硬失败——因为"要不要为这条路由写点击判据"是排期决定，不是缺陷；
 * 真正会让脚本自己退出码 1 的是**两张表都解析不出条目**（清单改名/形状变了，那才是判据在消失）。
 */
const SPEC = "e2e/desktop-http.spec.ts";
const specSrc = maskComments(readFileSync(join(process.cwd(), SPEC), "utf8"));
const specUrls = [
  ...[...specSrc.matchAll(/const CLEAN_ROUTES\s*=\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]),
  ),
  ...[...specSrc.matchAll(/const CLOUD_ONLY_ROUTES[\s\S]*?=\s*\[([\s\S]*?)\n\];/g)].flatMap((m) =>
    [...m[1].matchAll(/\[\s*["']([^"']+)["']/g)].map((x) => x[1]),
  ),
  ...[...specSrc.matchAll(/const LOCAL_UNAVAILABLE_ROUTES\s*=\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]),
  ),
  /**
   * 还要算上**测试里直接 `goto` 的字面量**：`/studio/projects/new` 不在那三张表里，
   * 但 E17 那一族确实点进去了（`page.goto("/studio/projects/new?storage=memory")`）。
   * 只按三张表算会把"已经测过的页"报成"没认领"，那是**把判据报薄**，方向不对。
   * 模板串/变量拼出来的地址这里看不见 ⇒ 报出来的"没测到"是**上界**，只当线索用。
   */
  ...[...specSrc.matchAll(/(?:goto|visitInDesktopMode\(page,|visitWithLocalStoreFailing\(page,)\s*\(?\s*["']([^"'?#]+)/g)].map(
    (m) => m[1],
  ),
].map((u) => (u.startsWith("/") ? u : "/" + u));
const matchesPattern = (pattern, url) => {
  const p = pattern.split("/");
  const u = url.split("/");
  return p.length === u.length && p.every((seg, i) => seg.startsWith(":") || seg === "*" || seg === u[i]);
};
/**
 * 只认字面量会把**真测过的页**报成没测到：`E21` 是先点「编辑」再断言
 * `toHaveURL(/\/studio\/characters\/[^/]+\/edit$/)`——URL 是点出来、用正则验的，字符串扫不到它。
 * 所以再并上一档「**正则命中**」：给每条路由模式拼一个样例地址，拿测试里的 `toHaveURL(/…/)` 去撞。
 * 这一档**天生不精确**（`/\/discover/` 这种宽的会一次性认掉整族），所以它不悄悄抵账：
 * 靠它才被判成"测过"的路由，连命中的那条正则原文一起打出来，由人判断该不该信。
 */
const urlRegexes = [];
let urlRegexSeen = 0;
for (const m of specSrc.matchAll(/toHaveURL\(\s*\//g)) {
  urlRegexSeen++;
  /**
   * 不能用一条正则把正则字面量抠出来：测试里写的是 `toHaveURL(/\/studio\/characters\/[^/]+\/edit$/)`，
   * **字符类里那个没转义的 `/`** 会把"到下一个斜杠为止"的抠法截断，抠出来的是半条非法正则
   * ⇒ `new RegExp` 抛错 ⇒ 被 try/catch 咽掉 ⇒ 这一档静默变成"0 条命中"，看起来像"这些页真没测过"。
   * 所以这里手扫：`\\` 跳一位，`[` 之内斜杠不算结束符，且不跨行猜。
   */
  const from = m.index + m[0].length;
  let inClass = false;
  for (let i = from; i < specSrc.length; i++) {
    const c = specSrc[i];
    if (c === "\\") { i++; continue; }
    if (c === "\n" && !inClass) break;
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    else if (c === "/" && !inClass) {
      urlRegexes.push(specSrc.slice(from, i));
      break;
    }
  }
}
const sampleUrl = (pattern) =>
  pattern
    .split("/")
    .map((seg) => (seg.startsWith(":") ? "probe" : seg === "*" ? "probe-doc" : seg))
    .join("/");
const regexHit = (pattern) => {
  const sample = sampleUrl(pattern);
  return urlRegexes.find((src) => {
    try {
      return new RegExp(src).test(sample);
    } catch {
      return false; // 正则本身不合法：当没命中，别让它把判据撑过去
    }
  });
};
const literalHit = (pattern) => specUrls.some((u) => matchesPattern(pattern, u));
const noLiteral = navigable.filter((r) => !literalHit(r.pattern));
const regexOnly = noLiteral.filter((r) => regexHit(r.pattern));
const noEvidence = noLiteral.filter((r) => !regexHit(r.pattern));

async function runArm(browser, { desktopMarker, memoryHost }) {
  const ctx = await browser.newContext();
  if (desktopMarker) {
    // 桌面态探针就是一句「"__TAURI_INTERNALS__" in window」，注入它即可让 app 走本地支
    await ctx.addInitScript(() => {
      window.__TAURI_INTERNALS__ = {};
    });
  }
  const rows = [];
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const attempted = [];
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 140)));
    /*
     * 只盯 `/api/v1/**` 有一个盲区：绕开 apiClient 前缀的出站请求（绝对 URL、别的主机、
     * 本机模型端口……）在这张脸上完全看不见。这一档先把**跨源**请求数出来，不下结论。
     */
    const external = [];
    const sameOriginHost = new URL(BASE).host;
    page.on("request", (req) => {
      let u;
      try {
        u = new URL(req.url());
      } catch {
        return;
      }
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      if (u.host === sameOriginHost) return;
      external.push(u.host + u.pathname);
    });
    /*
     * 比"跨源"更严的一档：按 resourceType 数**取数请求**（fetch／xhr），不看 URL 写成什么样。
     * `/api/v1` 前缀和主机名都是可以被绕开的**写法**，而"这一次是在取数"绕不开——
     * 上一批那条跨源腿仍然漏得下同源、不同前缀的取数（例如直接 fetch("/search/...")）。
     */
    const dataReqs = [];
    page.on("request", (req) => {
      const rt = req.resourceType();
      if (rt !== "fetch" && rt !== "xhr") return;
      let u;
      try {
        u = new URL(req.url());
      } catch {
        return;
      }
      dataReqs.push(u.host + u.pathname);
    });
    await page.route("**/api/v1/**", (route) => {
      attempted.push(new URL(route.request().url()).pathname);
      return route.abort();
    });
    try {
      const url = BASE + route + (memoryHost ? (route.includes("?") ? "&" : "?") + "storage=memory" : "");
      await page.goto(url, { waitUntil: "load", timeout: 25000 });
      await page.waitForTimeout(2500);
    } catch (e) {
      errors.push("goto:" + String(e.message).slice(0, 100));
    }
    let rootChildren = 0;
    try {
      rootChildren = await page.evaluate(
        () => document.querySelector("#root")?.childElementCount ?? 0,
      );
    } catch (e) {
      errors.push("mountProbe:" + String(e.message).slice(0, 100));
    }
    let providerBranch = "读取失败";
    try {
      providerBranch = await page.evaluate(
        () => window.__AXIFORGE_PROVIDER_BRANCH__ ?? "未登记",
      );
    } catch (e) {
      errors.push("branchProbe:" + String(e.message).slice(0, 100));
    }
    rows.push({
      route,
      attempted: [...new Set(attempted)].sort(),
      pageErrors: [...new Set(errors)].slice(0, 3),
      rootChildren,
      providerBranch,
      external: [...new Set(external)].sort(),
      dataReqs: [...new Set(dataReqs)].sort(),
    });
    await page.close();
  }
  return rows;
}

const browser = await chromium.launch();
/**
 * 桌面臂的配置是「标记 + `?storage=memory`」，不是只注入标记（2026-10-09 修正）。
 * 只注入标记时 `createStorageProvider()` 会选 Tauri 支，而 chromium 里 plugin-sql 必然失败
 * ⇒ 页面装载后什么都没得读，也就什么都不会发——那个 0 是**空载伪装成干净**，
 * 与本脚本头第 1 条腿（未挂载 ⇒ UNRELIABLE）挡的是同一类假象，只是它藏在"挂载成功"底下。
 * 加上 `?storage=memory` 才有可读写的本地库，此时的 0 才叫"桌面态零云端依赖"。
 */
const desktop = await runArm(browser, { desktopMarker: true, memoryHost: true });
const web = await runArm(browser, { desktopMarker: false });
await browser.close();

const unmounted = [...desktop, ...web].filter((r) => r.rootChildren === 0);
const desktopUnique = [...new Set(desktop.flatMap((r) => r.attempted))].sort();
const webUnique = [...new Set(web.flatMap((r) => r.attempted))].sort();
const desktopOnly = desktopUnique.filter((p) => !webUnique.includes(p));

console.log("路由\t带参\t桌面态笔数\t浏览器态笔数\t两臂都挂载");
for (let i = 0; i < ROUTES.length; i++) {
  console.log(
    `${ROUTES[i]}\t${navigable[i].params ? navigable[i].params : navigable[i].splat ? "*" : "-"}\t${
      desktop[i].attempted.length
    }\t${web[i].attempted.length}\t${
      desktop[i].rootChildren > 0 && web[i].rootChildren > 0 ? "是" : "否"
    }`,
  );
}
console.log("");
console.log(`DESKTOP_UNIQUE=${desktopUnique.length}`);
for (const p of desktopUnique) console.log(`  桌面态仍在请求：${p}`);

/*
 * 「零请求」要能被证明是**挂在本地库支上**读出来的，否则它和"这页根本没挂载任何东西"是同一个读数。
 * 脚本头登记过：只注入标记时 Tauri 支在 chromium 里必败 ⇒ 那个 0 是空载。这里不再靠配置推断，
 * 直接读工厂登记的支名（`getStorageProviderBranch` / DEV 句柄），一条一条核。
 * 浏览器臂同时当这条腿的正控：它必须读出 `cloud`，读成"未登记"就说明句柄根本没被挂上（判据空转）。
 */
const branchCount = (rows) => {
  const m = new Map();
  for (const r of rows) m.set(r.providerBranch, (m.get(r.providerBranch) ?? 0) + 1);
  return [...m.entries()].map(([k, v]) => `${k}×${v}`).join(" ／ ");
};
const fellBack = desktop.filter(
  (r) =>
    r.providerBranch !== "memory" &&
    r.providerBranch !== "未登记" &&
    r.providerBranch !== "读取失败",
);
const noBranch = desktop.filter((r) => r.providerBranch === "未登记");
const probeDead =
  desktop.every((r) => r.providerBranch === "未登记" || r.providerBranch === "读取失败") &&
  web.every((r) => r.providerBranch === "未登记" || r.providerBranch === "读取失败");
console.log(`DESKTOP_BRANCH=${branchCount(desktop)}（真挂了本地库的那几支应为 memory）`);
console.log(`BROWSER_BRANCH=${branchCount(web)}（问过工厂的路由应为 cloud，这条是上面那条的正控）`);
console.log(
  `BRANCH_EVIDENCE=${desktop.length - noBranch.length - fellBack.length}/${desktop.length}` +
    ` ／ 没问过工厂的路由=${noBranch.length}（这些路由的"零请求"由整页早退与藏控件挡着，不由 Provider 支名挡着——是覆盖面事实，不是缺陷）`,
);
for (const r of fellBack) console.log(`  真回落：${r.route} → ${r.providerBranch}`);

const desktopExternal = [...new Set(desktop.flatMap((r) => r.external))].sort();
const webExternal = [...new Set(web.flatMap((r) => r.external))].sort();
console.log(
  `EXTERNAL_DESKTOP=${desktopExternal.length} ／ EXTERNAL_BROWSER=${webExternal.length}（跨源请求；同源=vite 自己）`,
);
for (const e of [...new Set([...desktopExternal, ...webExternal])].slice(0, 12)) {
  console.log(`  跨源：${e}${desktopExternal.includes(e) ? "（桌面臂也发）" : ""}`);
}

const desktopData = [...new Set(desktop.flatMap((r) => r.dataReqs))].sort();
const webData = [...new Set(web.flatMap((r) => r.dataReqs))].sort();
console.log(
  `DATA_DESKTOP=${desktopData.length} ／ DATA_BROWSER=${webData.length}（按 resourceType 数的取数请求，不看 URL 写法）`,
);
for (const d of desktopData.slice(0, 12)) {
  const hit = desktop.filter((r) => r.dataReqs.includes(d)).map((r) => r.route);
  console.log(`  桌面臂取数：${d} ⇐ ${hit.slice(0, 3).join(", ")}${hit.length > 3 ? " …" : ""}`);
}
console.log(`BROWSER_UNIQUE=${webUnique.length}（正对照）`);
for (const p of webUnique) console.log(`  浏览器态：${p}`);
if (desktopOnly.length) {
  console.log(`DESKTOP_ONLY=${desktopOnly.length} ← 只有桌面支会发，属于要单独定性的形状：`);
  for (const p of desktopOnly) console.log(`  ${p}`);
}
const cloudless = web.filter((r) => r.attempted.length === 0).map((r) => r.route);
console.log(
  `ROUTES=${ROUTES.length}（解析自 ${APP_ROUTES}：page ${navigable.length} / 布局 ${
    parsed.filter((r) => r.kind === "layout").length
  } / 重定向 ${parsed.filter((r) => r.kind === "redirect").length} / Route 标签 ${parsed.length}）` +
    ` 带参=${navigable.filter((r) => r.params).length} UNMOUNTED=${unmounted.length}`,
);
console.log(
  `浏览器态 0 笔的页=${cloudless.length}：${cloudless.join(", ") || "无"} ← 这些页本身没有云端面，不是普查没测到`,
);
console.log(
  `SPEC_URLS=${specUrls.length}（${SPEC}：三张表 + 测试里直接 goto 的字面量） ` +
    `没有字面量导航到的路由=${noLiteral.length}：${noLiteral.map((r) => r.pattern).join(", ") || "无"}` +
    " ← 这里包含『靠点击走过去、URL 由正则验』的那些，别看名字就当它们没测",
);
console.log(
  `  toHaveURL 正则抠出 ${urlRegexes.length}/${urlRegexSeen} 条 其中确有正则证据=${regexOnly.length} 条：` +
    (regexOnly.map((r) => `${r.pattern} ⇐ /${regexHit(r.pattern)}/`).join("   ") || "无") +
    `  ⇒ **完全没证据的路由=${noEvidence.length}**：${noEvidence.map((r) => r.pattern).join(", ") || "无"}` +
    (urlRegexes.length < urlRegexSeen ? "  ← 抠出的条数少于出现的条数：有正则没扫到，这一档的读数是薄的" : ""),
);

if (ROUTES.length === 0 || missing.length || specUrls.length === 0) {
  console.log(
    "UNRELIABLE — 面解析失效（可导航 " +
      ROUTES.length +
      ` 条，手抄时代那 8 条里缺：${missing.join(", ") || "无"}；e2e 那三张表解析出 ${specUrls.length} 条）` +
      "⇒ 解析器又丢前缀了（多半是 `<Route>` 或清单的形状变了），两臂的笔数与点击层的账都不能当结论用",
  );
  process.exitCode = 1;
} else if (unmounted.length > 0) {
  console.log(
    "UNRELIABLE — " +
      unmounted.length +
      ` 条路由根本没挂载出界面（多半是 ${BASE} 上没有活的服务）；两臂的笔数都不能当结论用`,
  );
  process.exitCode = 1;
} else if (webUnique.length === 0) {
  console.log(
    "UNRELIABLE — 浏览器态也一笔都不发 ⇒ 正对照为 0：拦截器没接住，或本地支被误判成桌面支。" +
      "此时桌面态的 0 是恒真读数，不能当「桌面已零云端依赖」的证据",
  );
  process.exitCode = 1;
} else if (probeDead) {
  console.log(
    "UNRELIABLE — 两臂的支名都读不到（未登记／读取失败）：这条空载判据在空转，别把它的 0 当成证据",
  );
  process.exitCode = 1;
} else if (webData.length === 0) {
  console.log(
    "UNRELIABLE — 浏览器臂一次取数请求都没数到：resourceType 探针在空转，`DATA_DESKTOP=0` 不构成证据",
  );
  process.exitCode = 1;
} else if (desktopData.length) {
  console.log(
    `REGRESSION — 桌面臂仍有 ${desktopData.length} 个取数请求（按 resourceType 数，绕不过去）：` +
      desktopData.join(", "),
  );
  process.exitCode = 1;
} else if (desktopExternal.length) {
  console.log(
    `REGRESSION — 桌面臂发出 ${desktopExternal.length} 个跨源请求，这类形状绕过 /api/v1 前缀判据：` +
      desktopExternal.join(", "),
  );
  process.exitCode = 1;
} else if (fellBack.length) {
  console.log(
    `REGRESSION — 桌面臂有 ${fellBack.length} 路由**问过工厂却没挂在本地库支**，那几条的"零云端请求"是回落而非干净：` +
      fellBack.map((r) => `${r.route}→${r.providerBranch}`).join(", "),
  );
  process.exitCode = 1;
} else if (desktopUnique.length > 0) {
  console.log(`REGRESSION — 桌面态仍有 ${desktopUnique.length} 个唯一云端调用点，见上面清单`);
  process.exitCode = 1;
} else {
  console.log(
    `OK — 桌面态零 /api/v1（正对照：浏览器态 ${webUnique.length} 个唯一调用点，说明拦截与普查方法有效）`,
  );
}
