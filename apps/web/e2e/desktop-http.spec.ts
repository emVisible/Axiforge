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

const CLEAN_ROUTES = [
  "/discover",
  "/studio/projects",
  "/studio/items",
  "/studio/scenes",
  "/studio/characters/mine",
  "/profile",
  "/docs",
];

const KNOWN_DEBT_ROUTES: Record<string, string> = {
  "/studio/dashboard":
    "侧栏「概览」入口在本地态已隐藏，但直达路由仍会挂载并请求 /api/v1/creator/dashboard；需要让路由本体也显式缺席",
};

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
