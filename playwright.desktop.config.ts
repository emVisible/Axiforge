import { defineConfig } from "@playwright/test";
// 端口真相源见 scripts/ports.json；这里读 JSON 而非 ports.mjs 的原因与 playwright.config.ts 同（CJS 加载器）
import ports from "./scripts/ports.json";

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
   * 实测（2026-09-30 复量）：浏览器态那一套是 50 tests / 3 files，其中 `baselines.spec.ts` 13 条；
   * 去掉这条 testIgnore 后，无后端跑同一批就是这 13 条红，其余 **37 条**（桌面那一族）全绿。
   * 所以「删后端会打掉整条基线」这句旧说法已经收窄成「会打掉这 13 条」——归谁属 S13-6 的定档题。
   */
  testIgnore: /baselines/,
  /* 无后端就是这一份配置的意义，api 端口若被占用要说清楚而不是静默连上去 */
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${ports.web}` },
  webServer: {
    command: "pnpm --filter @axiforge/web dev",
    url: `http://localhost:${ports.web}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
