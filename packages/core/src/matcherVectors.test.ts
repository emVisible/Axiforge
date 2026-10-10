import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./conditions";
import { emptyVariables, type Condition, type RuntimeVariables } from "./ir";

/**
 * 条件**匹配层**的跨实现共享向量（TS 这一半）。
 *
 * 2026-10-01 复审补上，补的是上一轮登记的那条欠账：`{"_value": x}` 单键解包在 TS 是一个 `unwrap`
 * helper、在 Python 是**内联在 `_match_memory` 与 `_match_flag` 两处**——形状不同、行为一致，
 * 而 `compare.json` 只锁了 `compare` 那一半，解包与「键缺席 ⇒ `operator === "ne"`」都在规格之外。
 *
 * **两侧的存储形状本来就不同，所以向量要带一次翻译**（消费者各翻各的）：
 * TS 的 `vars.memory` / `vars.flags` 是字典（`key in vars`），
 * Python 那边是行列表（`for m in memories: if m.key == key`）。
 * 向量只描述「键 + 存储形态 + 条件」，`stored` 是**存储形态本身**
 * （即已经决定要不要包 `{"_value": …}`）——若写成解包后的值，这条向量会把自己要锁的东西先假设掉。
 *
 * 与 `compare.json` 同一个约定：**权威不归任何一侧**，每条写死 `want`，只收答案无歧义的形状。
 *
 * 牙：把 `unwrap` 改成"两键也解包" ⇒ 本文件与 Python 侧同时红；
 * 把「键缺席 ⇒ `operator === "ne"`」改成恒假 ⇒ 同样两端红。
 */
const VECTOR_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../testdata/conditions/matcher.json",
);

interface MatcherCase {
  readonly id: string;
  readonly source: "memory" | "flag" | "character_state";
  readonly key: string;
  readonly stored?: unknown;
  /** true = 这个键/这一行**根本不存在**（与「键在场但值是 null」是两件事） */
  readonly absent?: boolean;
  /** `character_state` 族专用：角色状态字典（= Python 那侧的行属性 + custom_state 合并后的形状） */
  readonly chars?: Record<string, Record<string, unknown>>;
  /** `character_state` 族专用：只在 Python 的 `custom_state` 回退源里、TS 侧不存在 */
  readonly custom?: Record<string, unknown>;
  readonly condition: Condition;
  readonly want: boolean;
}

const vector = JSON.parse(readFileSync(VECTOR_PATH, "utf8")) as {
  matcherCases: MatcherCase[];
};

/**
 * 把向量的一行翻译成 TS 侧的 `RuntimeVariables`（字典形状）。
 *
 * **注意条件 type 与容器字段不同名**：`flag`（条件里的 type）对 `flags`（`RuntimeVariables` 的字段）。
 * 写消费者时先按 `c.source` 直接索引会拿到 `undefined` —— 这条不对称是判据自己报出来的，
 * 顺带记在这里，免得下一个消费者再踩。
 */
const SOURCE_TO_FIELD = { memory: "memory", flag: "flags" } as const;

function varsFor(c: MatcherCase): RuntimeVariables {
  const vars = emptyVariables();
  if (c.source === "character_state") {
    // TS 侧没有 custom_state 这一层：向量里的 `custom` 在这里是**已经并进 chars 的**，
    // 因为 TS 的 `!(field in state)` 把两层看成同一层（形状翻译，不是语义翻译）
    for (const [id, st] of Object.entries(c.chars ?? {})) {
      vars.characters[id] = { ...(c.custom ?? {}), ...st };
    }
    return vars;
  }
  // `absent` 时**不插这个键**——插了就是「在场为 null」，测不到缺席那条语义
  if (!c.absent) vars[SOURCE_TO_FIELD[c.source]][c.key] = c.stored;
  return vars;
}

describe("条件匹配 · 跨实现共享向量（TS 半边）", () => {
  it("向量非空且读到了预期规模", () => {
    expect(Array.isArray(vector.matcherCases)).toBe(true);
    expect(vector.matcherCases.length).toBeGreaterThanOrEqual(21);
  });

  for (const c of vector.matcherCases) {
    it(c.id, () => {
      expect(evaluateCondition(c.condition, varsFor(c))).toBe(c.want);
    });
  }
});
