import { describe, expect, it } from "vitest";
import type { Draft, Edge, NarrativeNode } from "../types";
import {
  beatLineForNode,
  draftToAxs,
  parseAxsToPlan,
  topologicalOrder,
} from "./axs";
import {
  canvasEdgesForProjection,
  mergeCanvasIntoNodes,
  projectAxsFromCanvas,
  type MergeableNode,
} from "./canvas";

const ROLES = { 阿凛: "char-1" };

function node(
  id: string,
  narrative: NarrativeNode["narrative"],
  opts?: Partial<Pick<NarrativeNode, "stageId" | "sortOrder">>,
): NarrativeNode {
  return {
    id,
    stageId: opts?.stageId ?? null,
    position: { x: 0, y: 0 },
    narrative,
    sortOrder: opts?.sortOrder ?? 0,
  };
}

function draftOf(nodes: NarrativeNode[], edges: Edge[] = [], scenes: Draft["scenes"] = []): Draft {
  return { rev: 0, nodes: new Map(nodes.map((n) => [n.id, n])), edges, roles: [], scenes };
}

// ---------------------------------------------------------------------------
// draftToAxs（与 web 基线同语义）
// ---------------------------------------------------------------------------

describe("draftToAxs", () => {
  it("空 Draft 产出默认开场文本", () => {
    expect(draftToAxs(draftOf([], []), {})).toBe("# 开始\n旁白：故事从这里开始。\n");
  });

  it("线性链按拓扑序打印，roles 反解说话人，边打印为 -> 标题", () => {
    const d = draftOf(
      [
        node("a", { title: "相遇", script: [{ op: "say", characterId: "char-1", text: "你来了。" }] }),
        node("b", { title: "归途", script: [{ op: "narration", text: "故事告一段落。" }] }),
      ],
      [{ id: "e", source: "a", target: "b", label: null }],
    );
    expect(draftToAxs(d, ROLES)).toBe(
      "# 相遇\n阿凛: 你来了。\n-> 归途\n\n# 归途\n故事告一段落。\n",
    );
  });

  it("锚点节点优先（行为基线）", () => {
    const d = draftOf(
      [
        node("a", { title: "相遇", script: [{ op: "say", characterId: "char-1", text: "你来了。" }] }),
        node("b", { title: "归途", is_anchor: true, script: [{ op: "narration", text: "故事告一段落。" }] }),
      ],
      [{ id: "e", source: "a", target: "b", label: null }],
    );
    expect(draftToAxs(d, ROLES)).toBe(
      "# 归途\n故事告一段落。\n\n# 相遇\n阿凛: 你来了。\n-> 归途\n",
    );
  });

  it("结局标记与效果指令", () => {
    const d = draftOf([
      node("b", {
        title: "归途",
        is_ending: true,
        ending_label: "NE",
        effects: [{ type: "memory", key: "信任", value: 1 }],
        script: [],
      }),
    ]);
    expect(draftToAxs(d, {})).toBe("# 归途 [ending: NE]\n@memory 信任 = 1\n");
  });

  it("旧版单句节点回退构建（旁白裸行、说话人、选项）", () => {
    const d = draftOf([
      node("old", {
        title: "抉择",
        narration: "天色渐晚。",
        speaker: "阿凛",
        dialogue: "走吧。",
        choices: [{ label: "离开" }, { label: "留下", target_node_id: null }],
      }),
    ]);
    expect(draftToAxs(d, {})).toBe("# 抉择\n天色渐晚。\n阿凛: 走吧。\n> 离开\n> 留下\n");
  });

  it("旧版选项带目标节点时同样打印为无目标选项（既有行为基线）", () => {
    const d = draftOf([
      node("old", {
        title: "抉择",
        dialogue: "走哪？",
        choices: [{ label: "东", target_node_id: "east" }],
      }),
    ]);
    // 无 speaker 的 legacy 对白打印为 ": text"（既有行为，基线钉住）
    expect(draftToAxs(d, {})).toBe("# 抉择\n: 走哪？\n> 东\n");
  });

  it("舞台标题经 scenes 解析进入标题行", () => {
    const d = draftOf(
      [node("a", { title: "开场" }, { stageId: "s1" })],
      [],
      [{ id: "s1", title: "主场景" }],
    );
    expect(draftToAxs(d, {})).toBe("# 开场 @stage(主场景)\n");
  });

  it("stageId 无对应舞台或节点无标题时的回退", () => {
    const d = draftOf([node("a", {}, { stageId: "ghost" })]);
    expect(draftToAxs(d, {})).toBe("# 未命名\n");
  });
});

describe("topologicalOrder", () => {
  it("锚点优先，其余零入度次之，不可达节点按原序兜底", () => {
    const nodes = [
      node("c", { title: "丙" }, { sortOrder: 2 }),
      node("a", { title: "甲", is_anchor: true }, { sortOrder: 0 }),
      node("b", { title: "乙" }, { sortOrder: 1 }),
    ];
    const order = topologicalOrder(nodes, [{ id: "e", source: "b", target: "c", label: null }]);
    expect(order.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("指向未知节点的边不参与入度统计", () => {
    const nodes = [node("a", { title: "甲" })];
    const order = topologicalOrder(nodes, [{ id: "e", source: "a", target: "ghost", label: null }]);
    expect(order.map((n) => n.id)).toEqual(["a"]);
  });
});

// ---------------------------------------------------------------------------
// parseAxsToPlan
// ---------------------------------------------------------------------------

describe("parseAxsToPlan", () => {
  const SOURCE = "# 开始\n旁白：开场。\n\n# 相遇\n阿凛: 你来了。\n";

  it("标题复用既有 id，新节点走 idGen；axs 顺序邻接物化为边", () => {
    let n = 0;
    const plan = parseAxsToPlan(
      SOURCE,
      ROLES,
      [{ id: "existing-1", title: "开始" }],
      [],
      () => `gen-${++n}`,
    );
    expect(plan.nodes).toHaveLength(2);
    expect(plan.nodes[0]!.id).toBe("existing-1");
    expect(plan.nodes[1]!.id).toBe("gen-1");
    expect(plan.edges).toEqual([
      { id: "开始-相遇", source: "existing-1", target: "gen-1", label: null },
    ]);
    expect((plan.nodes[1]!.narrative.script as unknown[] | undefined)?.[0]).toMatchObject({
      op: "say",
      characterId: "char-1",
    });
  });

  it("网格位置与 sort_order 按序生成", () => {
    const plan = parseAxsToPlan(SOURCE, {}, [], [], () => "x");
    expect(plan.nodes[0]!.position).toEqual({ x: 120, y: 80 });
    expect(plan.nodes[1]!.position).toEqual({ x: 340, y: 80 });
    expect(plan.nodes.map((p) => p.sortOrder)).toEqual([0, 1]);
  });

  it("舞台标题解析为 stageId；无匹配舞台落 null；既有节点无标题按空串索引", () => {
    const plan = parseAxsToPlan(
      "# 开场 @stage(主场景)\n旁白：x\n",
      {},
      [{ id: "e1" }],
      [{ id: "s1", title: "主场景" }],
      () => "x",
    );
    expect(plan.nodes[0]!.stageId).toBe("s1");

    const miss = parseAxsToPlan("# 开场 @stage(幽灵)\n旁白：x\n", {}, [{ id: "e1" }], [], () => "x");
    expect(miss.nodes[0]!.stageId).toBeNull();
  });
});

describe("beatLineForNode", () => {
  const SOURCE = "# 开始\n旁白：开场。\n\n# 相遇\n阿凛: 你来了。\n";

  it("按 beat id 定位标题行号", () => {
    expect(beatLineForNode(SOURCE, {}, "相遇")).toBe(4);
  });

  it("id 未命中时按标题回退定位", () => {
    expect(beatLineForNode(SOURCE, {}, "不存在", "开始")).toBe(1);
  });

  it("未知节点返回 null", () => {
    expect(beatLineForNode(SOURCE, {}, "不存在")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 画布合并（与 web 基线同语义）
// ---------------------------------------------------------------------------

function mergeable(id: string, title: string, stageId?: string): MergeableNode {
  return {
    id,
    stage_id: stageId ?? null,
    narrative_data: { title },
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("canvasNodeToMergeable 回退分支", () => {
  it("stage_id 缺失回退 base.scene_id；缺标题回退 未命名；props 透传；时间戳缺省取当前", () => {
    const merged = mergeCanvasIntoNodes(
      [{ id: "base", position: { x: 0, y: 0 }, data: { props: ["剑"] } }],
      [{ id: "base", scene_id: "sc-1", narrative_data: { title: "旧" }, sort_order: 7 }],
    );
    const n = merged.find((m) => m.id === "base")!;
    expect(n.stage_id).toBe("sc-1");
    expect(n.narrative_data.title).toBe("未命名");
    expect(n.narrative_data.props).toEqual(["剑"]);
    expect(n.sort_order).toBe(7);
    expect(typeof n.created_at).toBe("string");

    // 全新画布节点：无 base 时 stage_id 为 null、时间戳取当前
    const fresh = mergeCanvasIntoNodes(
      [{ id: "n1", position: { x: 0, y: 0 }, data: {} }],
      [],
    )[0]!;
    expect(fresh.stage_id).toBeNull();
    expect(typeof fresh.created_at).toBe("string");
  });
});

describe("mergeCanvasIntoNodes", () => {
  it("画布覆盖同 ID 节点，未出现在画布中的节点保留", () => {
    const merged = mergeCanvasIntoNodes(
      [{ id: "edited", position: { x: 9, y: 9 }, data: { title: "新标题", script: [] } }],
      [mergeable("edited", "旧标题"), mergeable("kept", "保留")],
    );
    expect(merged).toHaveLength(2);
    const edited = merged.find((n) => n.id === "edited")!;
    expect(edited.narrative_data.title).toBe("新标题");
    expect(edited.editor_data!.position).toEqual({ x: 9, y: 9 });
  });

  it("限定舞台：消失者剔除、新建者追加在末尾（顺序基线）", () => {
    const merged = mergeCanvasIntoNodes(
      [
        { id: "in", position: { x: 1, y: 1 }, data: { title: "台内", script: [] } },
        { id: "fresh", position: { x: 2, y: 2 }, data: { title: "新建", script: [] } },
      ],
      [mergeable("in", "台内", "stage-1"), mergeable("gone", "已删", "stage-1"), mergeable("other", "台外", "stage-2")],
      { scopeStageId: "stage-1" },
    );
    expect(merged.map((n) => n.id)).toEqual(["in", "other", "fresh"]);
  });
});

describe("canvasEdgesForProjection", () => {
  it("无作用域时画布边全量替换", () => {
    const out = canvasEdgesForProjection(
      [{ source: "a", target: "b" }],
      [{ id: "x", source: "m", target: "n", label: null }],
      null,
    );
    expect(out).toEqual([{ id: "a-b", source: "a", target: "b", label: null }]);
  });

  it("有作用域时保留跨域边，域内边由画布取代", () => {
    const out = canvasEdgesForProjection(
      [{ source: "a", target: "b" }],
      [
        { id: "1", source: "a", target: "out", label: null },
        { id: "2", source: "a", target: "b", label: null },
      ],
      new Set(["a", "b"]),
    );
    expect(out.map((e) => `${e.source}->${e.target}`)).toEqual(["a->out", "a->b"]);
  });
});

describe("projectAxsFromCanvas", () => {
  it("未保存的画布编辑即时反映在投影中", () => {
    const out = projectAxsFromCanvas(
      [
        {
          id: "a",
          position: { x: 0, y: 0 },
          data: { title: "相遇", script: [{ op: "say", characterId: "char-1", text: "新台词" }] },
        },
      ],
      [],
      [mergeable("a", "相遇")],
      [],
      [],
      ROLES,
    );
    expect(out).toContain("新台词");
    expect(out).not.toContain("旧台词");
  });

  it("作用域模式下仅投影画布内节点，画布节点可覆盖 stage_id", () => {
    const out = projectAxsFromCanvas(
      [
        {
          id: "a",
          position: { x: 0, y: 0 },
          data: { title: "相遇", stage_id: "s9", script: [] },
        },
      ],
      [{ source: "a", target: "b" }],
      [mergeable("a", "相遇", "s1")],
      [{ id: "e", source: "a", target: "b", label: null }],
      [{ id: "s9", title: "新舞台" }],
      {},
      { scopeStageId: "s1" },
    );
    expect(out).toContain("@stage(新舞台)");
  });

  it("保留节点缺 editor_data / sort_order 时回退默认值", () => {
    const out = projectAxsFromCanvas(
      [{ id: "a", position: { x: 1, y: 1 }, data: { title: "甲", script: [] } }],
      [],
      [{ id: "keep", narrative_data: { title: "保留" } }],
      [],
      [],
      {},
    );
    expect(out).toContain("# 甲");
    expect(out).toContain("# 保留");
  });
});
