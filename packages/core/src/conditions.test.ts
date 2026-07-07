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

describe("cloneVariables", () => {
  it("深拷贝 characters 子对象", () => {
    const vars: RuntimeVariables = { memory: {}, flags: {}, characters: { c1: { mood: "x" } } };
    const copy = cloneVariables(vars);
    copy.characters.c1.mood = "y";
    expect(vars.characters.c1.mood).toBe("x");
  });
});
