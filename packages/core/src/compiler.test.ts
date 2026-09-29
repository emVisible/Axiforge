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

/**
 * 场景解析的三条优先级——金样本里从来没有一条工程带 sceneRef，
 * 所以这一段一直没被测过，TS 与 Python 就此分叉过（桌面导入的舞台没背景，
 * 同一份数据经后端编译却有）。金样本证明"当前两边一致"，证明不了"这条分支两边都走"。
 */
describe("场景引用解析（对齐 Python _build_scenes）", () => {
  const baseInput = () =>
    JSON.parse(
      readFileSync(join(GOLDEN_DIR, cases[0]!, "input.json"), "utf-8"),
    ) as CompilerProjectInput;

  const sceneOf = (s: CompilerProjectInput["scenes"][number]) => {
    const pkg = compileStory({ ...baseInput(), scenes: [s] });
    return pkg.scenes[0]!;
  };

  it("舞台自身有值时用自身的，不被资产池覆盖", () => {
    expect(
      sceneOf({
        id: "s1", title: "地窖", location: "正门侧",
        sceneRef: { location: "方舟·地下", imagePath: "assets/a.png" },
      }).location,
    ).toBe("正门侧");
  });

  it("空串算没值——Python 的 `or` 如此，用 `??` 就会桌面空白而网页出图", () => {
    const s = sceneOf({
      id: "s1", title: "地窖", location: "", atmosphere: "",
      sceneRef: { location: "方舟·地下", atmosphere: "潮、暗", imagePath: "assets/a.png" },
    });
    expect(s.location).toBe("方舟·地下");
    expect(s.atmosphere).toBe("潮、暗");
  });

  it("背景图只来自资产池；没有引用就是 null", () => {
    expect(
      sceneOf({ id: "s1", title: "独立舞台", sceneRef: { imagePath: "assets/b.png" } })
        .backgroundImage,
    ).toBe("assets/b.png");
    expect(sceneOf({ id: "s2", title: "无引用" }).backgroundImage).toBeNull();
  });
});

/**
 * 道具引用编译（对齐 Python `_build_items`）。同上一条的立项理由：
 * 三份金样本的 `items` 全是 0，这条分支两侧都没被走过，于是桌面投影层
 * 恒写 `items: []`（S13-2c 之前的形状）没有被任何门禁抓住——编排台挂的道具
 * 在桌面试玩里一个都不出现。引擎其实早就实现了「悬空即跳过」，缺的是有人按这条规则测它。
 */
describe("道具引用编译（对齐 Python _build_items）", () => {
  const baseInput = () =>
    JSON.parse(
      readFileSync(join(GOLDEN_DIR, cases[0]!, "input.json"), "utf-8"),
    ) as CompilerProjectInput;

  const itemsOf = (
    items: CompilerProjectInput["items"],
  ) => compileStory({ ...baseInput(), items }).items;

  it("引用+本体 → ItemRef 逐字段映射，顺序就是引用的顺序（不去重）", () => {
    expect(
      itemsOf([
        { id: "r1", assetId: "i1", asset: { id: "i1", name: "铜钥匙", category: "关键道具", imagePath: "assets/k.png" } },
        { id: "r2", assetId: "i1", asset: { id: "i1", name: "铜钥匙", category: "关键道具", imagePath: null } },
      ]),
    ).toEqual([
      { id: "i1", name: "铜钥匙", category: "关键道具", imagePath: "assets/k.png" },
      { id: "i1", name: "铜钥匙", category: "关键道具", imagePath: null },
    ]);
  });

  it("本体已删（asset=null）如实缺席，不占一个空位；空清单就是空清单", () => {
    expect(itemsOf([{ id: "r1", assetId: "gone", asset: null }])).toEqual([]);
    expect(itemsOf([])).toEqual([]);
  });

  it("缺 category 给 null 而不是 undefined——IR 要与 Python 的字段集合逐字一致", () => {
    expect(itemsOf([{ id: "r1", assetId: "i9", asset: { id: "i9", name: "油灯" } }])).toEqual([
      { id: "i9", name: "油灯", category: null, imagePath: null },
    ]);
  });
});
