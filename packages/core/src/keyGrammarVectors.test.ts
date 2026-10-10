import { describe, expect, it } from "vitest";

import { applyCodexWrites, applyEffects, evaluateCondition } from "./conditions";
import { emptyVariables } from "./ir";
import type { Condition, Effect, RuntimeVariables } from "./ir";
import families from "../../../testdata/conditions/families.json" with { type: "json" };

/**
 * 条件**键语法 + 写读往返**的跨实现无关判据（TS 半边）。
 *
 * 与另两份向量分工：
 * - `conditionVectors.test.ts`：两端都求值的族，**逐条件**对齐求值结果；
 * - `matcherVectors.test.ts`：两端都求值的族，锁**单条匹配**（含键缺席、值是 null）；
 * - 本文件：锁**键怎么分段**以及**写进去的值能不能按同一个键读回来**。
 *
 * 为什么单独一份：`relationship` / `codex` 在 Python 侧**不存在**，
 * 所以跨实现向量覆盖不到它们的键语法；而"写读是否配套"这件事**只有走一遍 effect 才测得到**
 * ——只测读侧的话，"写侧丢第 4 段、读侧也丢第 4 段"这种配套的丢弃会被误当成正确。
 *
 * 本文件只锁**现状**，不锁"应该怎样"。跨族键语法不一致（`character_state`/`codex` 允许键带点、
 * `relationship` 不允许且多出的段被静默丢弃）已登记为待定口径，见 HANDOFF §6。
 */

interface GrammarRow {
  readonly type: string;
  readonly rule: string;
  readonly segments: string;
}

interface RoundTripCase {
  readonly id: string;
  readonly effect: Effect;
  readonly read: Condition;
  readonly want: boolean;
}

const vector = families as unknown as {
  keyGrammar: GrammarRow[];
  roundTrip: RoundTripCase[];
};

function play(effect: Effect): { vars: RuntimeVariables; codex: Parameters<typeof applyCodexWrites>[0] } {
  const vars = applyEffects(emptyVariables(), [effect]);
  const codex = applyCodexWrites({}, [effect]);
  return { vars, codex };
}

describe("条件键语法 · 写读往返（TS 半边）", () => {
  it("向量本身没被掏空", () => {
    expect(vector.keyGrammar.length).toBeGreaterThanOrEqual(6);
    expect(vector.roundTrip.length).toBeGreaterThanOrEqual(8);
    // 每条都要写清分段规则，否则这文件只是在测"没崩"
    for (const g of vector.keyGrammar) expect(g.rule, `${g.type} 缺 rule`).toBeTruthy();
  });

  it("每写一条 effect，都能按同一个键原样读回来", () => {
    for (const c of vector.roundTrip) {
      const { vars, codex } = play(c.effect);
      expect(evaluateCondition(c.read, vars, new Set(), codex, new Set()), c.id).toBe(c.want);
    }
  });

  it("写侧丢段 / 读侧丢段必须成对（否则就是错配，而不是宽松）", () => {
    // 这条是本文件存在的理由：只测读侧看不出「两侧同规则地丢」和「两侧不同规则」的区别。
    // `relationship` 写 A.B.affection.mood 落进 `affection`（第 4 段被丢），
    // 于是**短名**读得到、长名也读得到——两者都读到同一格，这就是配套的证据。
    const eff: Effect = { type: "relationship", key: "A.B.affection.mood", value: 7 } as Effect;
    const { vars } = play(eff);
    expect(vars.relationships?.A?.B).toEqual({ affection: 7 });

    const short = evaluateCondition(
      { type: "relationship", key: "A.B.affection", operator: "gte", value: 7 } as Condition,
      vars,
      new Set(),
      {},
      new Set(),
    );
    const long = evaluateCondition(
      { type: "relationship", key: "A.B.affection.mood", operator: "gte", value: 7 } as Condition,
      vars,
      new Set(),
      {},
      new Set(),
    );
    expect([short, long]).toEqual([true, true]);

    // 对照：`character_state` 的字段名是「其余整体」，所以带点的字段名**真的存在**，
    // 短名读不到它——这不是错配，是两族键语法不同（待定口径）。
    const csEff: Effect = { type: "character_state", key: "A.affection.mood", value: 7 } as Effect;
    const csVars = applyEffects(emptyVariables(), [csEff]);
    expect(csVars.characters.A).toEqual({ "affection.mood": 7 });
    expect(
      evaluateCondition(
        { type: "character_state", key: "A.affection", operator: "gte", value: 7 } as Condition,
        csVars,
        new Set(),
        {},
        new Set(),
      ),
    ).toBe(false);
  });
});
