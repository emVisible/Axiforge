import { defineConfig } from "@playwright/test";

/**
 * E2E 行为基线（Phase 1a，宪章 G3）。
 *
 * 自包含闭环：自动拉起 API（独立 e2e 库 axiforge_e2e，零接触开发库）与 Web。
 * 本机已有服务时复用（reuseExistingServer），CI 中强制新起。
 */
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql+asyncpg://young@localhost:5432/axiforge_e2e";

export default defineConfig({
    // 基线不住在 apps/web 里：web 端退场（ADR-029 决策 2）时不能把 37 条行为基线一起删掉
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
    locale: "zh-CN",
  },
  webServer: [
    {
      command: "uv run uvicorn app.main:app --port 8000",
      cwd: "backend",
      url: "http://localhost:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { DATABASE_URL: E2E_DATABASE_URL },
    },
    {
      command: "pnpm --filter @axiforge/web dev",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
