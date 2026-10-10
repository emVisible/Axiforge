import { defineConfig } from "@playwright/test";
// 端口唯一真相源是 scripts/ports.json。为什么是 JSON 而不是 scripts/ports.mjs（2026-09-30 实测，不是推断）：
// 把 `import { … } from "./scripts/ports.mjs"` 加进这份配置后，Node 20.20.2、22.14、26.7 上**全都加载失败**，
// 且报的法子各不相同（`exports is not defined in ES module scope` / `Cannot use 'import.meta' outside a module`）——
// Playwright 的 `.ts` 配置走 CJS 转译，掺进 ESM 依赖时混合格式图会炸，炸在哪一处随版本而变。
// 只测了 Node 26 就断言"本地绿、CI 红"是错的：这条路径上根本不存在"本地绿"。
// JSON 两种加载器都能读，所以数字下沉成 `.json`、派生逻辑留在 `.mjs`。
import ports from "./scripts/ports.json";

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
    baseURL: `http://localhost:${ports.web}`,
    trace: "retain-on-failure",
    locale: "zh-CN",
  },
  webServer: [
    {
      command: `uv run uvicorn app.main:app --port ${ports.api}`,
      cwd: "backend",
      url: `http://localhost:${ports.api}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { DATABASE_URL: E2E_DATABASE_URL },
    },
    {
      command: "pnpm --filter @axiforge/web dev",
      url: `http://localhost:${ports.web}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
