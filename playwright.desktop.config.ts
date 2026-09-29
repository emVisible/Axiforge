import { defineConfig } from "@playwright/test";

/**
 * 桌面态基线（S13-5 的后半第一步）：**只起 vite，不起 uvicorn。**
 * 理由不是省事，而是不变量②的落地顺序——后端退场（S13-6）会在启动阶段打掉
 * 绑着 `webServer: uvicorn` 的整条基线，所以「桌面那一半」必须先能独立活着。
 * 这里跑的用例如果偷偷依赖后端，就会在这一份配置下红——那正是我们要的信号。
 */
export default defineConfig({
  testDir: "e2e",
  /*
   * 后端基线（E1..E13）留在 `playwright.config.ts` 里——那一份起 uvicorn。
   * 实测：去掉这条 testIgnore 时，无后端跑 38 条会红 12 条，且**全部**来自 baselines.spec.ts；
   * 桌面那一族（E14/E15/E17/E18/E19/E20/E21/E22）在无后端下 26 条全绿。
   */
  testIgnore: /baselines/,
  /* 无后端就是这一份配置的意义，端口 8000 若被占用要说清楚而不是静默连上去 */
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5174" },
  webServer: {
    command: "pnpm --filter @axiforge/web dev",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
