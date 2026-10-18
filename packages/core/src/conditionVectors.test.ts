import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compare } from "./conditions";

/**
 * 条件比较的**跨实现共享向量**（TS 这一半）。
 *
 * 2026-10-01 复审补上。起因是量到一个**零覆盖的孪生实现**：
 * `compare` 的语义在两个后端各手写一份——
 * TS `packages/core/src/conditions.ts::compare`（有判据：`conditions.test.ts` 37 条）
 * 与 Python `backend/app/domains/runtime/service.py::RuntimeService._compare`（**此前一条判据都没有**，
 * 而它被那 4 个 `_match_*` 分支调用）。上一轮修 `>=` / `<=` 缺失时，Python 那一侧只能靠
 * 「用 `.venv` 直调一次取数」来验，**取过数不等于有判据**——下一次谁动它仍然无人拦。
 *
 * 做法沿用本仓已确立的模式（先例：`testdata/axs-draft/*.json` 被 `packages/axs` 与
 * `backend/tests/test_axs_draft_vectors.py` 同跑）：**一份向量、两个消费者**。
 *
 * **权威不归任何一侧**：向量每条都写死 `want`，且只收答案无歧义的形状，
 * 所以它是规格而不是"某侧的现状快照"。这一点与 AXS 草稿向量那批不同（那批是拿 TS 的
 * canonical 解析器裁决合法性），所以这里刻意**不**把 `conditions.test.ts` 的断言搬进向量——
 * 那是实现自己的期望，不是跨实现的规格。
 *
 * 牙：把 `gte` 的实现退回成 `gt`（即上一轮那个缺陷的原形状）⇒ 本文件与 Python 侧同时红。
 */
const VECTOR_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../testdata/conditions/compare.json",
);

interface VectorCase {
  readonly id: string;
  readonly actual: unknown;
  readonly operator: Parameters<typeof compare>[1];
  readonly expected: unknown;
  readonly want: boolean;
}

const vector = JSON.parse(readFileSync(VECTOR_PATH, "utf8")) as {
  cases: VectorCase[];
};

describe("条件比较 · 跨实现共享向量（TS 半边）", () => {
  // 分母守卫：向量被清空或读错路径时，这条红——否则下面会"全绿"而一条都没跑
  it("向量非空且读到了预期规模", () => {
    expect(Array.isArray(vector.cases)).toBe(true);
    expect(vector.cases.length).toBeGreaterThanOrEqual(30);
  });

  for (const c of vector.cases) {
    it(c.id, () => {
      expect(compare(c.actual, c.operator, c.expected)).toBe(c.want);
    });
  }
});
