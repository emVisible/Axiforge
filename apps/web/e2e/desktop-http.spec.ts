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
