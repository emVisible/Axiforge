// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileStory } from "@axiforge/core";
import type { ProjectBundle } from "@axiforge/editor-core";
import { describe, expect, it } from "vitest";
import { bundleToCompilerInput } from "./compilerInput";

/**
 * 桌面投影的端到端对照：本地存储形态（ProjectBundle）→ `bundleToCompilerInput`
 * → `compileStory` → 必须等于服务端编译器为同一份数据产出的 StoryPackage。
 *
 * 为什么测的是「编译结果」而不是「投影输出对象」：本项目的两条真缺陷
 * （舞台库导入的背景在桌面空白、道具在桌面试玩恒空）都出在**投影**这一层，
 * 而不是编译器；而投影与后端的输入构造在若干字段上本就形状不同
 * （`scenes[].nodes`、`sceneRefId`、`isPublic` 编译器不读）。
 * 比较编译产物只暴露用户能看见的差异，形状差异自动免疫。
 *
 * 金样本目录是 `packages/core` 的资产（G6 的权威），这里按路径读它而不是复制一份——
 * 复制就是第二个真相源。
 */
const GOLDEN = join(
  // storage → shared → src → web → apps → 仓库根：五段，少一段就会指到 apps/packages 这种不存在的地方
  import.meta.dirname,
  "../../../../../packages/core/src/__golden__/b1a7c0d0-【对照】分支兜底",
);

const U = (n: number) => `b1a7c0d0-0000-4000-8000-${String(n).padStart(12, "0")}`;

const bundle = JSON.parse(readFileSync(join(GOLDEN, "input.json"), "utf-8")) as {
  nodes: { id: string; stageId: string; editorData: unknown; narrativeData: unknown; sortOrder: number }[];
  edges: { sourceNodeId: string; targetNodeId: string; label: string | null }[];
};

const localBundle: ProjectBundle = {
  meta: {
    id: U(1),
    title: "【对照】分支兜底",
    updatedAt: "2026-09-29T00:00:00Z",
    isPublic: true,
    description: "金样本第四份：scene 引用兜底 / 道具 / 术语表",
    coverImage: null,
    themeTags: ["对照", "兜底"],
    mechanism: "单线",
    genre: "悬疑",
    isMeta: false,
    worldSetting: "近未来移动都市「交汇港」",
    rules: "夜间不得外出",
  },
  axsSource: null,
  nodes: bundle.nodes.map((n) => ({
    id: n.id,
    stageId: n.stageId,
    editorData: n.editorData as Record<string, unknown>,
    narrativeData: n.narrativeData as Record<string, unknown>,
    sortOrder: n.sortOrder,
  })),
  edges: bundle.edges.map((e, i) => ({
    id: U(80 + i),
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label,
  })),
  scenes: [
    { id: U(40), title: "自有值优先", location: "站内", atmosphere: "干燥", sceneRefId: null, sortOrder: 0 },
    { id: U(41), title: "空串算没值", location: "", atmosphere: "", sceneRefId: U(20), sortOrder: 1 },
    { id: U(42), title: "资产字段也空", location: "月台", atmosphere: null, sceneRefId: U(21), sortOrder: 2 },
    {
      id: U(43),
      title: "资产查不到",
      location: null,
      atmosphere: null,
      sceneRefId: "b1a7c0d0-0000-4000-8000-999999999999",
      sortOrder: 3,
    },
  ],
  roles: [
    { id: U(60), characterRefId: U(10) },
    { id: U(61), characterRefId: U(11) },
    { id: U(62), characterRefId: U(10) },
  ],
  // 本地契约里 assetRefs 只装道具；舞台的挂接走 StoredScene.sceneRefId（服务端两条都有），
  // 两者喂给编译器的形状因此不同——这正是本用例要比的东西。
  assetRefs: [
    { id: U(70), projectId: U(1), assetType: "item", assetId: U(30) },
    { id: U(71), projectId: U(1), assetType: "item", assetId: "b1a7c0d0-0000-4000-8000-888888888888" },
  ],
};

const characters = [
  { id: U(10), name: "朝", characterData: { anchor: { name: "朝", essence: "守夜人" } }, imagePath: null },
  { id: U(11), name: "陌生人", characterData: { anchor: { name: "陌生人" } }, imagePath: null },
];

const sceneAssets = [
  { id: U(20), location: "方舟·地下", atmosphere: "潮湿", imagePath: "scenes/parity-under.png" },
  { id: U(21), location: null, atmosphere: null, imagePath: null },
];

const itemAssets = [
  { id: U(30), name: "旧钥匙", category: "道具", imagePath: "items/parity-key.png" },
];

const canonicalize = (v: unknown): unknown =>
  v === null || v === undefined
    ? null
    : Array.isArray(v)
      ? v.map(canonicalize)
      : typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .filter(([, val]) => val !== undefined)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, val]) => [k, canonicalize(val)]),
          )
        : v;

const stripGlossary = (pkg: Record<string, unknown>) => {
  const copy = { ...pkg };
  delete copy.glossary;
  return copy;
};

describe("桌面投影端到端对照（bundle → 编译 → 服务端产物）", () => {
  const expected = JSON.parse(readFileSync(join(GOLDEN, "expected.json"), "utf-8")) as Record<string, unknown>;
  const actual = compileStory(
    bundleToCompilerInput(localBundle, characters, sceneAssets, itemAssets),
  ) as unknown as Record<string, unknown>;

  it("除已具名的两处漂移外，逐字段与 Python 编译结果一致", () => {
    // 漂移面用「删掉再比」的方式锁死：新增第三处漂移会让这条红，而不是被无声吸收
    expect(canonicalize(stripGlossary(actual))).toEqual(canonicalize(stripGlossary(expected)));
  });

  it("漂移①：桌面 playMeta 恒为 {}，所以术语表在桌面试玩里不会出现（#58）", () => {
    expect(expected.glossary).toHaveLength(2);
    expect((actual as { glossary: unknown[] }).glossary).toEqual([]);
  });

  it("道具与舞台兜底这两处曾经的分叉，现在必须两边都有", () => {
    expect((actual as { items: unknown[] }).items).toHaveLength(1);
    const scenes = (actual as { scenes: { id: string; location: string | null }[] }).scenes;
    expect(scenes.find((s) => s.id === U(41))?.location).toBe("方舟·地下");
    expect(scenes.find((s) => s.id === U(43))?.location).toBeNull();
  });

  /**
   * 漂移②（**在册但不修**，因为触发面不在 UI 上）：边的 `condition` 在本地存储里没有列，
   * 投影因此给不出它，而编译器的「多出口自动成选择」会把边条件带进选项（compiler.ts:191）。
   * 服务端为同一份数据会带上，于是两端产物不同。
   *
   * 为什么不立刻补：Flow 编辑器把门禁写在**节点**的 `trigger_condition` 上
   * （`useProjectEditor.ts:545`，随 narrativeData 落本地，两端一致），
   * 边级条件只有 API/旧数据才会写。为一条 UI 走不到的路径去加 schema v6 + 契约方法 + 三实现，
   * 属于给假设需求造工程。
   *
   * 这条用例的作用是**在册**：哪天有人把 `condition` 加进 `StoredEdge`/投影，
   * 下面的 `not.toEqual` 会红，逼他改成相等断言——而不是让这处漂移只活在散文里。
   */
  it("漂移②：边级条件在桌面丢失（UI 不写这条路径，先记账不补 schema）", () => {
    const base = bundleToCompilerInput(localBundle, characters, sceneAssets, itemAssets);
    const withNodeChoice = {
      ...base,
      nodes: [
        {
          id: "n1",
          stageId: null,
          narrativeData: { title: "两条路", narration: "往哪边走？" },
          editorData: {},
          sortOrder: 0,
        },
        {
          id: "n2",
          stageId: null,
          narrativeData: { title: "终", narration: "结束", is_ending: true },
          editorData: {},
          sortOrder: 1,
        },
      ],
      edges: [
        { sourceNodeId: "n1", targetNodeId: "n2", label: "左", condition: { flag: "left" } },
        { sourceNodeId: "n1", targetNodeId: "n2", label: "右", condition: null },
      ],
    };
    const desktopOnly = {
      ...withNodeChoice,
      // 投影的输出形状就是这样：edges 只有 source/target/label
      edges: withNodeChoice.edges.map(({ sourceNodeId, targetNodeId, label }) => ({
        sourceNodeId,
        targetNodeId,
        label,
      })),
    };
    const serverPkg = compileStory(withNodeChoice) as unknown as { beats: { script: unknown }[] };
    const desktopPkg = compileStory(desktopOnly) as unknown as { beats: { script: unknown }[] };
    const choiceOf = (pkg: { beats: { script: unknown }[] }) =>
      JSON.stringify(pkg.beats.find((b) => b.script !== undefined)?.script);

    expect(choiceOf(serverPkg)).not.toEqual(choiceOf(desktopPkg));
    expect(choiceOf(serverPkg)).toContain("left");
    expect(choiceOf(desktopPkg)).not.toContain("left");
  });
});
