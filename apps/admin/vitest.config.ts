import { defineConfig } from "vitest/config";
import path from "path";

/**
 * 中台的纯逻辑单测（与 `apps/web/vitest.config.ts` 同一套约定：node 环境，只测零 DOM 模块）。
 *
 * 为什么值得单独一套：`src/lib/moderation.ts` 是判断层在界面上的最后一道翻译——
 * `via` 的前缀解析、未知名落回内部 id、标定覆盖面的三态。这些分支错一格，
 * 表现是"运营看到一句错的结论"，而 tsc 与浏览器实点都测不到它。
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@axiforge/ui": path.resolve(__dirname, "../../packages/ui"),
    },
  },
});
