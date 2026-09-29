import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
      // G2：这是引擎不是业务代码。阈值写在这里但此前没人跑——`pnpm gates` 用的是
      // 不带 --coverage 的 test:unit，所以 90/90 一直是纸面门禁。现在挂进 gates 了。
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
