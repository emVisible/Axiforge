import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileStory, type CompilerProjectInput } from "./compiler";
import type { StoryPackage } from "./ir";

/**
 * 金样本验收（宪章 G6）：对真实工程（含示范作 codex 场景），
 * TS compileStory 输出与 Python StoryCompiler 输出逐字段一致。
 * 金样本再生成：backend/scripts/dump_golden.py <project_id>...
 */

const GOLDEN_DIR = join(import.meta.dirname, "__golden__");

function canonicalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val !== undefined) out[k] = canonicalize(val);
    }
    return out;
  }
  return v;
}

const cases = readdirSync(GOLDEN_DIR).filter((d) => !d.startsWith("."));

describe.each(cases)("StoryCompiler 金样本 · %s", (dir) => {
  const input = JSON.parse(
    readFileSync(join(GOLDEN_DIR, dir, "input.json"), "utf-8"),
  ) as CompilerProjectInput;
  const expected = JSON.parse(
    readFileSync(join(GOLDEN_DIR, dir, "expected.json"), "utf-8"),
  ) as StoryPackage;

  it("compileStory 输出与 Python 编译器逐字段一致", () => {
    const actual = compileStory(input);
    expect(canonicalize(actual)).toEqual(canonicalize(expected));
  });

  it("结构健全：startBeat 存在且 beats/transitions 引用一致", () => {
    const pkg = compileStory(input);
    expect(pkg.startBeatId).toBeTruthy();
    const beatIds = new Set(pkg.beats.map((b) => b.id));
    expect(beatIds.has(pkg.startBeatId!)).toBe(true);
    for (const t of pkg.transitions) {
      expect(beatIds.has(t.from)).toBe(true);
      expect(beatIds.has(t.to)).toBe(true);
    }
  });
});
