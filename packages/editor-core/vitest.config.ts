import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text"],
      include: ["src/**"],
      // contract*.ts 是契约用例的**运行器**（只在 vitest 里执行，不随应用出货），
      // 里面大量 `if (!r.ok) expect(...) else throw` 天生只有一侧会被走到。
      // 拆分前它叫 contract.ts 且已在排除列表里；分成三个文件时列表没跟着改，
      // 于是 39 条「测试脚手架的分支」被算进生产分母——分母错了，数字就没有意义。
      exclude: ["src/**/*.test.ts", "src/storage/contract*.ts"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
