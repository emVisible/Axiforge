import { expect, test } from "@playwright/test";

/**
 * 桌面态「本机模型」配置通路（宪章 S13-4）。
 *
 * 为什么值得单独一条：这条链的判据全是**用户可感知**的三件事——
 * 徽标显示当前在用什么引擎、点了能配、配完刷新还在。单测覆盖了分派逻辑，
 * 但"存了没重读"这一类缺陷只在真浏览器里露得出来，所以这里做完整的 改 → 存 → 刷新 → 重读。
 *
 * 桌面态用注入 `__TAURI_INTERNALS__` 复现（与 desktop-http.spec 同一手法）：
 * `isLocalOnlyDeployment()` 的最终判据就是这个名字在不在 window 上。
 */

const DESKTOP = () => {
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
    invoke: () => Promise.reject(new Error("本地存储在此环境不可用（e2e 注入）")),
  };
};

test.describe("E16 桌面态本机模型配置", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(DESKTOP);
    await page.goto("/studio/characters/new", { waitUntil: "load" });
  });

  test("未配置时徽标如实写着规则引擎，且可点进配置", async ({ page }) => {
    const badge = page.getByRole("button", { name: /AI · 规则引擎/ });
    await expect(badge).toBeVisible();
    await badge.click();
    await expect(page.getByText("桌面端不连我们的服务器")).toBeVisible();
  });

  test("填端点→保存→刷新→重读：配置活过一次页面生命周期，而不是只显示一个「已保存」", async ({ page }) => {
    await page.getByRole("button", { name: /AI · 规则引擎/ }).click();
    await page.getByPlaceholder("qwen2.5:7b").fill("qwen2.5:7b");
    await page.getByRole("button", { name: "保存", exact: true }).click();

    // 保存即生效：徽标换成模型协议名
    await expect(page.getByRole("button", { name: /AI · Ollama/ })).toBeVisible();

    // 真刷新一次再读：只看界面文字会漏掉"写进内存但没落盘"这一整类缺陷
    await page.reload({ waitUntil: "load" });
    await expect(page.getByRole("button", { name: /AI · Ollama/ })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("axiforge:llm-endpoint"));
    expect(stored && JSON.parse(stored).model).toBe("qwen2.5:7b");
  });

  test("清除配置回到规则引擎", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "axiforge:llm-endpoint",
        JSON.stringify({ kind: "ollama", baseUrl: "http://localhost:11434", model: "m" }),
      ),
    );
    await page.reload({ waitUntil: "load" });

    await expect(page.getByRole("button", { name: /AI · Ollama/ })).toBeVisible();
    await page.getByRole("button", { name: /AI · Ollama/ }).click();
    await page.getByRole("button", { name: /清除并回到规则引擎/ }).click();

    await expect(page.getByRole("button", { name: /AI · 规则引擎/ })).toBeVisible();
  });

  test("配置全程不发任何 /api/v1 请求（桌面不依赖后端）", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/api/v1/")) hits.push(path);
    });

    await page.getByRole("button", { name: /AI · 规则引擎/ }).click();
    await page.getByPlaceholder("qwen2.5:7b").fill("qwen2.5:7b");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await page.waitForTimeout(500);

    expect([...new Set(hits)].sort()).toEqual([]);
  });
});
