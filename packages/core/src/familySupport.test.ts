import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./conditions";
import { emptyVariables } from "./ir";

/**
 * 条件**族支持清单**（TS 这一半）——`testdata/conditions/families.json`。
 *
 * 2026-10-01 复审量出来的：TS 求值 **7 族**，而 Python 那一侧只求值 **4 族**，
 * `relationship` / `achievement` / `codex` 落到末尾的 `return False`。
 * 后果是**同一份 AXS 在两端行为不同**：被 `[if: relationship …]` 门控的分支，
 * 在 TS 引擎会打开、经后端播放时**永远打不开**，而两边都报成功、零诊断。
 *
 * **为什么不把后三族补进 Python**：那个后端正在退场（ADR-029 桌面唯一化、S13-6 删 `backend/`），
 * 给将死的后端加功能等于**扩大删除面**。TS 是对的一侧。
 *
 * 本文件只钉**TS 侧**（"这些族确实被求值"），防止 TS 悄悄丢掉某一族；
 * Python 那一侧的断言在 `backend/tests/test_condition_family_support.py`，
 * 它是**绊线**：有人真去实现某一族时那条会红，逼他同时更新这份清单与 ADR/S13-6
 * ——**分叉要变成一次显式决定，而不是一个安静的洞**。
 */
const VECTOR_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../testdata/conditions/families.json",
);

interface FamilyRow {
  readonly type: string;
  readonly ts: "evaluated" | "false";
  readonly python: "evaluated" | "false";
  /** 该族"必然为真"的探针：条件 + 需要预置的变量（逐族不同，见向量 _note） */
  readonly probe: {
    readonly cond: unknown;
    readonly vars?: Record<string, Record<string, unknown>>;
    readonly completed?: string[];
    readonly unlocked?: string[];
    readonly codex?: Record<string, Record<string, unknown>>;
  };
}

const inventory = JSON.parse(readFileSync(VECTOR_PATH, "utf8")) as {
  families: FamilyRow[];
  groupTypes: { ts: string[]; python: string[] };
};

/** 按向量给的探针预置运行时变量（**逐族不同**——第一版套同一个 key 就测错了族） */
function contextFor(p: FamilyRow["probe"]) {
  const vars = emptyVariables();
  for (const [k, v] of Object.entries(p.vars ?? {})) {
    (vars as unknown as Record<string, unknown>)[k] = v;
  }
  return {
    vars,
    completed: new Set(p.completed ?? []),
    unlocked: new Set(p.unlocked ?? []),
    codex: p.codex ?? {},
  };
}

describe("条件族支持清单 · TS 半边", () => {
  it("清单非空且两端族名一致（改名要两处一起改）", () => {
    expect(inventory.families.length).toBeGreaterThanOrEqual(7);
    for (const row of inventory.families) {
      expect(row.python, `${row.type} 的 python 列缺失`).toBeDefined();
    }
  });

  it("清单里声明 TS 会求值的每一族，TS 确实会求值（不静默丢族）", () => {
    for (const row of inventory.families.filter((f) => f.ts === "evaluated")) {
      const ctx = contextFor(row.probe);
      const got = evaluateCondition(row.probe.cond as never, ctx.vars, ctx.completed, ctx.codex, ctx.unlocked);
      expect(got, `${row.type} 在清单里声明 TS 会求值，但实测返回 ${got}`).toBe(true);
    }
  });

  it("组类型两端一致（曾怀疑 TS 用 not、Python 用 none——实测都是 none）", () => {
    expect(inventory.groupTypes.ts.slice().sort()).toEqual(
      inventory.groupTypes.python.slice().sort(),
    );
  });
});
