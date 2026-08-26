import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text"],
      include: ["src/**"],
      exclude: ["src/**/*.test.ts"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
