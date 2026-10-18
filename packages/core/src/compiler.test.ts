import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileStory, type CompilerProjectInput } from "./compiler";
import type { StoryPackage } from "./ir";

/**
 * 金样本验收（宪章 G6）：对真实工程（含示范作 codex 场景），
 * TS compileStory 输出与 Python StoryCompiler 输出逐字段一致。
 * 金样本再生成：backend/scripts/dump_golden.py <project_id>...
 *
 * **金样本是跨实现契约的枢轴，但它只被这一侧消费**（2026-10-01 复审实测登记）：
 * - 方向是**双向都变红**的：Python 改了而金样本没重生成 ⇒ 这里红；TS 改了 ⇒ 这里也红。
 *   这比"只有一侧有判据"要好，但**没有独立于枢轴的第三方校验**——
 *   换句话说，若有人同时改了两侧并顺手重生成金样本，这道门禁不会发现。
 * - Python 侧**另有 8 条**走真实 DB + HTTP 的集成测试（`backend/tests/test_story_compiler.py`：
 *   glossary、codex 去重、道具引用、私有门禁、fork/模板），所以 Python 不是裸的；
 *   缺的只是"这 4 份**真实工程**"这一层语料。
 * - 复审做过一次**免 DB 的差分**（直接喂 `input.json` 给 Python 的 `_build_script` /
 *   `_extract_actors` / `_pick_start_beat` / `_build_glossary`），与 `expected.json`
 *   在这四项上**零差异**——所以两侧今天是对齐的，这是登记，不是修法。
 * - **语料的一个盲区（量出来的）**：4 份金样本里 **3 份的 `glossary` 是 0 条**，
 *   只有 `b1a7c0d0-【对照】分支兜底` 那份带 2 条 ⇒ `buildGlossary` 的实际覆盖是 **1/4**。
 *   补语料要重跑 `dump_golden.py`（需要 DB），所以这里只登记分母、不假装已补。
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

/**
 * 编译器余下那些「金样本恰好不走」的分支（此前 compiler.ts 84.59% 语句 / 65.85% 分支）。
 * 三份示范作都是 script 数组写法、自动分支、无 glossary、无嵌套节点——于是旁白、
 * 手动选项、术语表、旧数据回退这些分支两侧各自演化而无人报警。
 * 判据来源是 Python 侧同名逻辑（_build_script / _build_glossary / 主循环的嵌套回退）。
 */
describe("编译器 — 叙事字段与分支回退", () => {
  const node = (
    id: string,
    narrativeData: Record<string, unknown>,
    sortOrder = 0,
    stageId: string | null = "s1",
  ) => ({ id, stageId, editorData: {}, narrativeData, sortOrder });

  const input = (over: Partial<CompilerProjectInput> = {}): CompilerProjectInput => ({
    id: "p1",
    title: "分支",
    worldSetting: null,
    playMeta: {},
    nodes: [],
    edges: [],
    scenes: [{ id: "s1", title: "场景" }],
    roles: [{ characterRefId: "c1" }],
    characters: [{ id: "c1", name: "凛", characterData: {}, imagePath: null }],
    items: [],
    ...over,
  });

  const scriptOf = (narrativeData: Record<string, unknown>, over: Partial<CompilerProjectInput> = {}) =>
    compileStory(input({ nodes: [node("n1", narrativeData)], ...over })).beats[0]!.script;

  it("只有 narration → 一句旁白（speaker 与 characterId 都是 null，而不是省略键）", () => {
    expect(scriptOf({ narration: "雨停了。" })).toEqual([
      { op: "say", characterId: null, speaker: null, text: "雨停了。", voice: null, rich: null },
    ]);
  });

  it("dialogue + speaker：名字在演员表里就解析成 id，不在就保留名字而 id 为 null", () => {
    const known = scriptOf({ dialogue: "我来了。", speaker: "凛" });
    expect(known[0]).toMatchObject({ op: "say", text: "我来了。", speaker: "凛", characterId: "c1" });
    const unknown = scriptOf({ dialogue: "陌生人。", speaker: "没人认识我" });
    expect(unknown[0]).toMatchObject({ text: "陌生人。", speaker: "没人认识我", characterId: null });
  });

  it("手动 choices 优先于「出边≥2 自动生成」；空标签补「继续」；只有一条出边时不生成选项", () => {
    const manual = scriptOf({
      dialogue: "选吧",
      choices: [{ label: "", target_node_id: "n9" }, { condition: { type: "flag", key: "k" } }],
    });
    expect(manual[manual.length - 1]).toEqual({
      op: "choice",
      options: [
        { label: "继续", to: "n9", condition: null },
        { label: "继续", to: null, condition: { type: "flag", key: "k" } },
      ],
    });

    const two = compileStory(input({
      nodes: [node("n1", { dialogue: "两条路" }), node("n2", { dialogue: "A" }, 1), node("n3", { dialogue: "B" }, 2)],
      edges: [
        { sourceNodeId: "n1", targetNodeId: "n2", label: "左" },
        { sourceNodeId: "n1", targetNodeId: "n3", label: null },
      ],
    })).beats.find((b) => b.id === "n1")!.script;
    expect(two[two.length - 1]).toEqual({
      op: "choice",
      options: [
        { label: "左", to: "n2", condition: null },
        { label: "继续", to: "n3", condition: null },
      ],
    });

    const one = compileStory(input({
      nodes: [node("n1", { dialogue: "只有一条" }), node("n2", { dialogue: "唯一" }, 1)],
      edges: [{ sourceNodeId: "n1", targetNodeId: "n2", label: "继续" }],
    })).beats.find((b) => b.id === "n1")!.script;
    expect(one.some((i) => i.op === "choice")).toBe(false);
  });

  it("显式 actors 原样取（数字也转字符串）；没写 actors 时从脚本归纳", () => {
    const pkg = compileStory(input({ nodes: [node("n1", { actors: ["c1", 7], dialogue: "在" })] }));
    expect(pkg.beats[0]!.actors).toEqual(["c1", "7"]);
    const inferred = compileStory(input({
      nodes: [node("n1", { script: [{ op: "show", characterId: "c1" }, { op: "say", text: "在" }] })],
    }));
    expect(inferred.beats[0]!.actors).toEqual(["c1"]);
  });

  it("表情差分：空对象给 null 而不是 {}；值为空的差分被丢掉", () => {
    const withSprites = compileStory(input({
      nodes: [node("n1", { dialogue: "在" })],
      characters: [{ id: "c1", name: "凛", characterData: { sprites: { smile: "a.png", sad: "" } }, imagePath: null }],
    }));
    expect(withSprites.characters[0]!.expressions).toEqual({ smile: "a.png" });
    const bare = compileStory(input({
      nodes: [node("n1", { dialogue: "在" })],
      characters: [{ id: "c1", name: "凛", characterData: { sprites: {} }, imagePath: null }],
    }));
    expect(bare.characters[0]!.expressions).toBeNull();
  });

  it("同一个角色被引用两次只进一次；引用了不存在的角色则整条不出现", () => {
    const pkg = compileStory(input({
      nodes: [node("n1", { dialogue: "在" })],
      roles: [{ characterRefId: "c1" }, { characterRefId: "c1" }, { characterRefId: "ghost" }],
    }));
    expect(pkg.characters.map((c) => c.id)).toEqual(["c1"]);
  });

  it("术语表只收 term 非空的项、trim 两端空白、缺 id 用下标补；playMeta 不是对象也不炸", () => {
    const pkg = compileStory(input({
      nodes: [node("n1", { dialogue: "在" })],
      playMeta: {
        glossary: [
          { term: " 方舟 ", definition: " 移动都市 " },
          { definition: "没有术语，整条丢掉" },
          "不是对象",
          { id: "x1", term: "锚点" },
        ],
      } as CompilerProjectInput["playMeta"],
    }));
    expect(pkg.glossary).toEqual([
      { id: "g0", term: "方舟", definition: "移动都市" },
      { id: "x1", term: "锚点", definition: "" },
    ]);
    expect(compileStory(input({ playMeta: null })).glossary).toEqual([]);
  });

  it("顶层没有节点时回退到 scene.nodes（旧数据形状）", () => {
    const pkg = compileStory(input({
      nodes: [],
      scenes: [
        {
          id: "s1", title: "旧场景",
          nodes: [node("old1", { dialogue: "旧写法", speaker: "凛" }, 3, null)],
        },
      ] as unknown as CompilerProjectInput["scenes"],
    }));
    expect(pkg.beats.map((b) => b.id)).toContain("old1");
    expect(pkg.beats.find((b) => b.id === "old1")!.sceneId).toBe("s1");
  });
});
