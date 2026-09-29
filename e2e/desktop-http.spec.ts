import { expect, test, type Page } from "@playwright/test";

/**
 * E14 桌面态 HTTP 残留棘轮（web 退役迁移的可测进度）。
 *
 * 目的：把「还剩多少功能没本地化」从人工判断变成一个会缩小的数字。
 * 做法是给页面注入桌面探针——`isTauriEnvironment()` 的实际判据就是一句
 * `"__TAURI_INTERNALS__" in window`（`shared/storage/tauriSqlBackend.ts:22`），
 * 注入它即可让浏览器里的 app 走桌面分支，从而在 CI 里真的执行到本地支
 * （否则桌面支在 Playwright 下结构上永不被测，这是本项目已经付过一次的债）。
 *
 * 两条规则的含义不同，别弄反：
 * - CLEAN_ROUTES 断言「一个 /api/v1 请求都不该有」——达成态。
 * - KNOWN_DEBT_ROUTES 断言「目前仍在请求」——**它会在被修好的那一刻变红**，
 *   红了就把该条目从表里删掉，让它挪进 CLEAN_ROUTES。这是故意的反向棘轮。
 */

const DESKTOP_MARKER_INIT = () => {
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
};

/**
 * 断言的是「进入这个路由、装载这条数据通路」时零云端请求。
 * **不覆盖点击之后的行为**——例如 /studio/characters/new 上的「AI 建档建议」按钮，
 * 它调 `aiApi.suggestCharacter`（CreateCharacterPage.tsx:83）在这条判据之外。
 * 这条边界写在这里而不是留成隐含预期：路由级棘轮证明的是装载路径，不是整页无云调用。
 */
const CLEAN_ROUTES = [
  "/discover",
  "/studio/projects",
  "/studio/items",
  "/studio/scenes",
  "/studio/characters/mine",
  "/studio/dashboard",
  "/profile",
  "/docs",
  "/studio/characters/new",
];

/**
 * 修好一项就把它从这里删掉、挪进 CLEAN_ROUTES。目前为空 = 已枚举的无 id 路由
 * 在桌面分支下都不再打云端。
 */
const KNOWN_DEBT_ROUTES: Record<string, string> = {};

/**
 * 需要 id 的路由：桌面分支读本地 SQLite，而浏览器里 `@tauri-apps/plugin-sql` 的
 * `invoke` 不存在。这里刻意注入一个**必然失败**的 invoke，测的不是"页面能渲染出数据"
 * （那是壳内冒烟的职责），而是这条硬不变量：
 *   本地存储不可用时，桌面分支也不得回落到 HTTP。
 * 回落一旦存在，删掉 web 之后这些页面就会从"可读的失败"变成"连不上后端的挂死"。
 */
const LOCAL_UNAVAILABLE_ROUTES = [
  "/studio/projects/no-such-project",
  "/play/no-such-project",
  "/studio/items/no-such-item",
  "/studio/scenes/no-such-scene",
  "/studio/characters/no-such-character",
  // S13-1 传记本地化后新增：页面在本地库必然失败时也不许回去打 storyApi
  "/studio/characters/no-such-character/stories/no-such-story",
  "/studio/characters/no-such-character/stories/no-such-story/edit",
];

async function visitWithLocalStoreFailing(page: Page, route: string): Promise<string[]> {
  const hits: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (path.startsWith("/api/v1/")) hits.push(path);
  });

  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
      invoke: () => Promise.reject(new Error("本地存储在此环境不可用（e2e 注入）")),
    };
  });
  await page.goto(route, { waitUntil: "load" });
  await page.waitForTimeout(2500);

  await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);
  return [...new Set(hits)].sort();
}

async function visitInDesktopMode(page: Page, route: string): Promise<string[]> {
  const hits: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (path.startsWith("/api/v1/")) hits.push(path);
  });

  await page.addInitScript(DESKTOP_MARKER_INIT);
  await page.goto(route, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  // 判据可达性：先证明桌面分支真的被走进了，否则下面的「零请求」是假绿
  await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);
  return [...new Set(hits)].sort();
}

test.describe("E14 桌面态不发云端请求", () => {
  for (const route of CLEAN_ROUTES) {
    test(`${route} 在桌面分支下零 /api/v1 请求`, async ({ page }) => {
      const hits = await visitInDesktopMode(page, route);
      expect(hits, `桌面态仍请求了：${hits.join(", ")}`).toEqual([]);
    });
  }

  for (const [route, reason] of Object.entries(KNOWN_DEBT_ROUTES)) {
    test(`${route} 的已知欠账仍在（修好请把条目删掉）—— ${reason}`, async ({ page }) => {
      const hits = await visitInDesktopMode(page, route);
      expect(hits.length, "该路由已不再发云端请求：请把条目移入 CLEAN_ROUTES").toBeGreaterThan(0);
    });
  }

  test("桌面分支下这些路由不因缺后端而抛未捕获异常", async ({ page }) => {
    for (const route of [...CLEAN_ROUTES, ...Object.keys(KNOWN_DEBT_ROUTES)]) {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120)));
      await page.addInitScript(DESKTOP_MARKER_INIT);
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(1200);
      expect(errors, `${route} 抛错：${errors.join(" | ")}`).toEqual([]);
    }
  });
});

test.describe("E15 本地存储不可用时也不回落 HTTP", () => {
  for (const route of LOCAL_UNAVAILABLE_ROUTES) {
    test(`${route} 在本地库必然失败的前提下仍零 /api/v1 请求`, async ({ page }) => {
      const hits = await visitWithLocalStoreFailing(page, route);
      expect(hits, `桌面分支回落到云端了：${hits.join(", ")}`).toEqual([]);
    });
  }
});

test.describe("E18 云端专属入口在桌面态隐藏，而不是演成空态", () => {
  test("剧本列表的工具条（模板 tab / 元剧本筛选）：浏览器里有、桌面态没有", async ({ page }) => {
    /*
     * 这条守的是 `ProjectListPage` 里那一整块 `{!localOnly && (…)}` 工具条——
     * 模板 tab 与元剧本筛选都在里面。它测的不是"我新加的闸门"（没有新闸门：
     * 这块本来就存在），而是**这条不变量**：云端专属能力在桌面不给入口，
     * 于是 `listTemplates` 的 `catch(() => [])` 不会被触发、界面不会把"这台机器没这功能"
     * 演成"暂无模板"的空态（deployment.ts 的约定）。
     * 两半都要测：只测桌面那一半，在整块工具条被删掉的改动下也会绿——
     * 我用 `{true && (` 把外层闸门打穿之后确认它确实会红，才敢留这条。
     * 顺序是先浏览器后桌面：`addInitScript` 对该 page 之后的每次导航都生效。
     */
    await page.goto("/studio/projects", { waitUntil: "load" });
    await expect(page.getByText("模板", { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("元剧本", { exact: true })).toBeVisible({ timeout: 8000 });

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await expect(page.getByText("还没有剧本")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("模板", { exact: true })).toHaveCount(0);
    await expect(page.getByText("元剧本", { exact: true })).toHaveCount(0);
  });
});

/**
 * E19 建档建议在桌面是「显式缺席」，不是发一条必然失败的请求。
 *
 * 这条把 S13-2d 里「点击之后的 `aiApi.suggestCharacter` 仍没测到」那句边界真的补上了：
 * 有了内存宿主才能点，而点的结果必须是零云端请求 + 一条说清原因提示。
 * 注意它守的是**不静默**，不是"本地能生成建议"——本地这条通路还没有
 * （`packages/axs/prompts/` 只有 `prose-to-axs.json`，建档要新做一份提示词，属 ADR-029 未决项）。
 */
test.describe("E19 桌面态的 AI 建档建议显式缺席", () => {
  test("点「AI 填充六层建议」不发 /api/v1，并给出一条可读原因", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/characters/new?storage=memory", { waitUntil: "load" });

    const button = page.getByRole("button", { name: "AI 填充六层建议" });
    await expect(button).toBeVisible({ timeout: 8000 });
    /*
     * 这里刻意不先填角色名：锚点的「姓名/称谓」在模板选择那一步之后，取到它要把整条建角流程搬进用例。
     * 之所以仍然测得到，是因为能力检查被放在名称校验**之前**（CreateCharacterPage.handleAiSuggest），
     * 所以"闸门被拿掉"这一改动会立刻让断言红在提示语上（实测：去掉闸门后红在那条提示语的 toBeVisible 上）。
     * 零云端请求那一半在本用例里是附带的强判据，真正的判据是提示语的在场。
     */
    await button.click();

    await expect(page.getByText("桌面版还没有本地建档建议通路")).toBeVisible({ timeout: 8000 });
    expect(hits, `桌面态仍请求了云端：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/**
 * E17 桌面点击路径（S13-5 的内存本地库宿主）。
 *
 * E14/E15 只能断言「装载路径」：注入的 `__TAURI_INTERNALS__` 骗得过 `isTauriEnvironment()`
 * 却骗不过 Rust 连接，所以本地支在点击之后必然失败，点击本身无从验证。
 * `?storage=memory` 让浏览器里真的有一条可读写的本地库（仅 DEV 生效，见 `createStorageProvider`），
 * 于是「桌面首屏点新建」第一次成了可断言的行为——这一条抓的是 S13-2e 的真实缺陷：
 * 工程域的创建/删除当时仍直连 `projectApi`，桌面上点「新建剧本」是发给一个不存在的服务端。
 */
test.describe("E17 桌面态点击路径写进本地库", () => {
  test("新建剧本 → 落到工程页 → 列表里看得见 → 删除 → 列表回到空态，全程零 /api/v1", async ({
    page,
  }) => {
    const hits: string[] = [];
    const errs: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errs.push(m.text().slice(0, 260));
    });
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    // 卡片上的删除按钮走 window.confirm，不接受就等于测试没测到删除
    page.on("dialog", (d) => d.accept());

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });

    // 判据可达性：先证明这条路径真的走本地库，否则下面的「零请求」是假绿
    await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);
    await expect(page.getByText("还没有剧本")).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("桌面可建");
    await page.getByRole("button", { name: "创建" }).click();

    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    /*
     * E20（同批挂在这里，因为建好的工程只在同一文档内活着）：编排台「项目」栏默认是收起的，
     * 直接断言「发送到 Nexus 不在」会空载成立，所以先展开、再用**同栏留下来的那个动作**证明这一栏真渲染了。
     * Nexus 收件箱是服务端本质（跨工程存在），桌面没有对应语义 → 不给入口，与 E18 同一口径。
     */
    await page.getByRole("button", { name: "项目", exact: true }).click();
    await expect(page.getByRole("button", { name: "导出 Markdown" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "发送到 Nexus" })).toHaveCount(0);

    /*
     * E22：工程元信息写入面在桌面被点一次。`onProjectPatch` 走 `patchProjectMeta` → Provider
     * （S13-2d 那条腿），此前只有契约级证据；界面是 onBlur 落库，所以要按 Tab 而不是点保存。
     * 判据不取 toast（它会自己消失、也容易被本地 state 演成真的），而是**真回读一趟**：
     * 列表 → 再进工程 → 这一栏还在，才证明字节落进了本地库。
     */
    await page.getByPlaceholder("世界观设定…").fill("方舟是一座会移动的城");
    await page.getByPlaceholder("世界观设定…").press("Tab");
    await page.waitForTimeout(400);
    await page.getByRole("link", { name: "剧本列表" }).click();
    await expect(page.getByText("桌面可建").first()).toBeVisible({ timeout: 8000 });
    await page.getByText("桌面可建").first().click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await page.getByRole("button", { name: "项目", exact: true }).click();
    await expect(page.getByPlaceholder("世界观设定…")).toHaveValue("方舟是一座会移动的城", { timeout: 8000 });

    await page.getByRole("link", { name: "试玩" }).first().click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 8000 });
    // bootstrap 工程自带一拍戏（「故事从这里开始...」）：这句出现=离线编译真跑通了，不是空壳页面
    await expect(page.getByText("故事从这里开始")).toBeVisible({ timeout: 8000 });
    // 判据从「只筛数据通路那一类」升级成「整条桌面链路上零 console 错误」：播放器那条 <a><a> 修好之后才敢这么收
    expect(errs, `桌面链路上有 console 错误：${errs.join(" | ")}`).toEqual([]);
    await page.goBack({ waitUntil: "load" });

    /*
     * 用浏览器后退而不是第二次 goto：内存库随页面重载而归零，
     * `goto` 会新建一个空库、把「刚建的工程看得见」这条断言变成假阴性。
     * 后退是同一文档内的 popstate，Provider 的 memo 与刚写入的数据都还在。
     */
    await page.goBack({ waitUntil: "load" });
    const card = page.getByText("桌面可建").first();
    await expect(card).toBeVisible({ timeout: 8000 });

    await card.hover();
    await page.getByRole("button", { name: "删除" }).first().click();
    await expect(page.getByText("还没有剧本")).toBeVisible({ timeout: 8000 });

    expect(hits, `点击路径上发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/**
 * E21 桌面态：建角色 → 传记 → 新建篇章（#59 那条「本地化做完却没有入口」的点击层对手）。
 *
 * 值得整条搬进用例的理由：`characterTabs.test.ts` 那三条量的是纯函数层（该不该给入口），
 * 而这条量的是**真给了入口之后，用户点得到、写得进、读得回**——S13-1 的
 * `StoredStory` + SQLite v4 + `storySaves` 分派口，此前只在契约用例里成立过，没被点过一次。
 * 全程零 `/api/v1` 加零未捕获异常是这条链的地板，不是天花板。
 */
test.describe("E21 桌面态建角色 → 传记 → 新建篇章", () => {
  test("四个字段建出角色，传记标签点得开，篇章建得出来", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/characters/new?storage=memory", { waitUntil: "load" });
    await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);

    /*
     * 先点一个模板：`handleSave` 要求 `anchor.essence`（概括）非空，而「概括」这一栏在
     * 锚点层折叠区里、默认不渲染（实测只填姓名+描述会停在原页并弹「请至少填写锚点中的「概括」」）。
     * 模板一次把六层填满，用例因此不必再去开折叠器——这也顺手把「模板能建角」这条桌面主路径测了。
     */
    await page.getByRole("button", { name: /英雄/ }).first().click();
    await page.getByPlaceholder("角色如何称呼").fill("凛");
    await page.getByRole("button", { name: "保存角色" }).click();

    // 回读才作数：卡片出现在「我的角色」里，才谈得上点进详情（写入没落库时这里先红）
    await expect(page).toHaveURL(/\/studio\/characters\/mine$/, { timeout: 8000 });
    const card = page.getByText("凛").first();
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.click();

    /*
     * 编辑页往返。`useUpdateCharacter` 的本地腿早就写好了，但从没被点过：
     * 实测它干净（保存更改 → 回到详情页，全程零 /api/v1），把它的 `isTauriEnvironment()` 短路成
     * `false &&` 之后这条就红在「回到详情页」的 URL 断言上——也就是桌面上保存会直接失效。
     */
    await page.getByRole("link", { name: "编辑", exact: true }).click();
    await expect(page).toHaveURL(/\/studio\/characters\/[^/]+\/edit$/, { timeout: 8000 });
    await page.getByRole("button", { name: "保存更改" }).click();
    await expect(page).toHaveURL(/\/studio\/characters\/[^/]+$/, { timeout: 8000 });

    const tab = page.getByRole("button", { name: "传记" });
    await expect(tab, "传记标签不在=本地通路齐了却没入口（本轮修掉的那一类）").toBeVisible({ timeout: 8000 });
    await tab.click();
    await expect(page.getByText("还没有书写任何篇章")).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: "+ 新建篇章" }).click();
    await page.getByPlaceholder("如：第一章·起源").fill("第一章·地下");
    await page.getByRole("button", { name: "创建并编辑" }).click();
    await expect(page).toHaveURL(/\/stories\/[^/]+\/edit$/, { timeout: 8000 });

    expect(crashes, `桌面链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `点击路径上发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});
