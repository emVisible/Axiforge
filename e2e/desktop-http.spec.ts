import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

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
 * 云端专属的**带 id 路由**——E35 那条「入口与目标同生共死」里的目标那一半。
 * 发现页入口在桌面早就显式缺席（`DiscoverPage` 的 `isLocalOnlyDeployment` 分支），
 * 但这 6 条详情/主页直到 2026-10-09 没有同一道闸门：直接输 URL 进来照样打云端。
 * 它们之所以没被发现，是因为加载面普查（`check:http-inventory`）当时**手抄** 9 条路由、
 * 一条带 id 的 discover 路由都不在里面——"桌面态零 /api/v1"那句话是真的，覆盖面是假的。
 * 现在普查从 `App.tsx` 解析出 25 条，才量到这 7 个调用点。
 */
const CLOUD_ONLY_ROUTES: Array<[string, string]> = [
  ["/discover/projects/no-such-project", "公开剧本详情"],
  ["/discover/characters/no-such-character", "公开角色详情"],
  ["/discover/items/no-such-item", "公开道具详情"],
  ["/discover/scenes/no-such-scene", "公开场景详情"],
  ["/discover/topics/no-such-topic", "话题页"],
  ["/author/no-such-author", "创作者主页"],
];

/** 桌面态应零云调用的路由全集（无参那批 + 上面这批带 id 的云端专属页） */
const DESKTOP_ZERO_CLOUD_ROUTES = [...CLEAN_ROUTES, ...CLOUD_ONLY_ROUTES.map(([r]) => r)];

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
  test("根路径默认进入本地剧本列表", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/?storage=memory", { waitUntil: "load" });

    await expect(page).toHaveURL(/\/studio\/projects(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "剧本" })).toBeVisible();
    expect(hits, `桌面首屏访问了云 API：${hits.join(", ")}`).toEqual([]);
  });

  for (const route of DESKTOP_ZERO_CLOUD_ROUTES) {
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
    for (const route of [...DESKTOP_ZERO_CLOUD_ROUTES, ...Object.keys(KNOWN_DEBT_ROUTES)]) {
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
test.describe("E37 账户菜单里的云端入口在桌面不给", () => {
  test("浏览器态两个入口都在，桌面态只留账户设置", async ({ page }) => {
    /*
     * 「我的主页」在桌面是死入口：profile 恒 null → href 落成 `/author/`（空 id），
     * 目标页又整页要协作服务。同文件的「发现」与 GlobalSearch 早就用同一个约定挡了，
     * 这两条漏了。两半都测，桌面那一半先断「账户设置」可见——菜单没渲染也会得到 count 0，
     * 那是假绿（E35 刚栽过一次）。
     */
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.goto("/studio/projects", { waitUntil: "load" });
    await page.getByRole("button", { name: "账户菜单" }).click();
    await expect(page.getByRole("link", { name: "账户设置" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("link", { name: "我的主页" })).toBeVisible({ timeout: 8000 });

    hits.length = 0; // 浏览器那一半本来就要发 session 请求
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "账户菜单" }).click();
    await expect(page.getByRole("link", { name: "账户设置" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("link", { name: "我的主页" })).toHaveCount(0);
    expect(hits, `桌面态这一页发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E36 账户设置在桌面是显式缺席，而不是六个必然失败的按钮", () => {
  test("浏览器态有这些动作，桌面态只剩本地身份与一句说明", async ({ page }) => {
    /*
     * 这一页六个动作（头像、昵称、邮箱绑定、邮箱恢复、导出数据、注销账户）全部直连 userApi。
     * 桌面离线态它们只会把 catch 吞成「操作失败」——E14 那条只能证明"装载零请求"，
     * 证明不了"没有可点的死入口"，所以这条两半都测：
     * 浏览器那一半是正控（防的就是"整页被删掉也照样绿"），桌面那一半断缺席说明在位、动作按钮为 0。
     */
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.goto("/profile", { waitUntil: "load" });
    await expect(page.getByRole("button", { name: "保存昵称" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "导出我的数据" })).toBeVisible({ timeout: 8000 });

    hits.length = 0; // 浏览器那一半本来就该发云端请求，不清零就是把测试自己的账算到桌面上
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/profile?storage=memory", { waitUntil: "load" });
    await expect(page.getByText("当前身份：")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("账户设置需要协作服务")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "保存昵称" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "导出我的数据" })).toHaveCount(0);
    expect(hits, `桌面态这一页发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E35 Discover 浏览入口在桌面态全站消失", () => {
  test("同一个组件：浏览器里有，道具页与场景页在桌面都没有", async ({ page }) => {
    /*
     * 这条守的是"入口与目标同生共死"：/discover 在桌面是显式缺席的（DiscoverPage 的
     * isLocalOnlyDeployment 分支），可 ItemsPage / SceneAssetsPage 仍挂着通向它的链接，
     * 而 ProjectListPage 挡了——同一个组件三种做法，就是漏。闸门收进组件之后这里才测得动：
     * 两半都要测（只测桌面那一半，在整块被删掉的改动下也会绿）。
     */
    await page.goto("/studio/items", { waitUntil: "load" });
    await expect(page.getByText("去 Discover 浏览更多")).toBeVisible({ timeout: 8000 });
    await page.goto("/studio/scenes", { waitUntil: "load" });
    await expect(page.getByText("去 Discover 浏览更多")).toBeVisible({ timeout: 8000 });

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/items?storage=memory", { waitUntil: "load" });
    // 先证明这一页真的渲染到了工具条（否则 toHaveCount(0) 会因为页面没出来而假绿——实测如此）
    await expect(page.getByRole("button", { name: "新建道具" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("去 Discover 浏览更多")).toHaveCount(0);
    await page.goto("/studio/scenes?storage=memory", { waitUntil: "load" });
    await expect(page.getByRole("button", { name: "新建场景" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("去 Discover 浏览更多")).toHaveCount(0);
  });
});

test.describe("E44 云端专属详情路由在桌面给的是缺席说明，不是一次注定失败的请求", () => {
  /*
   * E35 测的是**入口**（工具条上那个「去 Discover 浏览更多」在桌面消失），
   * 这一条测的是**目标**：URL 直接进来时那 6 页在桌面不发云端请求，并且屏幕上有一句为什么。
   * 正证是那句提示语——它只存在于 `isLocalOnlyDeployment()` 那一条分支里，
   * 所以"把闸门整块删掉"这种改动会红在这里，而不是靠零请求那一条兜（零请求在页面根本没渲染时也会绿）。
   */
  for (const [route, feature] of CLOUD_ONLY_ROUTES) {
    test(`${route}：零 /api/v1 且写着「${feature}需要协作服务」`, async ({ page }) => {
      const hits = await visitInDesktopMode(page, route);
      await expect(page.getByText(`${feature}需要协作服务`)).toBeVisible({ timeout: 8000 });
      expect(hits, `桌面态这一页仍发了云端请求：${hits.join(", ")}`).toEqual([]);
    });
  }
});

test.describe("E47 桌面账户设置不许再承诺它做不到的事", () => {
  /*
   * 桌面分支的按钮早就撤了（E34 那半），但**页头文案还在写「管理昵称、头像、邮箱与数据」**，
   * 而它下面一句就是「账户设置需要协作服务」——自己跟自己矛盾。
   * ADR-029 第 6 条与 `deployment.ts` 的约定要的是"缺席说出来、且不演成还有"，
   * 所以文案也在判据范围内：桌面不给那句承诺，浏览器那一半必须还给（两半成对，
   * 只测桌面那一半的话，"把两句都删掉"这种改动会绿）。
   */
  const PROMISE = "管理昵称、头像、邮箱与数据";

  test("浏览器态：那句承诺在（它是真话）", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "load" });
    await expect(page.getByText(PROMISE)).toBeVisible({ timeout: 8000 });
  });

  test("桌面态：不给那句承诺，只给本机身份与缺席说明", async ({ page }) => {
    const hits = await visitInDesktopMode(page, "/profile?storage=memory");
    await expect(page.getByText("当前身份：")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("账户设置需要协作服务")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(PROMISE)).toHaveCount(0);
    expect(hits, `桌面态这一页仍发了云端请求：${hits.join(", ")}`).toEqual([]);
  });
});

test.describe("E56 桌面账户页不给这三条按名从未被守过的动作入口", () => {
  /*
   * 来历：`cloud:callmap` 第十二段有 12 条「静态说装载即发、桌面普查却没见过」的端点。
   * 2026-10-09 逐条取证后**全部判为 A 类**（桌面被挡住；静态把 `useMutation`/`const report =` 这类定义形态判高了），
   * 其中 `/users/resolve` 与 `/users/account` 挡住它们的只有 `ProfilePage` 的页面级早退一层。
   *
   * 与既有用例的分工（不重复占面）：E36 已按名守住「保存昵称」与「导出我的数据」两条，E47 守文案，
   * E56 补**E36 没点过名的三条动作**——绑定邮箱、邮箱恢复、注销账号。
   * 注销与邮箱恢复是这页上唯二"点了不可逆"的动作，此前只有整页早退挡着、没有任何按名判据。
   *
   * 变异证据（2026-10-09，把 `ProfilePage` 那句早退改成 `false && …`）：
   * **E36 + E47 + E56 三条一起红**（`3 failed / 61 passed`），还原 byte-identical；
   * 也就是说这一页的"没有可点死入口"由三条判据合守，不是只靠早退那一行。
   */
  const ACTIONS = ["绑定到当前账号", "用邮箱恢复旧账号", "注销账号"];

  test("浏览器态：这三条真在页面上（正对照，证明不是选择器写错）", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "load" });
    for (const name of ACTIONS) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible({
        timeout: 8000,
      });
    }
  });

  test("桌面态：一个都不给，且缺席被明说出来，全程零 /api/v1", async ({ page }) => {
    const hits = await visitInDesktopMode(page, "/profile?storage=memory");
    // 正证：这一页确实渲染了（不是白屏或跳走），缺席才有意义
    await expect(page.getByText("当前身份：")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("账户设置需要协作服务")).toBeVisible({ timeout: 8000 });
    for (const name of ACTIONS) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    expect(hits, `桌面态账户页仍发了云端请求：${hits.join(", ")}`).toEqual([]);
  });
});

test.describe("E57 发现页四个子视图参数在桌面都被同一句早退覆盖", () => {
  /*
   * 来历：`cloud:callmap` 第十二段那条 `/tags/`——它的消费者 `DiscoverCharactersTab`
   * 只在 `?tab=characters` 这一支挂载，而加载面普查**一律用默认参数访问路由**，
   * 所以"桌面没见过这条"当时有两种解释：早退真的覆盖所有子视图，或者普查根本看不见那一支。
   * `DiscoverPage.tsx:49` 那句 `if (isLocalOnlyDeployment()) return …` 在四个 tab 分支**之前**，
   * 结构上确实全覆盖——但这是一句读代码得到的判断，本条把它钉成界面级证据。
   *
   * 正对照必须逐 tab 做：浏览器态那一条断"这一支的搜索框占位符就是这一支的话"，
   * 否则桌面那一半会被"整页空白也照样零请求"这种改动悄悄满足。
   */
  const TABS = [
    { key: "projects", placeholder: "搜索作品标题或描述..." },
    { key: "characters", placeholder: "搜索角色名称或概括..." },
    { key: "items", placeholder: "搜索道具名称..." },
    { key: "scenes", placeholder: "搜索场景名称..." },
  ];

  test("浏览器态：URL 参数真能选出四个不同子视图（正对照）", async ({ page }) => {
    for (const tab of TABS) {
      await page.goto(`/discover?tab=${tab.key}`, { waitUntil: "load" });
      await expect(page.getByPlaceholder(tab.placeholder)).toBeVisible({ timeout: 8000 });
    }
  });

  test("桌面态：四个参数一个都不给内容，只给那句缺席说明，全程零 /api/v1", async ({ page }) => {
    for (const tab of TABS) {
      const hits = await visitInDesktopMode(
        page,
        `/discover?tab=${tab.key}&storage=memory`,
      );
      await expect(page.getByText("发现页需要协作服务")).toBeVisible({ timeout: 8000 });
      for (const other of TABS) {
        await expect(page.getByPlaceholder(other.placeholder)).toHaveCount(0);
      }
      expect(hits, `桌面态发现页 ${tab.key} 这一支发了云端请求：${hits.join(", ")}`).toEqual([]);
    }
  });
});

test.describe("E45 随包的用户文档在桌面读得出来（命中的那一支）", () => {
  /*
   * 加载面普查量的是**未命中支**（`?storage=memory` 不播种，参数路由一律查不到），
   * 而文档正文页是这套系统里**唯一一条"本地真有内容"的读路径**：
   * `docRegistry.ts` 用 eager 的 `import.meta.glob` 把 `docs/user` 下的 markdown 全文打进入口，
   * 所以桌面离线时它应当真读得到——这句以前只靠"文档确实在仓库里"这种理由相信，今天钉成行为。
   * 两条一对：真 slug 要渲染出正文，假 slug 要给「未找到该文档页面」。
   * 少了后一条，"随便什么都渲染同一个壳"这种改动也会让正证绿。
   */
  test("打开一篇真文档：正文渲染出来且零 /api/v1", async ({ page }) => {
    const hits = await visitInDesktopMode(page, "/docs/desktop/desktop-and-axsp?storage=memory");
    await expect(page.getByText("桌面版目前没有的功能")).toBeVisible({ timeout: 8000 });
    expect(hits, `桌面读一篇随包文档却发了云端请求：${hits.join(", ")}`).toEqual([]);
  });

  test("不存在的 slug 明说找不到，而不是演成一篇空文档", async ({ page }) => {
    await visitInDesktopMode(page, "/docs/there-is-no-such-doc?storage=memory");
    await expect(page.getByText("未找到该文档页面")).toBeVisible({ timeout: 8000 });
  });
});

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
     * 「发送到 Nexus」缺席这一腿（挂在 E17 流程内，因为建好的工程只在同一文档内活着；**没有独立编号**）：
     * 编排台「项目」栏默认是收起的，直接断言「发送到 Nexus 不在」会空载成立，
     * 所以先展开、再用**同栏留下来的那个动作**证明这一栏真渲染了。
     * Nexus 收件箱是服务端本质（跨工程存在），桌面没有对应语义 → 不给入口，与 E18 同一口径。
     * 两半配对覆盖（浏览器态「应该在」+ 桌面态「不该有」）在下面的 E40 里，别按旧编号 E20 去 grep 用例名。
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
    await expect(page.getByText("已保存项目信息")).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await expect(page.getByText("桌面可建").first()).toBeVisible({ timeout: 8000 });
    await page.getByText("桌面可建").first().click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await page.getByRole("button", { name: "项目", exact: true }).click();
    await expect(page.getByPlaceholder("世界观设定…")).toHaveValue("方舟是一座会移动的城", { timeout: 8000 });

    /*
     * E23：编排台的舞台写侧（S13-2a 那条本地腿 `addProjectScene`）在桌面被点一次。
     * 用 Enter 提交而不是点「+」——角色/道具段也有同名按钮，取加号会撞严格模式；
     * 回读仍然换页再进，不在当前页签存在感（同一页里乐观渲染也能"看起来对"）。
     */
    /*
     * #65 的第七处：成就面板里「解锁条件」是裸 <label> + 原生 select。
     * 这一跳顺带把「成就写侧在桌面走本地库」也点了：整条链末尾的 hits 断言会盯着有没有 /api/v1。
     */
    await page.getByRole("button", { name: "成就" }).click();
    await page.getByText("项目成就：Beat 完成时按条件自动解锁，也可用于分支 gating。")
      .locator("xpath=following-sibling::button")
      .click();
    await expect(page.getByRole("combobox", { name: "解锁条件", exact: true })).toBeVisible({ timeout: 8000 });
    /*
     * 成就的写侧回读：面板里改标题是「输入即保存」（onChange 里 await updateAchievement 再 refresh），
     * 所以关掉再重开面板是一次真正的存储读（listAchievements 在挂载时跑）。
     * 判据取重开后那个输入框的 value，不取"刚才打过字"的那个 DOM。
     */
    await page.getByRole("textbox", { name: "标题", exact: true }).fill("离线路标");
    await page.getByRole("button", { name: "关闭" }).click();
    await page.getByRole("button", { name: "成就" }).click();
    await expect(page.getByRole("textbox", { name: "标题", exact: true })).toHaveValue("离线路标", { timeout: 8000 });
    await page.getByRole("button", { name: "关闭" }).click();

    await page.getByPlaceholder("新舞台…").fill("离线路台");
    await page.getByPlaceholder("新舞台…").press("Enter");
    await expect(page.getByText("离线路台").first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await page.getByText("桌面可建").first().click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await expect(page.getByText("离线路台").first()).toBeVisible({ timeout: 8000 });
    // 换页回读后，舞台段的计数抬头也该是 2（bootstrap 那台 + 新写这台）
    await expect(page.getByRole("button", { name: /舞台\s*2/ })).toBeVisible({ timeout: 8000 });

    /*
     * E24：剧本正文的写入回读。前面几条证的是"容器"（工程/舞台/元信息/角色/传记），
     * 而桌面创作真正的主数据是 Beat 里的台词与叙述——这条走的是 saveNarrative 那条腿。
     * 仍然换页再进才作数：编辑面板里的 textarea 值在本地 state 就能"看起来对"。
     */
    await page.getByText(/01\s*开始/).first().click();
    await page.getByPlaceholder("叙述性文字...").fill("离线路上的第一句");
    await page.getByRole("button", { name: "保存", exact: true }).first().click();
    await expect(page.getByText(/剧本已保存|已保存/).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await page.getByText("桌面可建").first().click();
    await page.getByText(/01\s*开始/).first().click();
    await expect(page.getByPlaceholder("叙述性文字...")).toHaveValue("离线路上的第一句", { timeout: 8000 });

    /*
     * #65 的另两处分派：条件/效果面板顶上的「触发条件」「完成效果」原本是裸 <label>——
     * 它下面是一整列行（每行各有 Select 与 Input），根本没有"那一个控件"可以指，
     * 所以正确的修法不是 htmlFor，而是把这一块命名成一组（role=group + aria-labelledby 指着标题）。
     * 判据取浏览器的计算结果：getByRole("group", name) 只在分组语义真的成立时才拿得到。
     */
    await page.getByRole("button", { name: "条件", exact: true }).click();
    await expect(page.getByRole("group", { name: "触发条件" })).toBeVisible({ timeout: 8000 });
    /*
     * 条件段里那台「模拟变量 → 出边预演」的预演器：两处原本都是裸 <label>。
     * 它下面不是"一个控件"而是一整列行，所以修法分两种——
     * 整块用 role=group 指到「模拟变量」这个标题，行内的三个控件各自带 aria-label（带序号，
     * 因为它们在 map 出来的行里，useId 不能进循环）；而「出边预演」本来就是小标题，
     * 于是改成 <h3>，不再假冒字段标签。
     */
    await page.getByRole("button", { name: "+ 添加变量" }).click();
    await expect(page.getByRole("group", { name: "模拟变量" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("combobox", { name: "模拟变量作用域 1", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("textbox", { name: "模拟变量键 1", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("textbox", { name: "模拟变量值 1", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("heading", { name: /出边预演/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "效果", exact: true }).click();
    await expect(page.getByRole("group", { name: "完成效果" })).toBeVisible({ timeout: 8000 });

    /*
     * E25：把角色加进工程（S13-2a 那条 `addRole` 腿，本地实现早就齐了、缺的是点击层证据）。
     * 全程走客户端路由不刷新文档——内存库随重载归零；角色也在同一文档里现造，
     * 于是这条一并把「建角色 → 挂进工程 → 计数抬头 → 换页回读」串起来。
     */
    await page.getByRole("link", { name: "角色" }).click();
    await page.getByRole("link", { name: "创建角色" }).first().click();
    await page.getByRole("button", { name: /英雄/ }).first().click();
    /*
     * 这一栏由 ToggleInput 渲染，此前只是"看着有个标签"：标签与控件没有编程关联。
     * #63 接上 aria-labelledby 后，三个分支都要被同一个名字找到，一个都不许漏：
     * 预设分支（SearchSelect 的主控件是 button）、自定义的 textarea 分支（概括）、
     * 自定义的 input 分支（人生主题）。只验一种就是偏袒一条腿——
     * 实测上一轮我以为自己验了 input 分支，其实那页根本没渲染它，变异跑了个空绿。
     *
     * 判据用 role + 可访问名，不用 toHaveAttribute：名字是浏览器算出来的，
     * 属性在但指错元素照样红；而 getByLabel 会退回 placeholder，抓不到腿被摘掉。
     * 开关按钮按「同一行的兄弟节点」定位（这一页有十几个同名按钮，取 first() 会点到别的栏）。
     * 三条都要 exact：getByRole 的名字默认子串匹配，而 placeholder 兜底名里就含着这些字
     * （"一句话概括角色 *" 含「概括」）——不 exact 时把 aria-labelledby 摘掉仍然绿（实测如此）。
     */
    const customToggleOf = (labelText: string) =>
      page
        .locator(`label:text-is("${labelText}")`)
        .locator("xpath=following-sibling::button");
    await expect(page.getByRole("button", { name: "概括", exact: true })).toBeVisible({ timeout: 8000 });
    await customToggleOf("概括").click();
    await expect(page.getByRole("textbox", { name: "概括", exact: true })).toBeVisible({ timeout: 8000 });
    await customToggleOf("人生主题").click();
    await expect(page.getByRole("textbox", { name: "人生主题", exact: true })).toBeVisible({ timeout: 8000 });
    await page.getByRole("textbox", { name: "概括", exact: true }).fill("背负过往、却仍在寻找答案");
    // #65 的第一处：「标签」那一栏原本是散装 <label> + Input，补上 htmlFor 才读得出字段名
    await expect(page.getByRole("textbox", { name: "标签", exact: true })).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("角色如何称呼").fill("凛");
    await page.getByRole("button", { name: "保存角色" }).click();
    await expect(page).toHaveURL(/\/studio\/characters\/mine$/, { timeout: 8000 });
    await page.getByRole("link", { name: "剧本" }).click();
    await page.getByText("桌面可建").first().click();
    await page.getByRole("button", { name: /角色\s*0/ }).first().click();
    await page.getByPlaceholder("搜索角色（公开 + 我的）...").fill("凛");
    await page.getByRole("button", { name: /凛/ }).first().click();
    await expect(page.getByRole("button", { name: /角色\s*1/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await page.getByText("桌面可建").first().click();
    await expect(page.getByRole("button", { name: /角色\s*1/ }).first()).toBeVisible({ timeout: 8000 });

    /*
     * E26：删舞台（`removeProjectScene`）。行的 × 只在 hover 时显形且全仓同名，
     * 所以按「含这一台标题的 div.group」把按钮限定到那一行，别用 nth 位置猜。
     * confirm 走 E17 已经注册的 dialog 自动接受。
     * 屏障是计数抬头回到 1，判据仍然是换页再进后那一台**取不到**——收起/乐观隐藏都骗得过前者。
     */
    const sceneRow = page.locator("div.group", {
      has: page.getByText("离线路台", { exact: true }),
    });
    await sceneRow.getByRole("button", { name: "×" }).click();
    await expect(page.getByRole("button", { name: /舞台\s*1/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await page.getByText("桌面可建").first().click();
    await expect(page.getByRole("button", { name: /舞台\s*1/ }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("离线路台")).toHaveCount(0);

    /*
     * E27：道具池造一件 → 挂进工程 → 移除引用（S13-2c 的 addAssetRef / removeAssetRef）。
     * 道具池在内存宿主里本来是空的，所以先在道具页造一件——这条顺带把「建道具」也验了。
     * 每段都以段落计数抬头为完成屏障（道具0 → 道具1 → 道具0），最后换页再进确认引用真的没了。
     */
    await page.getByRole("link", { name: "道具" }).click();
    await page.getByRole("button", { name: "新建道具" }).click();
    // getByLabel 在这一轮之前是取不到的：Input/Select/Textarea 的 <label> 没有 htmlFor，
    // 标签与控件没有编程关联（读屏也念不出字段名）。这里改用它，顺手当这条修复的行为判据。
    await page.getByLabel("名称", { exact: true }).fill("铜钥匙");
    // #65 的第四五处：这一栏的「机制标签 / 效果标签」是裸 label，接上 htmlFor 后读屏才念得出字段名
    await expect(page.getByRole("textbox", { name: "机制标签", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("textbox", { name: "效果标签", exact: true })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page.getByText("铜钥匙").first()).toBeVisible({ timeout: 8000 });
    /*
     * TagEditor 那两条标签也是纯视觉的：<label> 与 Input 分开渲染、没有编程关联（#63 的另一半）。
     * 只有进了道具详情的编辑态才看得到它，所以顺路点开一次；
     * 断的是"控件被那个名字指到"（exact，理由见 E17 里那段：placeholder 兜底名会骗过子串匹配）。
     */
    await page.getByRole("link", { name: /铜钥匙/ }).first().click();
    await page.getByRole("button", { name: "编辑" }).click();
    await expect(page.getByRole("textbox", { name: "机制标签", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("textbox", { name: "效果标签", exact: true })).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "道具列表" }).click();
    await page.getByRole("link", { name: "剧本" }).click();
    await page.getByText("桌面可建").first().click();
    await page.getByRole("button", { name: /道具\s*0/ }).first().click();
    await page.getByPlaceholder("搜索道具…").fill("铜钥匙");
    await page.getByRole("button", { name: /铜钥匙/ }).first().click();
    await expect(page.getByRole("button", { name: /道具\s*1/ })).toBeVisible({ timeout: 8000 });
    const itemRow = page.locator("div.group", { has: page.getByText("铜钥匙", { exact: true }) });
    await itemRow.getByRole("button", { name: "移除" }).click();
    await expect(page.getByRole("button", { name: /道具\s*0/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await page.getByText("桌面可建").first().click();
    await expect(page.getByRole("button", { name: /道具\s*0/ }).first()).toBeVisible({ timeout: 8000 });

    /*
     * #65 的第六处：场景页「新建场景」弹窗里的「标签」同样是裸 <label> + Input。
     * 下面接着真建一条并换页回读（写腿是否本地就在这条上量）。
     */
    await page.getByRole("link", { name: "场景" }).first().click();
    await page.getByRole("button", { name: "新建场景" }).click();
    await expect(page.getByRole("textbox", { name: "标签", exact: true })).toBeVisible({ timeout: 8000 });
    /*
     * 顺带把这条写腿点实：建一条场景 → 换页再进 → 还在。
     * 链尾的 `hits === []` 会盯着它有没有偷偷走云端（S13-2b 的桌面证据）。
     */
    await page.getByLabel("名称", { exact: true }).fill("离线路台口");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page.getByText("离线路台口").first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本" }).click();
    await page.getByRole("link", { name: "场景" }).first().click();
    await expect(page.getByText("离线路台口").first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("link", { name: "剧本" }).click();
    await page.getByText("桌面可建").first().click();

    await page.getByRole("link", { name: "试玩" }).first().click();
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 8000 });
    // 播出来的必须是我刚写进那一拍的字：这条一跳同时验收「写入 → 编译 → 播出」整链
    await expect(page.getByText("离线路上的第一句")).toBeVisible({ timeout: 8000 });
    // 界面上不该出现源码注释：JSX 子位置裸写块注释会被当成文本节点渲染出来（我踩过，判据钉在这里）
    await expect(page.getByText(/\/\*|\*\//)).toHaveCount(0);

    /*
     * E28：自动存档在桌面这条腿（#64）。播放进度走分派口 playerSaves.writeSave，
     * 此前只在契约用例里成立过，没被点过一次。
     *
     * 自动存档有 600ms 防抖，而防抖窗口内的"等一会儿再读"就是自己造 flake。这里把
     * 「离开播放器 → 再进来」当轮询的一步：再进来时播放器会去读**活动存档**，读到就换
     * 「继续游玩」那一屏、不开播。量的是存储回读而不是本页 state，所以屏障与判据是同一件事；
     * 写入没落库时，这一屏永远不出现。
     *
     * 每一步都要 waitFor 而不是立刻 count()：进场本身是异步的（离线上架 → codex → getSave），
     * 读到了还得等它渲染。直接问 count 会被这条骗到——实测连轮三轮都是 0，
     * 而旁路日志证明存档早就读回来了（status=active / beat=node-start）。
     */
    await expect
      .poll(
        async () => {
          await page.goBack({ waitUntil: "load" });
          await page.getByRole("link", { name: "试玩" }).first().click();
          return page
            .getByRole("button", { name: "继续游玩" })
            .waitFor({ state: "visible", timeout: 6000 })
            .then(() => 1)
            .catch(() => 0);
        },
        { timeout: 30000, intervals: [500] },
      )
      .toBe(1);
    // 续玩提示上的摘要就是刚写进那一拍的字：存下来的不是空槽，也不是别的工程
    await expect(page.getByText("离线路上的第一句")).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "从头开始" }).click();

    /*
     * E33：手动存档槽位（slot 1）的写入 / 回读 / 删除在桌面走本地分派口。
     * E28 只覆盖了自动存档那一格；手动槽位走同一批函数但 slot≠0，删除是另一条腿。
     * 屏障不由我定时长：manualSave 等 writeSave 返回 ok 才关面板，重开面板会再走一次
     * listSaves——所以「回读」量的是存储而不是本页 state；删除后面板自己 refreshSaveSlots。
     * 定位器踩过一次：按 class 限定卡片（div.relative.overflow-hidden）会捞到外层容器，
     * 结果点在 HUD 的「创作者」按钮上等稳定性等到超时——改用槽位自己的可访问名。
     */
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "存档" }).click();
    await page.getByRole("button", { name: /存档 1/ }).first().click();
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "读档" }).click();
    const slot1 = page.getByRole("button", { name: /存档 1/ }).first();
    await expect(slot1).toContainText("离线路上的第一句", { timeout: 8000 });
    await page.getByRole("button", { name: "删除存档" }).click();
    await expect(slot1).toContainText("— 空槽 —", { timeout: 8000 });
    await page.getByRole("button", { name: "关闭" }).click();

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
test.describe("E32 桌面态：结构工作台的连线面板有可读分组名", () => {
  /*
   * #65 的第九处收尾。「分支标签」是章节标题（它下面的 Input 自带 label），
   * 所以修法不是 htmlFor 而是命名分组；面板只有选中一条连线才出现，
   * 而剪辑/剧本两个模式都把 selectedEdge 硬写成 null——必须切到「结构」模式。
   */
  test("建工程 → 切「结构」→ 点一条边 → 连线面板的分组名取到，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("结构工作台");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    await page.getByRole("button", { name: "结构" }).first().click();
    await page.locator(".react-flow__edge").first().click({ force: true });
    await expect(page.getByRole("group", { name: "分支标签" })).toBeVisible({ timeout: 8000 });
    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E31 桌面态：演出层的「表情」字段有可读名字", () => {
  /*
   * #65 的第十处。不并进 E17：那条链末尾要播正文，给同一拍加演出指令会改变演出结果；
   * 独立用例自己建一个工程，判据只取"控件被这个名字指到"。
   * 「表情」的 id 用 `expression-${i}` 而不是 useId——它在 map 出来的行里，钩子不能进循环。
   */
  test("建工程 → 演出段加一条「立绘进场」→ 表情按名字取到，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("演出层字段");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    await page.getByRole("button", { name: "演出" }).click();
    await page.getByRole("button", { name: "+ 立绘进场" }).click();
    await expect(page.getByRole("textbox", { name: "表情", exact: true })).toBeVisible({ timeout: 8000 });
    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E38 桌面态：分支选项组与控件有可读名称", () => {
  test("新建 choice 后可按组名、选项名与目标名定位", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("分支选项无障碍");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    await page.getByRole("button", { name: "演出" }).click();
    await page.getByRole("button", { name: "+ 分支" }).click();
    await expect(page.getByText("分支选项", { exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "分支选项" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "选项 1 文本" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "选项 1 跳转目标" })).toBeVisible();
    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E30 桌面态：建剧本页与轨迹层的字段有可读名字", () => {
  /*
   * 这两处不在 E17 那条链上：剧本列表的「新建剧本」是内联快速创建，
   * ProjectCreatePage（/studio/projects/new）与角色编辑器的「轨迹」层各有各的入口。
   * 「主题标签」「关键事件」原本是裸 <label> + Input，读屏只念得出 placeholder。
   */
  test("两个手搓标签接上编程关联后，控件按名字取到", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects/new?storage=memory", { waitUntil: "load" });
    await expect(page.evaluate(() => "__TAURI_INTERNALS__" in window)).resolves.toBe(true);
    await expect(page.getByRole("textbox", { name: "主题标签", exact: true })).toBeVisible({ timeout: 8000 });

    await page.goto("/studio/characters/new?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "轨迹" }).first().click();
    await expect(page.getByRole("textbox", { name: "关键事件", exact: true })).toBeVisible({ timeout: 8000 });
    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

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

test.describe("E39 桌面态：Writer 轨保存的两个同名桥段不塌成一个节点", () => {
  /*
   * #69 的另一半在主通路上：saveWriter 走 axsToSyncPayload → parseAxsToPlan，而不是草稿事务 axs.import。
   * 单元层已钉住契约（两侧各一条 + 一条配对判据），这条要的是界面级证据：
   * 在剧本轨写两个同名桥段、保存、**换页再进**，两个桥段都还在。
   * 塌陷在界面上的表现是「重新投影出的 AXS 只剩一个 `# 开场`」——所以判据读的是重新加载后的文本，
   * 不是刚才那份 state（state 里 textarea 的值再对也没被存储证过）。
   */
  test("先存一个桥段、改稿再加一个同名桥段 → 换页再进仍是两个，全程零 /api/v1", async ({
    page,
  }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("同名桥段不塌");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    // SegmentedControl 渲染的是 <button role="tab">：按 ARIA 角色定位，不是按 button
    const enterWriter = async () => {
      const tab = page.getByRole("tab", { name: "剧本", exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
      await expect(ed).toBeVisible({ timeout: 8000 });
      return ed;
    };
    const replaceSource = async (text: string) => {
      const ed = await enterWriter();
      await ed.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.insertText(text);
    };
    // 保存后走 SPA 路由换页再进（E24 那条链的同一做法）。
    // 不能整页 goto——`?storage=memory` 是模块态，一次重载就把这份工程清空（实测过：回读到空白编辑器）。
    const saveAndReopen = async () => {
      const saveButton = page.getByRole("button", { name: "保存剧本" });
      await saveButton.click();
      // 完成屏障：按钮从「保存中...」渲染回「保存剧本」且可点（正向屏障，不用缺席式判据）
      await expect(saveButton).toBeEnabled({ timeout: 15_000 });
      await page.getByRole("link", { name: "剧本列表" }).click();
      await expect(page.getByRole("button", { name: "新建剧本" })).toBeVisible({
        timeout: 8000,
      });
      await page.getByText("同名桥段不塌").first().click();
    };

    // 第一轮：先存下**一个**叫「开场」的桥段——塌陷要发生在「工程里已有同名节点」的时候，
    // 新建工程直接写两个同名桥段是够不到那条分支的（第一版判据就是这么假绿的）。
    await replaceSource("# 开场\n旁白：第一处开场。\n");
    await saveAndReopen();

    // 第二轮：改稿，在同一个剧本里再加一个也叫「开场」的桥段
    await replaceSource("# 开场\n旁白：第一处开场。\n\n# 开场\n旁白：第二处开场。\n");
    await saveAndReopen();

    const ed = await enterWriter();
    const text = await ed.innerText();
    // 塌陷的界面表现是「只剩一个 # 开场」；这里要同时看到两个标题与两句话
    expect(text.split("# 开场").length - 1).toBe(2);
    expect(text).toContain("第一处开场。");
    expect(text).toContain("第二处开场。");

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E40 「发送到 Nexus」入口的两半各有一条断言", () => {
  /*
   * 交接文档 §3 里 S13-2d 那条半开项：桌面侧「不该有」早就断过（挂在 E17 流程内，无独立编号），
   * 但**浏览器侧「应该有」一直没断言**——于是「把 NexusSendAction 整块删掉」这种改法
   * 只会让桌面那一半继续绿（count 0 对"根本没渲染"同样成立，E35 栽过一次）。
   * 这条按 E35/E36/E37 的两半写法补齐：浏览器态两个动作都在，桌面态留一个、挡一个。
   */
  const PROJECT = "协作态留入口";

  test("浏览器态能看到、桌面态不给入口", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    // 浏览器那一半：走真后端（这一半本来就要发云端请求，所以不清零、也不断零）
    await page.goto("/studio/projects", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill(PROJECT);
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 15_000 });
    await page.getByRole("button", { name: "项目", exact: true }).click();
    // 同栏的正控先证明这一栏真渲染了
    await expect(page.getByRole("button", { name: "导出 Markdown" })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("button", { name: "发送到 Nexus" })).toBeVisible({
      timeout: 8000,
    });

    // 桌面那一半：同一个入口必须不在，而同栏另一个动作在（防"整栏没渲染也绿"）
    hits.length = 0;
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill(`${PROJECT}本地`);
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await page.getByRole("button", { name: "项目", exact: true }).click();
    await expect(page.getByRole("button", { name: "导出 Markdown" })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("button", { name: "发送到 Nexus" })).toHaveCount(0);
    expect(hits, `桌面那一半发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E41 本机模型配置入口（S13-4a）在两态各是什么形状", () => {
  /*
   * 桌面侧的本机模型配置由 `e2e/llm-endpoint.spec.ts` 的 **E16** 覆盖（四条：徽标文案、填端点→保存→
   * 刷新回读、清除、全程零 /api/v1）——我一开始只 grep 了本文件就断言"没人测"，被变异当场证伪。
   * 这条补的是**没被覆盖的那一半**：浏览器态它必须是**只读徽标、没有配置按钮**。
   * 少了这一半，「把桌面那一支整个删掉」只会让 E16 红（那是发现的另一件事），
   * 而"浏览器态不该出现配置入口"这件事此前无人看着。
   */
  test("浏览器态是只读徽标、没有配置按钮；桌面态点了真能打开配置", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.goto("/studio/characters/new", { waitUntil: "load" });
    await expect(page.getByText(/^AI · /)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /^AI · / })).toHaveCount(0);

    hits.length = 0; // 浏览器那一半本来就要问健康端点
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/characters/new?storage=memory", { waitUntil: "load" });
    const badgeButton = page.getByRole("button", { name: /^AI · / });
    await expect(badgeButton).toBeVisible({ timeout: 8000 });
    await badgeButton.click();
    await expect(page.getByText("本机模型")).toBeVisible({ timeout: 8000 });
    // 名字匹配默认是子串：「保存」会连带命中页面上的「保存角色」，必须 exact
    await expect(page.getByRole("button", { name: "保存", exact: true })).toBeVisible({
      timeout: 8000,
    });
    // 判据到"点了徽标真能打开本机模型配置"为止就够；不点关闭——这一页有两个「取消」，
    // 用 exact 也仍然歧义，而为收尾去加一层容器定位是给判据加脆性，不是给它加信息。
    await page.keyboard.press("Escape");

    expect(hits, `桌面态这一页发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

test.describe("E42 侧栏「概览」项与创作概览页的两半", () => {
  /*
   * 14 个闸门点逐个定性后剩下的两处没被看的：`StudioNavContent` 的 OVERVIEW_ITEM
   * （浏览器有、桌面没有）与 `CreatorDashboardPage` 的桌面缺席分支。
   * 两条都是"缺席"的一面有人看、"在场"的那一面没人看，或反过来——
   * 任一侧被整块删掉都不会红（E40/E41 同一类）。这条按两半写法一次补齐。
   */
  test("浏览器态侧栏有「概览」；桌面态没有，且 URL 直达只给一句缺席说明", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.goto("/studio/projects", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: "概览", exact: true })).toBeVisible({
      timeout: 8000,
    });

    hits.length = 0; // 浏览器态这一页本来就要拉云端列表
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    // 正控：侧栏真渲染了，否则 count 0 是空载
    await expect(page.getByRole("link", { name: "剧本", exact: true }).first()).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("link", { name: "概览", exact: true })).toHaveCount(0);

    await page.goto("/studio/dashboard?storage=memory", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "创作概览" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("创作数据面板需要协作服务")).toBeVisible({ timeout: 8000 });
    // 「加载数据中…」是浏览器态的取数分支；桌面若在说明之外还走到它，就是在等一个不存在的后端
    await expect(page.getByText("加载数据中")).toHaveCount(0);
    expect(hits, `桌面态这两页发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E48 桌面不给「模板」开关，于是 Fork 那条云路径在界面上走不到。
 *
 * 动因：`cloud:callmap` 把 `projectApi.fork @ ProjectListPage.tsx:91` 列进「待人工复核」，
 * 而 `ProjectListPage` 恰好是普查里那条**正对照宿主**（"宿主不早退 ⇒ 桌面真会打出"）。
 * 读代码得到的是第三种情形，前两种都不是：
 * ① 页面没早退（它是本地页，桌面正常渲染工程列表）；
 * ② 调用点也没有行级闸门（`handleFork` 直接 `await projectApi.fork(...)`）；
 * ③ 真正保护它的是**一个被藏起来的控件**：`tab` 只由「我的 / 模板」那把开关改（`SegmentedControl`），
 *    而整个工具条包在 `{!localOnly && (` 里，桌面初值停在 `"my"`，
 *    带 Fork 按钮的模板卡片整支（`tab === "template"` 那个三元）于是永不渲染。
 * 这条不变量今天只活在结构里、没有任何判据看着：把开关搬出守卫、或给 `tab` 加个 URL 初值，
 * 桌面上就多出「以此创建」和一个注定失败的 POST——正是 ADR-029 规则 6 不许留的残口。
 * 所以钉在点击层，两半各一条：**在场的那一半也有人看着**，删掉整块守卫不会静默通过。
 */
test.describe("E48 桌面的工程列表不给 Fork 入口", () => {
  test("浏览器态有「模板」开关；桌面态没有开关也没有「以此创建」，且零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    const onBrowserRequest = (req: { url: () => string }) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    };
    page.on("request", onBrowserRequest);

    await page.goto("/studio/projects", { waitUntil: "load" });
    await expect(page.getByRole("tab", { name: "模板", exact: true })).toBeVisible({ timeout: 8000 });

    /*
     * 浏览器那一页**本来就要拉云端列表**，所以它的请求不是判据对象。
     * 这里必须把监听器整个摘掉而不是 `hits.length = 0`：那一页的迟到请求
     * （React Query 的重试、渲染之后才发的副作用）会落进桌面那一臂的计数窗口里，
     * 把"上一页没做完"读成"这一页发了云端请求"——2026-10-09 全量跑里 E48 就这么红过一次，
     * 单跑两次都是绿的。摘掉之后两臂各数各的，这条判据不再依赖跑序。
     */
    page.off("request", onBrowserRequest);

    await page.addInitScript(DESKTOP_MARKER_INIT);
    const deskHits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) deskHits.push(path);
    });
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    // 正控：侧栏真渲染了，否则下面那两个 count 0 是空载
    await expect(page.getByRole("link", { name: "剧本", exact: true }).first()).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("tab", { name: "模板", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "我的", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "以此创建" })).toHaveCount(0);

    /*
     * 正控（这条判据自己的）：桌面这一臂的监听器必须真的在记账。
     * 少了它，`toEqual([])` 有可能绿在"没人挂监听器"上——那与"桌面没发请求"是两回事。
     * 这里发一条**不存在的** GET 哨兵（vite 上必为 404，无副作用），只为了让它被记到。
     */
    await page.evaluate(() => fetch("/api/v1/e48-sentinel"));
    expect(deskHits, "桌面臂的监听器没记到哨兵 ⇒ 这条判据是空转的").toContain("/api/v1/e48-sentinel");

    const branch = await page.evaluate(
      () =>
        (window as unknown as Record<string, string>).__AXIFORGE_PROVIDER_BRANCH__ ?? "未登记",
    );
    // 这条正控把"零请求"与"其实根本没挂上本地库"分开了：后者会让上面那条断言空载通过
    expect(branch, "桌面臂这一页的 Provider 必须走本地库支").toBe("memory");

    const real = deskHits.filter((h) => h !== "/api/v1/e48-sentinel");
    expect(
      real,
      `桌面态工程列表发了云端请求：${[...new Set(real)].join(", ")}；这一页的 Provider 走的是「${branch}」支`,
    ).toEqual([]);
  });
});

/*
 * E49 桌面角色详情页的工具条只给本机用得着的那三件。
 *
 * 动因：`versionApi.get` / `versionApi.rollback` 挂在 `VersionPanel` 里，而那个面板的**列表查询**早就有
 * `enabled: !isLocalOnlyDeployment()`（注释还写明"Modal 常驻挂载，入口按钮上的 !localOnly 拦不住 hook"）——
 * 可是这两条调用点本身不在任何闸门的作用域里，`cloud:callmap` 只能把它们列进「待人工复核」。
 * 真正挡着它们的是**上一级的入口按钮**：详情页右上工具条里「×× 个版本」那颗在 `{!localOnly && (` 里
 * （`Fork`、`删除` 同理）。面板在桌面根本打不开，于是这两条云调用在界面上不可达。
 *
 * 这条"藏入口即闸门"的依赖同样是承重的，而普查量不到它：`?storage=memory` 的详情页必须是**真建出来的角色**
 * 才走命中支（未命中支渲染的是「角色不存在」，那时候什么按钮都不在，count 0 是空的）。
 * 所以这里先按 E21 的路子建一个角色再进详情页，并且**拿同一条工具条里没被守卫的那两件当正控**
 * （`编辑` 链接、`分享` 按钮）——工具条真渲染了，缺席那三条才是"被藏了"而不是"没加载"。
 */
test.describe("E49 桌面角色详情页不给「关系」栏与版本/Fork/删除入口", () => {
  test("建一个真角色进详情页：编辑、分享与传记在，版本/Fork/删除/关系不在，且零 /api/v1", async ({ page }) => {
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

    await page.getByRole("button", { name: /英雄/ }).first().click();
    await page.getByPlaceholder("角色如何称呼").fill("砚");
    await page.getByRole("button", { name: "保存角色" }).click();
    await expect(page).toHaveURL(/\/studio\/characters\/mine$/, { timeout: 8000 });
    await page.getByText("砚").first().click();
    await expect(page).toHaveURL(/\/studio\/characters\/[^/]+$/, { timeout: 8000 });

    // 正控：右上工具条真渲染了（否则下面三个 count 0 只是"页面还没加载完"）
    await expect(page.getByRole("link", { name: "编辑", exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "分享", exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: /个版本/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Fork", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "删除", exact: true })).toHaveCount(0);

    /*
     * 同一页再要一眼「关系」这一栏：`relationApi.*` 四条调用点的闸门是 `visibleCharacterTabs(localOnly)`
     * 的 `cloudOnly` 白名单，而那份白名单今天只有单测（`characterTabs.test.ts`）看着。
     * 正控用同一排里在场的「传记」——它在 S13-1 就本地化过了，桌面必须给；
     * 「传记」在 ⇒ 这一排真渲染了，「关系」那个 count 0 才是"被摘掉了一栏"而不是"标签条没加载"。
     */
    await expect(page.getByRole("button", { name: "传记", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "关系", exact: true })).toHaveCount(0);

    expect(crashes, `桌面角色详情页抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `桌面角色详情页发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E50 桌面顶栏不给「全局搜索」——这条云调用唯一的闸门在**调用者**那一侧。
 *
 * `searchApi.global @ apps/web/src/shared/components/GlobalSearch.tsx` 自己没有任何判定：
 * `GlobalSearch` 组件里读不到 `isLocalOnlyDeployment()`，挡着它的是挂载点
 * `apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`
 * （`showSearch` 由 `StudioLayout.tsx:33` 打开，所以 /studio 每一页本来都带搜索框）。
 * `cloud:callmap` 的限度里明写"消费者级条件渲染不认"⇒ 这条会永远留在「桌面真会打出 20」那个保守上界里下不来。
 * 所以要在界面级给它一眼：**浏览器态搜索框在**（闸门是被守卫掉的，不是组件不存在）、
 * **桌面态搜索框不在**，且用同一条侧栏上没被守卫的 `剧本` 导航项证明壳真渲染了。
 */
test.describe("E50 桌面 studio 顶栏不给全局搜索", () => {
  test("浏览器态有搜索框；桌面态没有，且零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.goto("/studio/projects", { waitUntil: "load" });
    await expect(page.getByPlaceholder("全局搜索...")).toBeVisible({ timeout: 8000 });

    hits.length = 0; // 浏览器态这一页本来就要拉云端列表

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    // 正控：壳真渲染了（否则那个 count 0 只是页面还没出来）
    await expect(page.getByRole("link", { name: "剧本", exact: true }).first()).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByPlaceholder("全局搜索...")).toHaveCount(0);

    expect(hits, `桌面态 studio 发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E51 玩一会之后，本地库里真的多出一条自动存档（读档面板量得到）。
 *
 * 动因：任务 #64 —— 玩家存档在**界面级**一条判据都没有。`shared/storage/playerSaves.test.ts` 那几条量的是
 * provider 层（清单/读写/覆写同槽），挡不住"页面没触发自动存档 / 写错了槽 / 分派口没接上"这一类。
 *
 * 三个取舍写在案上，免得下次被人当疏漏：
 * ① **不注入桌面标记**。这条流要先用 `.axsp` 导入拿到一个真能玩的工程，而注入标记后文件选择器走
 *    `@tauri-apps/plugin-dialog`，chromium 里开不出来（E43 量过）。所以本条不断言"零 /api/v1"
 *    ——页面级消费者（会话/健康检查）本来就要发；**它断言的是"存档这一条通路没发过 HTTP"**：
 *    出现任何 `/play/save` 就说明本地分派没接住，被回落到云端了。
 * ② **不用整页 reload 做"换页再进"**：内存宿主每次加载重建，reload 后槽必然全空，那是夹具行为不是产品行为。
 *    因此"落库了"改由同一个文档里读档面板的槽位计数来证。
 * ③ 判据写成 `toHaveCount(标签数 - 1)` 并给它 15s：**自动存档有 600ms 防抖，且依赖 effect 的 `view` 依赖**
 *    （打字机推进期间会重新计时），所以"什么时候落库"不是固定值。Playwright 的计数断言会重试到超时，
 *    正好把这段不确定留给它，而不是留给我猜的等待毫秒数。
 */
/*
 * 第六十一批的实测把它**先挂在这里不跑**，原因是量到一条还没归因的现象（不是判据写错）：
 * 从工程页点「试玩」之后 `page.url()` 已经是 `/play/proj-0001`，
 * 但 `body` 的 innerText 仍然是工程页那一套（顶栏 Axiforge/STUDIO/发现/文档、侧栏 工作室/概览/剧本/道具/场景/角色、
 * 面板里 结构·剧本·试玩 三个标签与「序列 BEATS 7」），HUD 那颗 `aria-label="菜单"` 始终不在 DOM 里；
 * 文本里既没有「加载失败」也没有「空格继续」——所以这不是 #61 那条已修的错报，是**路由换了 URL 而界面没换**。
 * 归因欠的是：这条在真浏览器手工点一次能不能复现（本会话没有壳、也不该拿 `pnpm e2e` 去写他本机 dev 库），
 * 以及它是播放器没挂载、还是挂载后被某个边界吞掉。**判据不写成绿的**：跳过比假绿诚实。
 *
 * **更正（同日 14:49 实测，把上面那条现象推翻了一半）**：临时诊断量到的是
 * `location.pathname="/play/proj-0001"`、`#root` 的唯一子元素 className **就是播放器外壳**
 * `min-h-screen bg-[#0a0a0f] text-white`（`playerShell=2`）、`a[href^="/studio"]` 数量 **0**、`BEATS` 字样 **不在**——
 * 也就是**导航是好的、工程页已经卸载**，之前那次读到的"界面还是工程页"是我在路由切换的当口读 `body` 读到的**旧快照**。
 * 真正挡着判据的是 `aria-label="菜单"` 那颗 **0 个**：HUD 要等播出起始态（`showStatePanel` 那条关屏）之后才进 DOM，
 * 而起始态那块面板的关闭键不是文字按钮，所以下一步该做的是**把"开播"这一下点成判据的一部分**，不是归因路由。
 *
 * **再更正（14:52 实测，两次都算数）**：等 `.bg-[#0a0a0f]` 外壳进 DOM、再对舞台 `(640,500)` 点一下之后，
 * `aria-label="菜单"` 仍然是 **0 个**（15s 内没出现过）。把 DOM 里"有名字的可点元素"整份列出来诊断，
 * 里面**既没有 HUD 那颗「菜单」，也没有 `PlayerStatePanel` 那颗文字「关闭」**——
 * 也就是说那一屏不是我此刻能命名的任何一种面板，**"起始态要怎么推开"这件事还没查清**（这是待查，不是结论）。
 * 之前我写过"它是个只有图标、没有名字的控件"，那句是从"命名清单里没有它"推出来的**过头话**，
 * 读了 `PlayerStatePanel.tsx` 的关闭键之后撤回：那颗是有文字「关闭」的。
 * ⇒ 本条保持 `skip`；下一步是先弄清 `/play/...` 首屏在等什么（一个真实的产品/测试问题），而不是急着把判据凑绿。
 */
test.describe("E51 试玩之后本地库里有自动存档（桌面态全程零云端请求）", () => {
  /*
   * 桌面主玩法的存档判据（任务 #64）。两处形状上的取舍写在案上，免得下次又当成疏漏：
   *
   * ① **不用 `.axsp` 导入来造工程**。导入那颗按钮在有桌面标记时走 `@tauri-apps/plugin-dialog`，
   *    chromium 里开不出选择器（E43 量过并为此刻意不注入标记）；而"播放器能开播"要的恰恰是那个标记
   *    ——本地取故事、且整条链零云端。两头在同一条用例里凑不到一次，所以改用
   *    **新建剧本 → 在剧本轨写两拍 AXS → 保存**（E39 的同一流程）造出一个真能玩的工程。
   * ② 判据读的是**读档面板里的槽位计数差**：`— 空槽 —` 的个数应恰好比槽位标签少一个（自动那一格被写进）。
   *    自标定，不硬写 `MAX_SAVE_SLOTS`；计数交给 `toHaveCount(…, { timeout })` 重试，因为自动存档是
   *    **600ms 防抖 + effect 依赖 `view`**（打字机推进期间会重新计时），落库时刻不是固定值。
   *
   * 起始态那一屏不给 HUD：14:53~15:00 的三次诊断实测 `aria-label="菜单"` 要等**演出被推开**之后才进 DOM
   * （我先前把它误读成"路由没换界面"，那条已在本文件与 §4 更正——路由是好的：`#root` 换了外壳、上一屏锚点归零）。
   */
  test("建两拍剧本 → 试玩 → 开播 → 读档面板里恰好自动那一格被写进，且全程零 /api/v1", async ({ page }) => {
    test.setTimeout(90_000); // 建剧本 + 写稿 + 保存 + 进播放器 + 两次采样，60s 默认预算不够（实测撞到过）
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("自动存档判据");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("# 开场\n旁白：第一处开场。\n\n# 第二拍\n旁白：第二处开场。\n");
    const saveButton = page.getByRole("button", { name: "保存剧本" });
    await saveButton.click();
    await expect(saveButton).toBeEnabled({ timeout: 15_000 });

    // 工程页右上那颗「试玩」与大纲面板那颗同名同 `to`（都是 routes.play(id)），两条入口等价，取 first
    await page.getByRole("link", { name: "试玩" }).first().click();
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });

    // 把演出推开那一下：起始态不给 HUD，推开之后系统菜单才进 DOM
    await page.keyboard.press("Space");
    const menuBtn = page.getByRole("button", { name: "菜单", exact: true });
    await expect(menuBtn, "推开起始态之后 HUD 的系统菜单仍没出现——/play 首屏这条判据就卡在这里").toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(1500);
    /*
     * 分清楚"没尝试写"与"试了但失败"：写档失败会亮 6s 的可见提示（`本地进度未能保存（…）`）。
     * 这里必须用 `count()`（不等待）再去取文本——上一版直接 `innerText()` 在元素不存在时会等满
     * 30s 动作超时，把整条用例的 60s 预算吃光，报出来是"浏览器已关闭"这种毫不相干的错。
     */
    const noticeLoc = page.getByText(/本地进度未能保存/);
    const notice = (await noticeLoc.count()) > 0 ? await noticeLoc.first().innerText() : "";

    await menuBtn.click();
    await page.getByRole("button", { name: "读档" }).click();
    const slotLabels = page.getByText(/^(自动存档|存档 \d+)$/);
    const emptySlots = page.getByText("— 空槽 —");
    await expect(slotLabels.first()).toBeVisible({ timeout: 8000 });
    const total = await slotLabels.count();
    expect(total, `读档面板该有多格，实际只数到 ${total} 个槽位标签`).toBeGreaterThanOrEqual(2);

    /*
     * 两次采样分清两种失败（第一次跑出来是"面板开着等 20s 也没少"，光那一句分不清是**没写**还是**面板不重取**）：
     * A = 面板一直开着等（读的是它第一次取到的清单）；B = 关掉再重开一次（逼它重新取清单）。
     */
    const emptyWhileOpen = await emptySlots.count();
    await page.keyboard.press("Escape");
    await menuBtn.click();
    await page.getByRole("button", { name: "读档" }).click();
    await expect(slotLabels.first()).toBeVisible({ timeout: 8000 });
    const emptyReopened = await emptySlots.count();
    expect(
      Math.min(emptyWhileOpen, emptyReopened),
      `自动存档没落库：槽位 ${total} 格，面板开着时空槽 ${emptyWhileOpen} 个、重开之后 ${emptyReopened} 个（两种都没少到 ${total - 1}）；` +
        `写档失败提示=${notice === "" ? "没亮过（说明根本没尝试写）" : notice}`,
    ).toBe(total - 1);

    expect(crashes, `试玩链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `试玩存档链路发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E52 打完故事之后，「继续游玩」那扇门要关上（结局那一下清的是自动槽）。
 *
 * E51 立起来之后剩下的另一半：`PlayerPage` 的自动存档 effect 在 `rtState.status === "ended"` 时走的不是写入而是
 * `clearSaveSlot`。这条承诺今天只有 provider 层的清槽函数被单测挡着，**界面上"打完了不会再让你续到中间"没人看过**。
 *
 * 传感器选的是**续玩提示屏**（`saveOffer` 那一支）而不是读档面板：结局屏自己不给读档入口
 * （只有 重新开始 / 分支回想 / 发现更多），而从结局屏「重新开始」会把槽位**重新写满**（第 0 拍的自动存档），
 * 于是"清空"在面板上根本读不出来。续玩提示屏读的是同一条 `loadSave` 通路，且它有"在/不在"两种可见形状。
 *
 * 两次进入之间用 `goBack()` 而不是 `goto`：`?storage=memory` 是模块态，整页重载等于把这份工程清空
 * （那将让"没有续玩提示"变成夹具行为而不是产品行为）。这个前提由第 4 步的正控守着——
 * 先证明"只推进一拍时确实会弹续玩提示"，再证明"打完之后不弹"；少了前半段，后半段可以靠"什么都没存过"蒙绿。
 *
 * **但这条测的不是清槽**（15:16 的变异证据）：把 `rtState.status === "ended"` 那支短路成"永远不 clear"之后，
 * **E52 照样 1 passed**——因为续玩提示的前提是 `save.state.status === "active"`（`PlayerPage.tsx:379`），
 * 结局存进去的那条状态本来就不是 active，所以"提示消失"这件事由状态判断提供，与清不清没关系。
 * ⇒ 结论要写准：**结局那次 `clearSaveSlot` 在界面上今天没有可观测后果**（可观测的只有状态门），
 *   要么它是一条"界面上读不出来"的正确性、要么这一支根本不需要存在——这是新登记的一条待决，不在本批擅删。
 * 想真正把清槽量出来，得在结局后、新一轮自动存档写回之前读到那张槽（600ms 窗口），
 * 或让面板把"已结束"的存档与空槽区分开——两者都要先定形状，见 §6。
 */
test.describe("E52 打完故事重进不再给续玩提示（注意：这条测的不是清槽，见文档块）", () => {
  test("推进一拍→有续玩提示；打到结局→提示消失，且全程零 /api/v1", async ({ page }) => {
    test.setTimeout(150_000); // 建剧本 + 两次进出播放器 + 逐拍推进，60s 默认预算不够
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    const offer = page.getByText("继续游玩");

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("结局清槽判据");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("# 开场\n旁白：第一处开场。\n\n# 第二拍\n旁白：第二处开场。\n");
    const saveButton = page.getByRole("button", { name: "保存剧本" });
    await saveButton.click();
    await expect(saveButton).toBeEnabled({ timeout: 15_000 });

    /** 回工程页 → 确认库还活着 → 再进播放器 */
    const leaveAndReenter = async () => {
      await page.goBack();
      await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
      await expect(
        page.getByRole("link", { name: "试玩" }).first(),
        "goBack 之后工程页没回来——内存库可能被整页重载清了（那是夹具行为，不能拿它当判据）",
      ).toBeVisible({ timeout: 8000 });
      await page.getByRole("link", { name: "试玩" }).first().click();
      await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });
    };

    /** 已经在演出里：一路推到"故事已结束"（最多按 12 下，找不到就带着首屏文本失败） */
    const advanceToEnd = async () => {
      for (let i = 0; i < 12; i++) {
        if ((await page.getByText("故事已结束").count()) > 0) return;
        await page.keyboard.press("Space");
        await page.waitForTimeout(400);
      }
      throw new Error(`按了 12 下没打到结局。首屏文本=【${(await page.locator("body").innerText()).slice(0, 300)}】`);
    };

    // 先只推进一拍并落一次自动存档，用来证"提示会出现"这半边（少了它，下面的"不出现"可以靠什么都没存过蒙绿）
    await page.getByRole("link", { name: "试玩" }).first().click();
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "菜单", exact: true })).toBeVisible({ timeout: 15000 });
    await page.keyboard.press("Space");
    await page.waitForTimeout(1500);
    await leaveAndReenter();
    await page.waitForTimeout(2000);
    await expect(
      offer,
      "推进一拍、存过档之后重进却不给续玩提示：那这个传感器读不出'清没清'，后半段判据不成立",
    ).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "继续游玩" }).click();

    await advanceToEnd();
    await page.waitForTimeout(1500); // 结局那一下的清槽写在 600ms 防抖之后
    await leaveAndReenter();

    // 结局屏不给读档入口，也没有返回链接：靠 SPA 历史导航回工程页（整页重载会清空内存库，那是夹具行为）
    await expect(
      offer,
      "打完了还给续玩提示：结局那次 clearSaveSlot 没生效（或清的不是自动槽）",
    ).toHaveCount(0);

    expect(crashes, `结局清槽链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `结局清槽链路发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E53 手动存档与删除存档落在本地库上（桌面态全程零云端请求）。
 *
 * E51/E52 把"自动那一格"钉住了，剩下两件事今天只有 provider 层单测：`manualSave`（存进某个人工槽）
 * 与 `deleteSaveSlot`（删除那个槽）。界面上它们的形状是：存档面板里那张卡从「— 空槽 —」变成有内容，
 * 并且**只有非自动的已填槽**才长出「删除存档」那颗键。于是判据用三个可观测的差分：
 * 空槽数、`aria-label="删除存档"` 的颗数、以及两次采样之间必须**关掉面板重开**（读档面板不自己刷新，E51 实测）。
 * 自动存档会先占掉 slot 0，所以基线是"1 格被自动占、其余空"，人工那次要能看见**再少一格**。
 */
test.describe("E53 手动存档写入本地库、删除后回到空槽（桌面态全程零云端请求）", () => {
  test("开播 → 存进「存档 1」→ 该格被写进且长出删除键 → 删除后回到原状，全程零 /api/v1", async ({ page }) => {
    test.setTimeout(150_000); // 建剧本 + 三次开关面板
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("手动存档判据");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("# 开场\n旁白：第一处开场。\n\n# 第二拍\n旁白：第二处开场。\n");
    const saveButton = page.getByRole("button", { name: "保存剧本" });
    await saveButton.click();
    await expect(saveButton).toBeEnabled({ timeout: 15_000 });

    await page.getByRole("link", { name: "试玩" }).first().click();
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });
    await page.keyboard.press("Space");
    const menuBtn = page.getByRole("button", { name: "菜单", exact: true });
    await expect(menuBtn).toBeVisible({ timeout: 15000 });
    await page.keyboard.press("Space"); // 推进一拍，让自动存档有内容可写
    await page.waitForTimeout(1500);

    const slotLabels = page.getByText(/^(自动存档|存档 \d+)$/);
    const emptySlots = page.getByText("— 空槽 —");
    const delBtns = page.getByRole("button", { name: "删除存档", exact: true });

    /** 存档面板不会自己刷新（E51 实测）⇒ 每次取数都要"重开一次"，读数才算被存储证过 */
    /**
     * Escape 在播放器里是"有面板就关、没面板就开系统菜单"，所以开面板要按当前状态分两条路走：
     * 先按一下 Escape（要么关掉旧面板、要么把系统菜单打开），再看菜单项在不在。
     */
    const openSavePanel = async () => {
      const saveItem = page.getByRole("button", { name: "存档", exact: true });
      await page.keyboard.press("Escape");
      if ((await saveItem.count()) === 0) await menuBtn.click();
      await saveItem.click();
      await expect(page.getByText(/^(自动存档|存档 \d+)$/).first()).toBeVisible({ timeout: 8000 });
    };

    const sample = async () => {
      await openSavePanel();
      const r = { total: await slotLabels.count(), empty: await emptySlots.count(), del: await delBtns.count() };
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      return r;
    };

    const base = await sample();
    expect(base.total, `存档面板该有多格，实际只数到 ${base.total} 个槽位标签`).toBeGreaterThanOrEqual(3);
    expect(base.empty, `基线该是"自动占了 1 格、其余空"：${JSON.stringify(base)}`).toBe(base.total - 1);
    // 自动槽不给删除键（`save && !isAuto` 才渲染那颗）——这条同时是"那颗键是随内容长出来的"的正控
    expect(base.del, `基线不该有删除键（只有人工槽填了内容才该出现）：${JSON.stringify(base)}`).toBe(0);

    await openSavePanel();
    await page.getByText("存档 1", { exact: true }).click(); // 点卡片里的标签，事件冒泡到那张卡的 button
    await page.waitForTimeout(800);

    const saved = await sample();
    expect(saved.empty, `手动存档没落到那张卡上：${JSON.stringify({ base, saved })}`).toBe(base.empty - 1);
    expect(saved.del, `手动那一格填了却没长删除键：${JSON.stringify({ base, saved })}`).toBe(1);

    await openSavePanel();
    await page.getByRole("button", { name: "删除存档", exact: true }).click();
    await page.waitForTimeout(800);

    const deleted = await sample();
    expect(deleted.empty, `删除存档没把那一格清回去：${JSON.stringify({ saved, deleted })}`).toBe(base.empty);
    expect(deleted.del, `删完还留着删除键：${JSON.stringify({ saved, deleted })}`).toBe(0);

    expect(crashes, `手动存档链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `手动存档链路发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E54 「对话回顾」读的是本地演出态：推进之前是空的，推进之后要读得到那句台词。
 *
 * 玩家侧这几块面板（回顾 / 鉴赏 / 档案）在桌面上都是本地读径，此前一条界面级判据都没有：
 * `pushBacklog` 只在 `doProceed` 里被调（离开那一拍时把它压进 backlog），面板读的是这份 state。
 * 所以判据要两头：**先证明"没推进时面板确实是空的"**（否则"看见台词"可以由任何残留内容满足），
 * 再证明推进一次之后那句原文在面板里读得到。面板自带空态「暂无对话记录」，两头都有可读形状，
 * 不需要靠 count 猜。
 */
test.describe("E54 对话回顾面板读本地演出态（桌面态全程零云端请求）", () => {
  test("开播时回顾是空的 → 推进一拍后能在回顾里读到那句台词，且全程零 /api/v1", async ({ page }) => {
    test.setTimeout(120_000);
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("回顾判据");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("# 开场\n旁白：第一处开场。\n\n# 第二拍\n旁白：第二处开场。\n");
    const saveButton = page.getByRole("button", { name: "保存剧本" });
    await saveButton.click();
    await expect(saveButton).toBeEnabled({ timeout: 15_000 });

    await page.getByRole("link", { name: "试玩" }).first().click();
    await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "菜单", exact: true })).toBeVisible({ timeout: 15000 });

    const backlogBtn = page.getByRole("button", { name: /回顾/ }).first();
    const emptyState = page.getByText("暂无对话记录");
    const panelTitle = page.getByText("对话回顾");

    await backlogBtn.click();
    await expect(panelTitle).toBeVisible({ timeout: 8000 });
    await expect(
      emptyState,
      "一拍都没推进，回顾面板却已经有内容——那下面那句「看见台词」就不算证据",
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await page.keyboard.press("Space"); // 离开第一拍：这一条才被压进回顾
    await page.waitForTimeout(800);
    await backlogBtn.click();
    await expect(panelTitle).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("第一处开场。")).toBeVisible({ timeout: 8000 });
    await expect(emptyState).toHaveCount(0);

    expect(crashes, `回顾链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `回顾链路发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});


/*
 * E55 播放器设置按作品隔离地存住（桌面态全程零云端请求）。
 *
 * `shared/lib/playerSettings.ts` 的承诺写在它第一行注释上：「按作品存 localStorage」。
 * 这句今天没有任何界面级判据：把它改成全局一个 key、或者只改内存态不写回，界面上都看不出来。
 * 所以判据要走四步、每步都有一个会被变异打红的断言：
 *   ① 读到一个默认值；② 用方向键改它（控件真的连着 state）；
 *   ③ **换页再进**还是改后的值（真的写回并读回来了）；
 *   ④ 另一部作品的播放器里它回到默认值（key 真的按作品分开）。
 * 少了④，"按作品存"这一半没人看；少了①，③可以由任意初值满足。
 */
test.describe("E55 播放器设置按作品存住并互相隔离（桌面态全程零云端请求）", () => {
  test("默认值 → 改一档 → 换页再进还是它 → 另一部作品回到默认值，且全程零 /api/v1", async ({ page }) => {
    test.setTimeout(150_000); // 两部作品 + 四次进出设置面板
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    const crashes: string[] = [];
    page.on("pageerror", (e) => crashes.push(String(e).slice(0, 160)));

    const createProject = async (title: string, freshPage = true) => {
      // freshPage=false 用于"同一次会话里再建一部"：整页 goto 会重置内存库，
      // 两部都会拿到 proj-0001，key 相撞——那时读到的"继承"是夹具行为，不是产品行为。
      if (freshPage) await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
      await page.getByRole("button", { name: "新建剧本" }).click();
      await page.getByPlaceholder("剧本标题").fill(title);
      await page.getByRole("button", { name: "创建" }).click();
      await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
      const tab = page.getByRole("tab", { name: "剧本", exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
      await expect(ed).toBeVisible({ timeout: 8000 });
      await ed.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.insertText("# 开场\n旁白：第一处开场。\n\n# 第二拍\n旁白：第二处开场。\n");
      const saveButton = page.getByRole("button", { name: "保存剧本" });
      await saveButton.click();
      await expect(saveButton).toBeEnabled({ timeout: 15_000 });
    };

    const slider = page.getByRole("slider").first();
    /** Escape 在播放器里是"有面板就关、没面板就开系统菜单"，所以开面板要按当前状态分两条路 */
    const openSettings = async () => {
      const item = page.getByRole("button", { name: "设置", exact: true });
      await page.keyboard.press("Escape");
      if ((await item.count()) === 0) {
        await page.getByRole("button", { name: "菜单", exact: true }).click();
      }
      await item.click();
      await expect(slider).toBeVisible({ timeout: 8000 });
    };

    const enterPlayer = async () => {
      await page.getByRole("link", { name: "试玩" }).first().click();
      await expect(page).toHaveURL(/\/play\/[^/]+$/, { timeout: 15000 });
      await page.keyboard.press("Space");
      await expect(page.getByRole("button", { name: "菜单", exact: true })).toBeVisible({ timeout: 15000 });
    };

    await page.addInitScript(DESKTOP_MARKER_INIT);
    await createProject("设置隔离甲");
    await enterPlayer();
    await openSettings();
    const v0 = await slider.inputValue();
    expect(Number(v0), `文字速度初值不像是默认值：${v0}`).toBeGreaterThan(0);

    await slider.press("ArrowLeft");
    const v1 = await slider.inputValue();
    expect(
      Number(v1) < Number(v0),
      `按方向键没把值改小（${v0} → ${v1}）：滑块与 state 没连上，后面的持久化断言就没意义了`,
    ).toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await enterPlayer();
    await openSettings();
    await expect(
      slider,
      "换页再进后设置回到默认值：没写回本地或没读回来",
    ).toHaveValue(v1, { timeout: 8000 });
    await page.keyboard.press("Escape");

    // 另一部作品：同一个 key 族若不分作品，这里会读到 v1。走 SPA 导航建它（见 createProject 的注释）
    await page.goBack();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });
    await page.getByRole("link", { name: "剧本列表" }).click();
    await createProject("设置隔离乙", false);
    await enterPlayer();
    await openSettings();
    await expect(
      slider,
      `另一部作品继承了上一部的设置（读到 ${await slider.inputValue()}，默认应是 ${v0}）：key 没有按作品分开`,
    ).toHaveValue(v0, { timeout: 8000 });

    expect(crashes, `设置链路上抛了未捕获异常：${crashes.join(" | ")}`).toEqual([]);
    expect(hits, `设置链路发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});


/*
 * E43 导入 `.axsp` 的点击路径（此前这条路径一条点击层判据都没有）。
 *
 * 动因有两件，第二件是纠正我自己的在册记录：
 * ① 2026-10-09 修掉「同一个包导第二次必失败」（节点/边身份没重映射，撞全局主键）之后，
 *    用户级承诺「可以重复导入，每次得到一个独立副本」在界面上没人验过。
 * ② 我自己写过「`openBinaryFile` 在测试宿主里结构上点不了」——**一半对、一半错，这里把边界画准**：
 *    它先判 `isTauriEnvironment()`。注入桌面标记（`DESKTOP_MARKER_INIT`）的那一支走
 *    `@tauri-apps/plugin-dialog`，在 chromium 里确实开不出选择器（本会话第一次就撞在这，
 *    `waitForEvent("filechooser")` 60s 超时）；而**不注入标记**、只用 `?storage=memory` 时走
 *    `document.createElement("input") + click()` 的回退支，Playwright 接得到 `filechooser`。
 *    所以本条测的是「导入通路 + 本地库语义」，plugin-dialog 那一腿仍属真壳手验（在册待决⑦）。
 *    正对照就是「选择器确实开过」——没有它，零请求可能只是因为入口从没被点到。
 *
 * 这条测不到那个缺陷本身：内存宿主不 enforce 跨工程的全局主键（机制判据在
 * `packages/editor-core/src/axspReimport.test.ts`，那里用真 SQLite）。
 * 它测的是**通路**：按钮 → 选择器 → 解包 → 落库 → 换页再进 → 两个独立工程各自可开。
 */
test.describe("E43 导入 .axsp：同一个包连导两次得到独立副本", () => {
  test("两次导入各得一个工程、两份并存、没有「导入失败」弹窗（通路走本地库）", async ({ page }) => {
    const hits: string[] = [];
    const dialogs: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    // 导入失败在产品里是一句 alert(「导入失败：…」)；收下它并留证据，别让判据靠"没弹窗"推断成功
    page.on("dialog", (d) => {
      dialogs.push(`${d.type()}:${d.message()}`);
      void d.accept();
    });

    // 刻意不注入 DESKTOP_MARKER_INIT：注入了就会走 plugin-dialog 支（chromium 里开不出选择器）。
    // 本地库这一半仍由 ?storage=memory 保证（导入通路本身零请求），但页面级消费者照旧发 HTTP，见下方注释。
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await expect(page.getByText("还没有剧本")).toBeVisible({ timeout: 8000 });
    // 前置对照：导入前这张标题在页面上一张都没有，否则后面的 toHaveCount(2) 可能被任何同名文本满足
    await expect(page.getByText(/【示范】序章·交汇/)).toHaveCount(0);

    // 夹具路径按仓库根解析（Playwright 的 cwd 就是根）；先证明文件在，
    // 否则"没弹窗、没请求"会被读成导入坏了——那是把 fixture 问题误判成产品问题
    const seed = resolve("apps/web/public/seeds/showcase-1.axsp");
    expect(existsSync(seed), `示范作夹具不存在：${seed}`).toBe(true);
    const importOnce = async (): Promise<string> => {
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByRole("button", { name: "导入 .axsp" }).click(),
      ]);
      expect(chooser, "点「导入 .axsp」必须真的开出文件选择器，否则这条判据在测一个不存在的入口").toBeTruthy();
      await chooser.setFiles(seed);
      await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 15000 });
      const url = page.url();
      await page.getByRole("link", { name: "剧本列表" }).click();
      // 这里刻意不断言「还没有剧本消失」：实测同一句空态文本在页面上有多个 section 会渲染
      // （元剧本 / 我的 / 模板），它的有无测的是标签页布局而不是导入结果——07:48 那次红就是这么来的。
      // "落库了"的证据在下面用工程 URL 与卡片计数两条给。
      return url;
    };

    const first = await importOnce();
    const second = await importOnce();

    // 核心证据：同一个字节流两次导入，落到**两个不同的工程 id**（旧行为是第二次直接失败）
    expect(second).not.toBe(first);
    /**
     * 两份并存：按标题文本数卡片。**计数断言不需要元素稳定**（不需要几何命中），
     * 所以这条能成立而我先前删掉它给的理由（"条带永不稳定"）其实是误读——
     * 不稳定只挡住"点击"这种要算 bounding box 的动作，不挡住计数。
     * 要点击卡片得另写一条，且得先治那个入场动画，不在本条里顺手做。
     */
    await expect(page.getByText(/【示范】序章·交汇/)).toHaveCount(2);
    expect(
      dialogs.filter((d) => d.includes("导入失败")),
      `不该出现「导入失败」弹窗（同期观测到 ${hits.length} 笔云端请求，来自会话/健康检查等页面级消费者，见上方注释，不当成本条的判据）`,
    ).toEqual([]);
    /*
     * 这里刻意**没有**再断"列表里有两张卡片"。两次尝试都留了证据，结论是这条判据今天写不出可信形状：
     * ① 按标题文本数——撞上页面顶部【示范】条带里的同名项，且那个条带的元素在 Playwright 下
     *    60s 内一直 "not stable / detached from DOM"（无限动画？这是独立的观察，已登记 §5，不在本条顺手治）；
     * ② 按工程 id 找 `<a href>` ——卡片不是锚点，`element(s) not found`。
     * 所以本条的可证事实停在：**两次导入各自把浏览器带到不同的工程页**
     * （内存库给的是顺序 id，实测 `proj-0001` 与 `proj-0002`），"还没有剧本"消失，
     * 没有「导入失败」弹窗，全程零 `/api/v1`。这已经足够钉住旧行为（第二次直接失败），
     * 而"列表渲染两张卡"要等那条稳定形状出现再加——宁缺毋滥。
     */
    /*
     * 刻意**不**断言「零 /api/v1」。实测（06:53）：不注入桌面标记时页面仍发
     * `/api/v1/users/session`、`/api/v1/editor/projects/user/<creator>`、`/api/v1/llm/health` 四笔——
     * 因为那些消费者由 `isLocalOnlyDeployment()`（看 Tauri 标记）闸门，跟 `?storage=memory` 不是同一个条件。
     * 本条能证的只有**导入这一条通路走了本地库**：两次都落到各自的工程页、没有「导入失败」弹窗。
     * 「页面不该发云端请求」仍归 E14 的 CLEAN_ROUTES 棘轮，别在这里冒充它。
     */
  });
});

/*
 * E58 评论区的「举报评论」是 `/comments/{id}/report` 这条云路径唯一的界面入口。
 *
 * 来历：`cloud:callmap` 第十二段那 12 条「静态说装载即发、桌面普查没见过」的端点，2026-10-09 逐条定性后
 * 全部归到四类机制（页面早退／藏入口／调用者侧闸门／查询层 `enabled`），各类都有界面判据了
 * （E44／E48／E49／E50／E56／E57），**只剩这一格没有按名的判据**。
 * 形状：`commentsApi.report` ← `useCommentThread.report` ← `DiscoverCommentSection.onReport`
 * ← `CommentRow` 里那颗 `aria-label="举报评论"`，而它的渲染条件是 `onReport && !isOwner`
 * ——**列表为空时屏幕上根本没有这颗键**（那时只有「还没有评论，来抢沙发吧。」）。
 *
 * 所以浏览器那一半必须**喂数据**才点得亮正对照。在册纪律：缺席断言要配"另一态它真该在场"，
 * 而同页别的控件 substitute 不了——评论区整块被删掉时，页面剩下的部分照样渲染，
 * 三个 `count 0` 会一起白拿绿。
 *
 * 三条通路全部 `page.route` 就地应答（工程详情 GET、评论列表 GET、举报 POST）。
 * **POST 也本地应答 ⇒ 一个字节都不出这台浏览器**：本机 :8000 上跑着他的 uvicorn，
 * 而 vite 把 `/api` 代理过去，所以这一条不是可选项而是前提。
 * 夹具只活在测试层，产品代码与真实后端都不参与。
 */
const E58_PROJECT = "e58-project";
const E58_COMMENT = "e58-comment";

/** 浏览器臂的最小应答面：一条**不属于本机用户**的评论，否则举报键根本不渲染（`!isOwner`） */
async function stubCommentReadPaths(page: Page, posted: string[]): Promise<void> {
  const json = (route: Route, body: unknown) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  await page.route(
    (u) => u.pathname === `/api/v1/editor/projects/${E58_PROJECT}`,
    (route) =>
      json(route, {
        id: E58_PROJECT,
        title: "举报判据用的公开作品",
        description: "只为浏览器臂的正对照存在",
        is_public: true,
        allow_comments: true,
        view_count: 1,
        play_count: 0,
        genre: null,
        cover_image: null,
      }),
  );
  await page.route(
    (u) => u.pathname === "/api/v1/comments",
    (route) =>
      json(route, {
        items: [
          {
            id: E58_COMMENT,
            author_id: "creator-someone-else",
            body: "这条评论不是本机身份写的，所以界面上该给举报键。",
            created_at: "2026-10-09T00:00:00Z",
            reply_count: 0,
            replies: [],
          },
        ],
        total: 1,
      }),
  );
  await page.route(
    (u) => u.pathname === `/api/v1/comments/${E58_COMMENT}/report`,
    (route) => {
      posted.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      return json(route, { ok: true });
    },
  );
}

test.describe("E58 评论举报：浏览器态真点得动，桌面态整块不给", () => {
  test("浏览器态：先问原因，POST 打到 /comments/{id}/report 并给出回执", async ({ page }) => {
    const posted: string[] = [];
    await stubCommentReadPaths(page, posted);

    const prompts: string[] = [];
    const alerts: string[] = [];
    page.on("dialog", async (d) => {
      if (d.type() === "prompt") {
        prompts.push(d.message());
        await d.accept("夹带广告");
      } else {
        alerts.push(d.message());
        await d.accept();
      }
    });

    await page.goto(`/discover/projects/${E58_PROJECT}`, { waitUntil: "load" });
    /*
     * 正控分两层：**这一屏的读者在场**（`讨论` 栏 + 那条真评论的正文），以及**那颗键在场**。
     * 只断言键的话，"评论区整块没渲染"与"渲染了但被摘掉一列"这两种红分不开。
     */
    await expect(page.getByRole("heading", { name: "讨论" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("这条评论不是本机身份写的")).toBeVisible();
    const report = page.getByRole("button", { name: "举报评论" });
    await expect(report).toBeVisible();

    await report.click();
    await expect
      .poll(() => alerts, { timeout: 8000, message: `没等到回执弹窗，观测到的 alert：${alerts.join(" | ")}` })
      .toContain("已收到举报，感谢反馈");
    expect(prompts, "点举报应先问原因").toContain("举报原因（简要说明）");
    expect(posted, "举报应打出一条 POST").toEqual([`POST /api/v1/comments/${E58_COMMENT}/report`]);
  });

  test("桌面态：这一页只给缺席说明，评论区与举报键都不给，且零 /api/v1", async ({ page }) => {
    const hits = await visitInDesktopMode(page, `/discover/projects/${E58_PROJECT}`);
    // 正控：桌面分支真渲染了（E44 同一条正证），下面的两个 count 0 才是"被挡"而不是"没加载"
    await expect(page.getByText("公开剧本详情需要协作服务")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("heading", { name: "讨论" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "举报评论" })).toHaveCount(0);
    expect(hits, `桌面态这一页仍发了云端请求：${hits.join(", ")}`).toEqual([]);
  });
});

/*
 * E59 项目卡菜单里的「举报」是 `reportApi.create` ⇒ `POST /report/` 唯一的界面入口。
 *
 * 来历：`cloud:callmap` 时机档那 8 处「不明」（静态既没判成装载即发、也没判成点了才发）在
 * 2026-10-09 逐条定性后，**只有这一条是界面真走得到的**：
 * `identityLink.reportContent` ← `DiscoverProjectsTab.handleReport`（`:94`）← 卡片溢出菜单里那条
 * `role="menuitem"`「举报」（`:150`）；其余 5 条活在零外部读者的死出口里（已由 `check:dead-surface`
 * 第二档在册盯着）、1 条是分派口的远端支、1 条已被 E58/E44 守着。
 * 桌面这一侧挡着它的是**整页早退**（`DiscoverPage.tsx:53` 的 `CloudFeatureNotice feature="发现页"`），
 * 而普查的限度明写它不认"消费者级条件渲染"⇒ 这条一直留在保守上界里下不来，只能靠界面级证据。
 *
 * 形状沿用 E58（同一条纪律）：浏览器臂**必须有真数据**才点得亮正对照——卡片列表为空时屏幕上根本没有那颗
 * `aria-label="更多操作"`，那时候桌面臂那两个 `count 0` 是空载。
 * 只应答这条通路需要的两条：发现列表 GET 与举报 POST（**POST 也在浏览器里就答完 ⇒ 一个字节都不出这台机器**）。
 * 这一页其它消费者（会话／健康检查等）**不应答**，它们在浏览器臂里照常失败——
 * 本条不断言"浏览器臂零请求"，所以那不影响判据；"该页不该发请求"归 E14/E57 与桌面臂那一条。
 */
const E59_PROJECT = "e59-project";

async function stubDiscoverCardPaths(page: Page, posted: { path: string; body: unknown }[]): Promise<void> {
  const json = (route: Route, body: unknown) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  await page.route(
    (u) => u.pathname === "/api/v1/editor/projects/discover",
    (route) =>
      json(route, {
        items: [
          {
            id: E59_PROJECT,
            title: "举报判据用的公开作品",
            description: "只为浏览器臂的正对照存在",
            is_public: true,
            allow_comments: true,
            view_count: 1,
            play_count: 0,
            genre: null,
            cover_image: null,
            author_id: "creator-someone-else",
            created_at: "2026-10-09T00:00:00Z",
            updated_at: "2026-10-09T00:00:00Z",
          },
        ],
        total: 1,
      }),
  );
  await page.route(
    (u) => u.pathname === "/api/v1/report/",
    (route) => {
      posted.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
      return json(route, { id: "report-e59" });
    },
  );
}

test.describe("E59 项目卡举报：浏览器态真点得动，桌面态连卡片都不给", () => {
  test("浏览器态：溢出菜单里点「举报」，POST /report/ 带 project 与这张卡的 id", async ({ page }) => {
    const posted: { path: string; body: unknown }[] = [];
    await stubDiscoverCardPaths(page, posted);

    const prompts: string[] = [];
    const alerts: string[] = [];
    page.on("dialog", async (d) => {
      if (d.type() === "prompt") {
        prompts.push(d.message());
        await d.accept("夹带广告");
      } else {
        alerts.push(d.message());
        await d.accept();
      }
    });

    await page.goto("/discover", { waitUntil: "load" });
    /*
     * 正控分三层，缺一层就分不开"被挡了"与"没加载"：
     * ① 列表真渲染了（卡片标题与「共 1 部作品」），② 那颗溢出键真在场，③ 菜单里那条「举报」真点得到。
     */
    await expect(page.getByText("举报判据用的公开作品")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("共 1 部作品")).toBeVisible();
    // 必须 exact：卡片本身是 <article role="button">，它的可访问名由子树算出来、里面就含"更多操作"
    const overflow = page.getByRole("button", { name: "更多操作", exact: true });
    await expect(overflow).toBeVisible();
    await overflow.first().click();
    const reportItem = page.getByRole("menuitem", { name: "举报" });
    await expect(reportItem).toBeVisible({ timeout: 8000 });

    await reportItem.click();
    await expect
      .poll(() => alerts, { timeout: 8000, message: `没等到回执弹窗，观测到的 alert：${alerts.join(" | ")}` })
      .toContain("已收到举报，感谢反馈");
    expect(prompts, "点举报应先问原因").toContain("举报原因（简要说明）");
    expect(posted.map((p) => p.path), "举报应打出一条 POST").toEqual(["/api/v1/report/"]);
    expect(posted[0]?.body, "送审的要是被举报的那张卡，不是别的东西").toMatchObject({
      target_type: "project",
      target_id: E59_PROJECT,
      reason: "夹带广告",
    });
  });

  test("桌面态：发现页只给缺席说明，卡片与溢出菜单都不存在，且零 /api/v1", async ({ page }) => {
    const hits = await visitInDesktopMode(page, "/discover?storage=memory");
    // 正控：桌面分支真渲染了（E14/E57 同一条正证），那两个 count 0 才是"整页被挡"而不是"没加载"
    await expect(page.getByText("发现页需要协作服务")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "更多操作", exact: true })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "举报" })).toHaveCount(0);
    expect(hits, `桌面态发现页仍发了云端请求：${hits.join(", ")}`).toEqual([]);
  });
});

/*
 * E60 演出层放两组分支时，界面上必须说出来。
 *
 * 来历：第八十五批给发射器加了 warning（`printAxs` 的可选出参），但**那行合并显示的接线当时没有界面级判据**——
 * 谁把 `MiniAxsEditor` 里的合并那一行删掉，`gates` 与 `e2e:desktop` 都不会响。本条就是补那个洞：
 * 判据的对象不是"warning 文案对不对"（那是 roundtrip.test.ts 三条单测的活），而是
 * **"发射侧报的东西，用户看得见"**——所以断言落在界面上那句话。
 * 两头都要钉：只有一组分支时**不许响**（否则每条正常剧本都带噪音），两组时才响。
 */
test.describe("E60 演出层放两组分支：AXS 片段里要说出第二组读不回来", () => {
  test("一组不响；连点两次「+ 分支」后界面上出现那句，且全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("分支丢失要出声");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    await page.getByRole("button", { name: "演出" }).click();
    const addBranch = page.getByRole("button", { name: "+ 分支" });
    await expect(addBranch).toBeVisible({ timeout: 8000 });
    // 正控：AXS 片段那一栏在场（合并后的诊断就显示在它下面），否则下面的 count 0 是空载
    await expect(page.getByText("AXS 片段")).toBeVisible();
    const dropped = page.getByText(/组分支/);
    await addBranch.click();
    await expect(dropped).toHaveCount(0);
    await addBranch.click();
    await expect(page.getByText("读不回来")).toBeVisible({ timeout: 8000 });

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E61 保存把投影写回存档那一趟，丢了东西要在界面上留下一条常驻说法。
 *
 * 为什么单独立一条（E60 之后还要）：E60 量的是"演出层那一栏里看得见"，
 * 而**真正固化丢失的是保存**——`useProjectEditor` 在 `!axsDirty` 时会重算投影并 `persistAxsProjection`
 * 写回 `axs_source`。那一刻如果没有提示，用户下次打开看到的已经是少了第二组分支的文本，
 * 且没有任何地方说过它丢过。所以判据对象是"保存这一趟之后，界面上有一条**不会自己消失**的说明"。
 * 常驻条（`role="status"`）而不是 toast：toast 会消失，消失就等于没说过。
 */
test.describe("E61 保存后，投影丢的第二组分支要有那条常驻说明", () => {
  test("演出层放两组分支 → 保存 → 顶部出现「读不回来」那条说明，且全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("保存要说丢");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    const notice = page.getByRole("status").filter({ hasText: "读不回来" });
    // 正控之一：还没放第二组时，那条说明不该挂着（否则这条判据对任何工程都绿）
    await expect(notice).toHaveCount(0);

    await page.getByRole("button", { name: "演出" }).click();
    const addBranch = page.getByRole("button", { name: "+ 分支" });
    await expect(addBranch).toBeVisible({ timeout: 8000 });
    await addBranch.click();
    await addBranch.click();
    // 正控：两组分支都真在面板里（同名两组时 getByRole("group") 的解析不可靠，改用文案计数）
    await expect(page.getByText("分支选项")).toHaveCount(2);

    await page.getByRole("button", { name: "保存", exact: true }).first().click();
    await expect(page.getByText("已保存")).toBeVisible({ timeout: 8000 });
    await expect(notice).toBeVisible({ timeout: 8000 });

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E62 「保存剧本」那条路不经过投影块，所以"工程变空 ⇒ 顶部那条说明要消失"只能靠装载档清。
 *
 * 为什么不是"删空 Beat"：`saveAll` 在 !axsDirty 时会重算投影，空工程算不出诊断 ⇒ 它自己就把说明
 * 清成 null 了——用那条链写断言，有无 `setProjectionNotice(null)` 都绿，是条没牙的判据。
 * 走 Writer 的「保存剧本」（`saveWriter`，`useProjectEditor.ts:728`）才只经过 `axsToSyncPayload` + `refreshProject`，
 * 于是"说明是否消失"这一眼真正落在装载那条早退上。
 */
test.describe("E62 零桥段地保存剧本后，那条常驻说明必须跟着消失", () => {
  test("两组分支→保存（说明出现）→ 剧本 tab 改成没有 # 标题的文本→保存剧本→说明清空，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("早退要清说明");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    const notice = page.getByRole("status").filter({ hasText: "读不回来" });
    await page.getByRole("button", { name: "演出" }).click();
    const addBranch = page.getByRole("button", { name: "+ 分支" });
    await expect(addBranch).toBeVisible({ timeout: 8000 });
    await addBranch.click();
    await addBranch.click();
    await expect(page.getByText("分支选项")).toHaveCount(2);
    await page.getByRole("button", { name: "保存", exact: true }).first().click();
    await expect(page.getByText("已保存")).toBeVisible({ timeout: 8000 });
    await expect(notice).toBeVisible({ timeout: 8000 });

    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("旁白：这页一个桥段都没有。\n");
    await page.getByRole("button", { name: "保存剧本" }).click();
    await expect(notice).toHaveCount(0, { timeout: 8000 });

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E63 打开「剧本」tab 的那一次物化（`openWriterAtSelection` → `projectAxsFromCanvas`）把发射侧诊断
 * 整个丢掉：屏幕上出现的**正是这次投影的结果**，却没有一条说明——三个投影时刻里的第三个。
 *
 * 状态要挑准：**图里已有第二组分支，而说明还不存在**。刚建工程直接两次「+ 分支」就满足——
 * 装载那次投影没有丢失（默认文本、无选项）所以说明是 null，而这两次编辑只进 draft、不进存档。
 * 若写成"先保存再切 tab"，说明在保存时就已出现 ⇒ 有无本次改动都绿，那是条没牙的判据（同 E62 的教训）。
 */
test.describe("E63 打开「剧本」tab 物化画布时，第二组分支的丢失要说出口", () => {
  test("未保存的两次「+ 分支」→ 说明不在 → 切「剧本」tab → 说明出现，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("物化要说丢失");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    const notice = page.getByRole("status").filter({ hasText: "读不回来" });
    await page.getByRole("button", { name: "演出" }).click();
    const addBranch = page.getByRole("button", { name: "+ 分支" });
    await expect(addBranch).toBeVisible({ timeout: 8000 });
    await addBranch.click();
    await addBranch.click();
    await expect(page.getByText("分支选项")).toHaveCount(2);
    // 前置：此刻说明确实不在——不是选择器写错，而是这两次编辑没经过任何会写说明的路径
    await expect(notice).toHaveCount(0);

    const tab = page.getByRole("tab", { name: "剧本", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(notice).toBeVisible({ timeout: 8000 });

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E64 两处丢失时，那条常驻说明要说清"共有几处"。
 *
 * 发射器**逐拍**报（`packages/axs/src/print.ts` 里只有那一处 `emit`，每个丢失的拍各一条），界面上只有一条横幅。
 * 关掉第一百零一批那个缺口用的就是这个形状：先用文本落两拍（语法表达得了多拍，表达不了"一拍两组"），
 * 再逐拍点两次「+ 分支」，最后保存 ⇒ 同一次投影里两条告警。
 * 单拍那几腿（E60/E61/E63）盖不到"数量"这一维——它们的状态永远只有一条告警。
 */
test.describe("E64 两处丢失时，常驻说明要说清数量", () => {
  test("两拍各两组分支 → 保存 → 说明里出现「共有 2 处」，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(DESKTOP_MARKER_INIT);
    await page.goto("/studio/projects?storage=memory", { waitUntil: "load" });
    await page.getByRole("button", { name: "新建剧本" }).click();
    await page.getByPlaceholder("剧本标题").fill("两处丢失要说数量");
    await page.getByRole("button", { name: "创建" }).click();
    await expect(page).toHaveURL(/\/studio\/projects\/[^/]+$/, { timeout: 8000 });

    // 用文本落两拍：parse 能造出两个 Beat（"一拍两组"它造不出，正因如此才有这条告警）
    const writerTab = page.getByRole("tab", { name: "剧本", exact: true });
    await writerTab.click();
    const ed = page.getByRole("textbox", { name: "AXS 剧本编辑器" });
    await expect(ed).toBeVisible({ timeout: 8000 });
    await ed.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("# 甲\n旁白：第一拍。\n\n# 乙\n旁白：第二拍。\n");
    await page.getByRole("button", { name: "保存剧本" }).click();
    await expect(page.getByText("剧本已保存")).toBeVisible({ timeout: 8000 });

    const notice = page.getByRole("status").filter({ hasText: "读不回来" });
    // 前置：两拍都干净，此刻确实一条都没报（不是选择器写错）
    await expect(notice).toHaveCount(0);

    // 离开 Writer 模式：剪辑工作台里才有「+ 分支」与大纲行
    const cutTab = page.getByRole("tab", { name: "剪辑" });
    await cutTab.click();
    await expect(cutTab).toHaveAttribute("aria-selected", "true");

    const addBranch = page.getByRole("button", { name: "+ 分支" });
    const branchGroups = page.getByText("分支选项");
    // 「+ 分支」住在右侧检查器的「演出」标签里，而选 Beat 会把面板切回「内容」⇒ 每次选完都要再点开
    const openCutInspector = async () => {
      await page.getByRole("button", { name: "演出" }).click();
      await expect(addBranch).toBeVisible({ timeout: 8000 });
    };

    // 大纲行的可及名带序号（"01 甲"），时间轴上也有一枚 title=拍名的片段按钮，
    // 所以按拍名点会撞上两枚——这里按大纲行的名字点，选中的是 Beat 而不是片段。
    await page.getByRole("button", { name: "01 甲" }).click();
    await openCutInspector();
    await expect(branchGroups).toHaveCount(0);
    await addBranch.click();
    await addBranch.click();
    await expect(branchGroups).toHaveCount(2);

    // 换到第二个 Beat 再放两组：于是"这一次投影"里有两条逐拍告警
    await page.getByRole("button", { name: "02 乙" }).click();
    await expect(page.getByText("Beat · 乙")).toBeVisible({ timeout: 8000 });
    await openCutInspector();
    await expect(branchGroups).toHaveCount(0);
    await addBranch.click();
    await addBranch.click();
    await expect(branchGroups).toHaveCount(2);

    await page.getByRole("button", { name: "保存", exact: true }).first().click();
    await expect(page.getByText("已保存")).toBeVisible({ timeout: 8000 });
    await expect(notice.filter({ hasText: "共有 2 处" })).toBeVisible({ timeout: 8000 });

    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });
});

/*
 * E65 剪贴板被拒时，界面必须说"没复制成"（桌面是唯一发布目标，壳里这格可能没有）。
 *
 * 桩法不打在产品代码上，而是 `addInitScript` 里把两条通路都关掉：
 * `navigator.clipboard.writeText` 直接 reject、`document.execCommand` 返回 false ——
 * 这就是第一百零四批量出来的真实失效形状（原先三处连 catch 都没有：按钮既不说成功也不说失败）。
 * 正控那一臂（给足权限、不桩）证明这条判据不是永远成立：那条腿里屏幕上出现的是「✓ 已复制」。
 */
async function createCharacterThenOpenDetail(page: Page) {
  await page.addInitScript(DESKTOP_MARKER_INIT);
  await page.goto("/studio/characters/mine?storage=memory", { waitUntil: "load" });
  await page.getByRole("link", { name: "创建角色" }).first().click();
  await page.getByRole("button", { name: /英雄/ }).first().click();
  await page.getByPlaceholder("角色如何称呼").fill("凛");
  await page.getByRole("button", { name: "保存角色" }).click();
  await expect(page).toHaveURL(/\/studio\/characters\/mine$/, { timeout: 8000 });
  await page.getByRole("link", { name: /凛/ }).first().click();
  const copyId = page.getByRole("button", { name: /复制 ID|已复制|复制失败/ }).first();
  await expect(copyId).toBeVisible({ timeout: 8000 });
  return copyId;
}

test.describe("E65 剪贴板不可用时，复制 ID 要说出来", () => {
  test("两条通路都被拒 ⇒ 按钮从「复制 ID」变成失败文案，全程零 /api/v1", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("NotAllowedError")) },
      });
      document.execCommand = () => false;
    });
    const copyId = await createCharacterThenOpenDetail(page);
    await copyId.click();
    await expect(page.getByRole("button", { name: /复制失败/ })).toBeVisible({ timeout: 8000 });
    expect(hits, `这条链发了云端请求：${[...new Set(hits)].join(", ")}`).toEqual([]);
  });

  test("正控：权限给足、不桩 ⇒ 同一颗键显示「✓ 已复制」", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);
    const copyId = await createCharacterThenOpenDetail(page);
    await copyId.click();
    await expect(page.getByRole("button", { name: /已复制/ })).toBeVisible({ timeout: 8000 });
  });
});
