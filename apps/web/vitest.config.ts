import { defineConfig } from "vitest/config";
import path from "path";

/**
 * 纯逻辑单测配置（Phase 1a 安全网）。
 * 只覆盖零 React/DOM 的模块（projection 等）；组件测试随 Phase 1b editor-core 抽取后再议。
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
      "@axiforge/core": path.resolve(__dirname, "../../packages/core/src"),
      "@axiforge/axs": path.resolve(__dirname, "../../packages/axs/src"),
      "@axiforge/editor-core": path.resolve(__dirname, "../../packages/editor-core/src"),
    },
  },
});
