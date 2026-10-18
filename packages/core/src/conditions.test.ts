import { describe, it, expect } from "vitest";
import {
  compare,
  evaluateCondition,
  applyEffects,
  applyCodexWrites,
  cloneVariables,
} from "./conditions";
import { emptyVariables, type RuntimeVariables } from "./ir";

describe("compare", () => {
  it("eq: 值相等或字符串相等", () => {
    expect(compare(1, "eq", 1)).toBe(true);
    expect(compare("1", "eq", 1)).toBe(true); // 字符串归一
    expect(compare("a", "eq", "b")).toBe(false);
  });

  it("bool 归一化：字符串 true/false ↔ 布尔", () => {
    expect(compare(true, "eq", "true")).toBe(true);
    expect(compare("false", "eq", false)).toBe(true);
    expect(compare(true, "ne", "false")).toBe(true);
  });

  it("gt / lt: 数值比较", () => {
    expect(compare(5, "gt", 3)).toBe(true);
    expect(compare("5", "gt", "3")).toBe(true);
    expect(compare(2, "lt", 10)).toBe(true);
    expect(compare("x", "gt", 1)).toBe(false); // 非数值
  });

  it("contains: 数组与字符串", () => {
    expect(compare(["a", "b"], "contains", "a")).toBe(true);
    expect(compare("hello", "contains", "ell")).toBe(true);
    expect(compare(123, "contains", "1")).toBe(false);
  });
});

describe("evaluateCondition", () => {
  const vars: RuntimeVariables = {
    memory: { saved_alice: true, coins: 10, wrapped: { _value: "x" } },
    flags: { intro_done: true },
    characters: { c1: { mood: "happy", affection: 50 } },
    relationships: {},
  };

  it("空条件视为满足", () => {
    expect(evaluateCondition(null, vars)).toBe(true);
    expect(evaluateCondition(undefined, vars)).toBe(true);
  });

  it("memory 原子条件 + _value 解包", () => {
    expect(
      evaluateCondition({ type: "memory", key: "saved_alice", operator: "eq", value: true }, vars),
    ).toBe(true);
    expect(
      evaluateCondition({ type: "memory", key: "wrapped", operator: "eq", value: "x" }, vars),
    ).toBe(true);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "gt", value: 5 }, vars),
    ).toBe(true);
  });

  it("gte/lte 在边界上必须与 gt/lt 不同（#82：`>=` 曾被静默降成 eq）", () => {
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "gte", value: 10 }, vars),
    ).toBe(true);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "gt", value: 10 }, vars),
    ).toBe(false);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "gte", value: 11 }, vars),
    ).toBe(false);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "lte", value: 10 }, vars),
    ).toBe(true);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "lt", value: 10 }, vars),
    ).toBe(false);
    expect(
      evaluateCondition({ type: "memory", key: "coins", operator: "lte", value: 9 }, vars),
    ).toBe(false);
  });

  it("缺失 key：ne 为真，其它为假", () => {
    expect(evaluateCondition({ type: "memory", key: "nope", operator: "ne", value: 1 }, vars)).toBe(true);
    expect(evaluateCondition({ type: "memory", key: "nope", operator: "eq", value: 1 }, vars)).toBe(false);
  });

  it("flag 条件", () => {
    expect(evaluateCondition({ type: "flag", key: "intro_done", operator: "eq", value: true }, vars)).toBe(true);
  });

  it("character_state: charId.field 解析", () => {
    expect(evaluateCondition({ type: "character_state", key: "c1.mood", operator: "eq", value: "happy" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "character_state", key: "c1.affection", operator: "gt", value: 30 }, vars)).toBe(true);
    expect(evaluateCondition({ type: "character_state", key: "cX.mood", operator: "eq", value: "happy" }, vars)).toBe(false);
  });

  it("node_completed", () => {
    const completed = new Set(["beat_a"]);
    expect(evaluateCondition({ type: "node_completed", value: "beat_a" }, vars, completed)).toBe(true);
    expect(evaluateCondition({ type: "node_completed", value: "beat_z" }, vars, completed)).toBe(false);
  });

  it("codex: 跨作品记忆查询", () => {
    const codex = { char1: { met_before: true, affection: "80" } };
    expect(
      evaluateCondition(
        { type: "codex", key: "char1.met_before", operator: "eq", value: true },
        vars,
        new Set(),
        codex,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { type: "codex", key: "char1.affection", operator: "gt", value: 50 },
        vars,
        new Set(),
        codex,
      ),
    ).toBe(true);
  });

  it("组合条件 all / any / none", () => {
    const all = { type: "all" as const, conditions: [
      { type: "flag" as const, key: "intro_done", operator: "eq" as const, value: true },
      { type: "memory" as const, key: "coins", operator: "gt" as const, value: 5 },
    ]};
    expect(evaluateCondition(all, vars)).toBe(true);

    const any = { type: "any" as const, conditions: [
      { type: "flag" as const, key: "nope", operator: "eq" as const, value: true },
      { type: "memory" as const, key: "coins", operator: "gt" as const, value: 5 },
    ]};
    expect(evaluateCondition(any, vars)).toBe(true);

    const none = { type: "none" as const, conditions: [
      { type: "flag" as const, key: "nope", operator: "eq" as const, value: true },
    ]};
    expect(evaluateCondition(none, vars)).toBe(true);
  });
});

describe("evaluateCondition — 操作符与边界补全", () => {
  const vars: RuntimeVariables = {
    memory: { coins: 10, name: "alice", tags: ["brave", "kind"] },
    flags: { intro_done: true },
    characters: { c1: { mood: "happy", affection: 50 } },
    relationships: {},
  };

  it("ne: 存在且不等为真，相等为假", () => {
    expect(evaluateCondition({ type: "memory", key: "name", operator: "ne", value: "bob" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "memory", key: "name", operator: "ne", value: "alice" }, vars)).toBe(false);
  });

  it("lt: 假路径", () => {
    expect(evaluateCondition({ type: "memory", key: "coins", operator: "lt", value: 5 }, vars)).toBe(false);
  });

  it("contains: memory 数组成员", () => {
    expect(evaluateCondition({ type: "memory", key: "tags", operator: "contains", value: "brave" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "memory", key: "tags", operator: "contains", value: "evil" }, vars)).toBe(false);
  });

  it("character_state: 畸形 key（无点）按缺失处理", () => {
    expect(evaluateCondition({ type: "character_state", key: "c1", operator: "ne", value: "x" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "character_state", key: "c1", operator: "eq", value: "x" }, vars)).toBe(false);
    expect(evaluateCondition({ type: "character_state", operator: "eq", value: "x" }, vars)).toBe(false);
  });

  it("node_completed: value 缺省为假", () => {
    expect(evaluateCondition({ type: "node_completed" }, vars, new Set(["a"]))).toBe(false);
  });

  it("组合：any 全假 / none 命中 / all 有假", () => {
    const anyFalse = { type: "any" as const, conditions: [
      { type: "flag" as const, key: "nope", operator: "eq" as const, value: true },
      { type: "memory" as const, key: "coins", operator: "lt" as const, value: 5 },
    ]};
    expect(evaluateCondition(anyFalse, vars)).toBe(false);

    const noneHit = { type: "none" as const, conditions: [
      { type: "flag" as const, key: "intro_done", operator: "eq" as const, value: true },
    ]};
    expect(evaluateCondition(noneHit, vars)).toBe(false);

    const allWithFalse = { type: "all" as const, conditions: [
      { type: "flag" as const, key: "intro_done", operator: "eq" as const, value: true },
      { type: "memory" as const, key: "coins", operator: "gt" as const, value: 100 },
    ]};
    expect(evaluateCondition(allWithFalse, vars)).toBe(false);
  });
});

describe("compare — 剩余分支", () => {
  it("ne 数值不等", () => {
    expect(compare(1, "ne", 2)).toBe(true);
    expect(compare(1, "ne", 1)).toBe(false);
  });
  it("gt/lt 缺失可比性返回假", () => {
    expect(compare(null, "gt", 1)).toBe(false);
    expect(compare(1, "lt", null)).toBe(false);
  });
  it("contains 非数组非字符串返回假", () => {
    expect(compare({ a: 1 }, "contains", "a")).toBe(false);
  });
});

describe("applyEffects", () => {
  it("不修改入参，返回新对象", () => {
    const vars = emptyVariables();
    const next = applyEffects(vars, [{ type: "flag", key: "met", value: true }]);
    expect(vars.flags.met).toBeUndefined();
    expect(next.flags.met).toBe(true);
  });

  it("memory / flag / character_state 三类效果", () => {
    let vars = emptyVariables();
    vars = applyEffects(vars, [
      { type: "memory", key: "ending", value: "good" },
      { type: "flag", key: "seen", value: true },
      { type: "character_state", key: "c1.affection", value: 20 },
    ]);
    expect(vars.memory.ending).toBe("good");
    expect(vars.flags.seen).toBe(true);
    expect(vars.characters.c1.affection).toBe(20);
  });

  it("空效果原样返回", () => {
    const vars = emptyVariables();
    expect(applyEffects(vars, undefined)).toBe(vars);
    expect(applyEffects(vars, [])).toBe(vars);
  });

  it("character_state 畸形 key（无点）跳过，不影响其它效果", () => {
    let vars = emptyVariables();
    vars = applyEffects(vars, [
      { type: "character_state", key: "badkey", value: 1 },
      { type: "flag", key: "ok", value: true },
    ]);
    expect(vars.flags.ok).toBe(true);
    expect(Object.keys(vars.characters)).toHaveLength(0);
  });

  it("codex_write 由 applyCodexWrites 处理", () => {
    const codex = applyCodexWrites({}, [
      { type: "codex_write", key: "c1.saved", value: true },
      { type: "codex_write", key: "c1.route", value: "good" },
    ]);
    expect(codex.c1.saved).toBe(true);
    expect(codex.c1.route).toBe("good");
    let vars = emptyVariables();
    vars = applyEffects(vars, [
      { type: "codex_write", key: "c1.x", value: 1 },
      { type: "flag", key: "ok", value: true },
    ]);
    expect(vars.flags.ok).toBe(true);
  });
});

describe("relationship 关系维度（RN 闭环 S1-T3a）", () => {
  it("apply 写入 relationships 三段桶且不修改入参", () => {
    const vars = emptyVariables();
    const next = applyEffects(vars, [
      { type: "relationship", key: "yansha.player.trust", value: "high" },
    ]);
    expect(vars.relationships.yansha).toBeUndefined();
    expect(next.relationships.yansha.player.trust).toBe("high");
  });

  it("evaluate 按 charA.charB.field 求值", () => {
    let vars = emptyVariables();
    vars = applyEffects(vars, [
      { type: "relationship", key: "yansha.player.trust", value: "high" },
    ]);
    expect(
      evaluateCondition(
        { type: "relationship", key: "yansha.player.trust", operator: "eq", value: "high" },
        vars,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { type: "relationship", key: "yansha.player.trust", operator: "eq", value: "low" },
        vars,
      ),
    ).toBe(false);
  });

  it("缺失桶时 eq 为 false、ne 为 true；畸形 key 跳过", () => {
    const vars = emptyVariables();
    expect(
      evaluateCondition(
        { type: "relationship", key: "a.b.trust", operator: "eq", value: "high" },
        vars,
      ),
    ).toBe(false);
    expect(
      evaluateCondition(
        { type: "relationship", key: "a.b.trust", operator: "ne", value: "high" },
        vars,
      ),
    ).toBe(true);
    const next = applyEffects(vars, [
      { type: "relationship", key: "badkey", value: 1 },
    ]);
    expect(Object.keys(next.relationships)).toHaveLength(0);
  });
});

describe("cloneVariables", () => {
  it("深拷贝 characters 子对象", () => {
    const vars: RuntimeVariables = { memory: {}, flags: {}, characters: { c1: { mood: "x" } }, relationships: {} };
    const copy = cloneVariables(vars);
    copy.characters.c1.mood = "y";
    expect(vars.characters.c1.mood).toBe("x");
  });
});

/**
 * 「读不到」的语义此前一条用例都没盖（conditions.ts 分支 88.23%）。
 * 它不是细节而是判据：条件里没写 key、key 形状不对、引用的角色/关系/账本条目不存在时，
 * Python 与 TS 都只把 `ne` 算真、其余算假——写反一处，桌面与云端的分支就会分岔。
 */
describe("evaluateCondition — 缺席只喂 ne", () => {
  const vars: RuntimeVariables = {
    memory: {}, flags: {},
    characters: { c1: { mood: "晴" } },
    relationships: { c1: { c2: { trust: 3 } } },
  };

  it("memory / flag 缺 key 或键不存在：eq 假、ne 真", () => {
    expect(evaluateCondition({ type: "memory", operator: "eq", value: 1 }, vars)).toBe(false);
    expect(evaluateCondition({ type: "memory", operator: "ne", value: 1 }, vars)).toBe(true);
    expect(evaluateCondition({ type: "flag", key: "nope", operator: "eq", value: true }, vars)).toBe(false);
    expect(evaluateCondition({ type: "flag", key: "nope", operator: "ne", value: true }, vars)).toBe(true);
  });

  it("character_state 与 relationship 的 key 形状不对：同样只喂 ne", () => {
    expect(evaluateCondition({ type: "character_state", key: "没有点号", operator: "ne" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "character_state", key: "c1.mood", operator: "eq", value: "晴" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "relationship", key: "c1.c2", operator: "ne" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "relationship", key: "c1.c2.trust", operator: "lt", value: 5 }, vars)).toBe(true);
    expect(evaluateCondition({ type: "relationship", key: "c1.c9.trust", operator: "ne" }, vars)).toBe(true);
    expect(evaluateCondition({ type: "relationship", key: "c1.c9.trust", operator: "eq", value: 1 }, vars)).toBe(false);
  });

  it("codex 键要写成 characterRefId.memoryKey；账本里没有时只喂 ne", () => {
    const ledger = { c1: { met: true } };
    expect(evaluateCondition({ type: "codex", key: "c1.met", operator: "eq", value: true }, vars, new Set(), ledger)).toBe(true);
    expect(evaluateCondition({ type: "codex", key: "缺点号", operator: "ne" }, vars, new Set(), ledger)).toBe(true);
    expect(evaluateCondition({ type: "codex", key: "缺点号", operator: "eq", value: true }, vars, new Set(), ledger)).toBe(false);
    expect(evaluateCondition({ type: "codex", key: "c1.absent", operator: "ne" }, vars, new Set(), ledger)).toBe(true);
    expect(evaluateCondition({ type: "codex", key: "c9.met", operator: "eq", value: true }, vars, new Set(), ledger)).toBe(false);
  });

  it("achievement 认已解锁集合；node_completed 没给 value 一律假；未知类型假", () => {
    expect(evaluateCondition({ type: "achievement", key: "first" }, vars, new Set(), {}, new Set(["first"]))).toBe(true);
    expect(evaluateCondition({ type: "achievement", key: "" }, vars, new Set(), {}, new Set(["first"]))).toBe(false);
    expect(evaluateCondition({ type: "node_completed", value: "b1" }, vars, new Set(["b1"]))).toBe(true);
    expect(evaluateCondition({ type: "node_completed" }, vars, new Set(["b1"]))).toBe(false);
    expect(evaluateCondition({ type: "relationship" } as never, vars)).toBe(false);
  });

  it("条件组只认 all / any / none；写了别的类型算假而不是当作通过", () => {
    const atom = { type: "flag", key: "k", operator: "eq", value: true } as const;
    const withFlag: RuntimeVariables = { ...vars, flags: { k: true } };
    expect(evaluateCondition({ type: "all", conditions: [atom] }, withFlag)).toBe(true);
    expect(evaluateCondition({ type: "any", conditions: [atom] }, withFlag)).toBe(true);
    expect(evaluateCondition({ type: "none", conditions: [atom] }, vars)).toBe(true);
    // 组与成员都在第一个参数里：写错位置的调用不算通过（这条判据本身也要能被证伪）
    // 带着 conditions 但 type 不在 all/any/none 里的对象**不算组**（isGroup 两个条件都要成立），
    // 于是它落到原子求值的 default 分支——组里那条 `default:` 结构上不可达，
    // 不去假装有覆盖，只把「未知类型一律假」这条真能走到的路钉住。
    expect(evaluateCondition({ type: "全部", conditions: [atom] } as never, withFlag)).toBe(false);
  });

  it("cloneVariables 把 relationships 的两层桶也复制成新对象（纯函数不得共享引用）", () => {
    const withRel: RuntimeVariables = { ...vars, relationships: { c1: { c2: { trust: 3 } } } };
    const copy = cloneVariables(withRel);
    copy.relationships!.c1.c2.trust = 99;
    expect(withRel.relationships!.c1.c2.trust).toBe(3);
    copy.characters.c1.mood = "雨";
    expect(withRel.characters.c1.mood).toBe("晴");
  });
});
