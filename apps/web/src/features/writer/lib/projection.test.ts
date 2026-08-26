import { describe, expect, it } from "vitest";
import type { Instruction } from "@axiforge/core";
import {
  axsToSyncPayload,
  beatLineForNode,
  canvasEdgesForProjection,
  collectProjectNodes,
  mergeCanvasIntoProjectNodes,
  projectAxsFromCanvas,
  projectToAxs,
} from "./projection";
import type {
  ProjectEdgeResponse,
  ProjectNodeResponse,
  ProjectSceneResponse,
} from "@/shared/types/project";

// ---------------------------------------------------------------------------
// 夹具构造（形状对齐 shared/types/project.ts）
// ---------------------------------------------------------------------------

const NOW = "2026-08-26T00:00:00Z";

function makeNode(
  id: string,
  narrative: Partial<ProjectNodeResponse["narrative_data"]> = {},
  stageId: string | null = null,
): ProjectNodeResponse {
  return {
    id,
    scene_id: null,
    stage_id: stageId,
    editor_data: { position: { x: 0, y: 0 } },
    narrative_data: { title: "未命名", ...narrative },
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
  };
}

function makeEdge(
  source: string,
  target: string,
  label: string | null = null,
): ProjectEdgeResponse {
  return {
    id: `${source}-${target}`,
    project_id: "p1",
    source_node_id: source,
    target_node_id: target,
    source_port: "output",
    label,
    condition: null,
    created_at: NOW,
  };
}

function makeScene(id: string, title: string): ProjectSceneResponse {
  return {
    id,
    project_id: "p1",
    source: "inline",
    scene_ref_id: null,
    title,
    description: "",
    parent_scene_id: null,
    location: null,
    atmosphere: null,
    sort_order: 0,
    nodes: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ROLES = { 阿凛: "char-1" };

// ---------------------------------------------------------------------------
// collectProjectNodes
// ---------------------------------------------------------------------------

describe("collectProjectNodes", () => {
  it("优先使用 project.nodes", () => {
    const fromProject = [makeNode("a", { title: "甲" })];
    const scenes = [makeScene("s1", "舞台")];
    scenes[0]!.nodes = [makeNode("b", { title: "乙" })];
    expect(collectProjectNodes(fromProject, scenes)).toEqual(fromProject);
  });

  it("project.nodes 缺失时回退展开 scene.nodes", () => {
    const scenes = [makeScene("s1", "舞台")];
    const inner = makeNode("b", { title: "乙" });
    scenes[0]!.nodes = [inner];
    expect(collectProjectNodes(undefined, scenes)).toEqual([inner]);
  });
});

// ---------------------------------------------------------------------------
// projectToAxs —— 节点图 → AXS 文本投影
// ---------------------------------------------------------------------------

describe("projectToAxs", () => {
  it("空工程产出默认开场文本", () => {
    expect(projectToAxs([], [], [], {})).toBe(
      "# 开始\n旁白：故事从这里开始。\n",
    );
  });

  it("线性链按拓扑序打印，角色名经 roles 反解，边打印为 -> 标题", () => {
    const nodes = [
      makeNode("a", {
        title: "相遇",
        script: [{ op: "say", characterId: "char-1", text: "你来了。" }],
      }),
      makeNode("b", {
        title: "归途",
        script: [{ op: "narration", text: "故事告一段落。" }],
      }),
    ];
    const out = projectToAxs(nodes, [makeEdge("a", "b")], [], ROLES);
    expect(out).toBe(
      "# 相遇\n阿凛: 你来了。\n-> 归途\n\n# 归途\n故事告一段落。\n",
    );
  });

  it("锚点节点优先排在拓扑序前列（现行行为基线）", () => {
    const nodes = [
      makeNode("a", {
        title: "相遇",
        script: [{ op: "say", characterId: "char-1", text: "你来了。" }],
      }),
      makeNode("b", {
        title: "归途",
        is_anchor: true,
        script: [{ op: "narration", text: "故事告一段落。" }],
      }),
    ];
    const out = projectToAxs(nodes, [makeEdge("a", "b")], [], ROLES);
    expect(out).toBe(
      "# 归途\n故事告一段落。\n\n# 相遇\n阿凛: 你来了。\n-> 归途\n",
    );
  });

  it("结局标记与效果指令进入文本", () => {
    const nodes = [
      makeNode("b", {
        title: "归途",
        is_ending: true,
        ending_label: "NE",
        effects: [{ type: "memory", key: "信任", value: 1 }],
        script: [],
      }),
    ];
    const out = projectToAxs(nodes, [], [], {});
    expect(out).toBe("# 归途 [ending: NE]\n@memory 信任 = 1\n");
  });

  it("旧版单句节点（无 script）回退构建 narration/say/choice 指令", () => {
    const legacy = makeNode("old", {
      title: "抉择",
      narration: "天色渐晚。",
      speaker: "阿凛",
      dialogue: "走吧。",
      choices: [{ label: "离开" }, { label: "留下", target_node_id: null }],
    });
    const out = projectToAxs([legacy], [], [], {});
    // 旁白文本不以 @>#\ 开头时按裸行打印，无需转义前缀
    expect(out).toBe(
      "# 抉择\n天色渐晚。\n阿凛: 走吧。\n> 离开\n> 留下\n",
    );
  });
});

// ---------------------------------------------------------------------------
// axsToSyncPayload —— AXS 文本 → 同步载荷（Writer 轨保存通道）
// ---------------------------------------------------------------------------

describe("axsToSyncPayload", () => {
  const SOURCE = "# 开始\n旁白：故事从这里开始。\n\n# 相遇\n阿凛: 你来了。\n";

  it("标题匹配的既有节点复用其 ID，新节点获得 UUID", () => {
    const existing = [makeNode("existing-1", { title: "开始" })];
    const payload = axsToSyncPayload(SOURCE, ROLES, [], existing);

    expect(payload.nodes).toHaveLength(2);
    const first = payload.nodes[0]!;
    expect(first.narrative_data?.title).toBe("开始");
    expect(first.id).toBe("existing-1");
    // 同步载荷节点 id 为可空类型：物化路径必然产出 UUID
    expect(UUID_RE.test(payload.nodes[1]!.id ?? "")).toBe(true);
  });

  it("axs_source 原样保留，不因解析而改写", () => {
    const payload = axsToSyncPayload(SOURCE, ROLES, [], []);
    expect(payload.axs_source).toBe(SOURCE);
  });

  it("顺序邻接边映射到物化节点 ID", () => {
    const existing = [makeNode("existing-1", { title: "开始" })];
    const payload = axsToSyncPayload(SOURCE, ROLES, [], existing);

    expect(payload.edges).toHaveLength(1);
    const edge = payload.edges[0]!;
    const ids = new Set(payload.nodes.map((n) => n.id));
    expect(ids.has(edge.source_node_id)).toBe(true);
    expect(ids.has(edge.target_node_id)).toBe(true);
    expect(edge.source_node_id).toBe("existing-1");
  });

  it("脚本指令与说话人解析进入 narrative_data.script", () => {
    const payload = axsToSyncPayload(SOURCE, ROLES, [], []);
    const meet = payload.nodes.find(
      (n) => n.narrative_data?.title === "相遇",
    )!;
    const script = meet.narrative_data!.script as Instruction[];
    expect(script).toHaveLength(1);
    expect(script[0]).toMatchObject({ op: "say", characterId: "char-1" });
  });
});

// ---------------------------------------------------------------------------
// 画布合并与作用域投影
// ---------------------------------------------------------------------------

describe("mergeCanvasIntoProjectNodes", () => {
  it("画布快照覆盖同 ID 节点，未出现在画布中的他舞台节点保留", () => {
    const kept = makeNode("kept", { title: "保留" }, "stage-2");
    const edited = makeNode("edited", { title: "旧标题" }, "stage-1");
    const canvas = [
      {
        id: "edited",
        position: { x: 9, y: 9 },
        data: { title: "新标题", script: [] },
      },
    ];
    const merged = mergeCanvasIntoProjectNodes(canvas, [edited, kept]);
    expect(merged).toHaveLength(2);
    const node = merged.find((n) => n.id === "edited")!;
    expect(node.narrative_data.title).toBe("新标题");
    expect(node.editor_data.position).toEqual({ x: 9, y: 9 });
    expect(merged.map((n) => n.id)).toContain("kept");
  });

  it("限定舞台时，画布中消失的本舞台节点被剔除，新画布节点被追加", () => {
    const inStage = makeNode("in", { title: "台内" }, "stage-1");
    const gone = makeNode("gone", { title: "已删" }, "stage-1");
    const other = makeNode("other", { title: "台外" }, "stage-2");
    const canvas = [
      {
        id: "in",
        position: { x: 1, y: 1 },
        data: { title: "台内", script: [] },
      },
      {
        id: "fresh",
        position: { x: 2, y: 2 },
        data: { title: "新建", script: [] },
      },
    ];
    const merged = mergeCanvasIntoProjectNodes(
      canvas,
      [inStage, gone, other],
      { scopeStageId: "stage-1" },
    );
    // 顺序基线：先按既有节点序输出存活者，新画布节点追加在末尾
    expect(merged.map((n) => String(n.id))).toEqual([
      "in",
      "other",
      "fresh",
    ]);
  });
});

describe("canvasEdgesForProjection", () => {
  const canvasEdges = [{ source: "a", target: "b", label: null }];

  it("无作用域时画布边全量替换", () => {
    const stale = [makeEdge("x", "y")];
    const out = canvasEdgesForProjection(canvasEdges, stale, null);
    expect(out).toHaveLength(1);
    expect(out[0]!.source_node_id).toBe("a");
    expect(out[0]!.target_node_id).toBe("b");
  });

  it("有作用域时仅剔除两端都在作用域内的既有边，跨域边保留", () => {
    const project = [
      makeEdge("a", "out"), // 一端在作用域外 → 保留
      makeEdge("a", "b"), // 两端都在作用域内 → 由画布边取代
    ];
    const scope = new Set(["a", "b"]);
    const out = canvasEdgesForProjection(canvasEdges, project, scope);
    expect(out.map((e) => `${e.source_node_id}->${e.target_node_id}`)).toEqual(
      ["a->out", "a->b"],
    );
  });
});

describe("projectAxsFromCanvas", () => {
  it("未保存的画布编辑即时反映在剧本投影中", () => {
    const saved = makeNode("a", {
      title: "相遇",
      script: [{ op: "say", characterId: "char-1", text: "旧台词" }],
    });
    const canvas = [
      {
        id: "a",
        position: { x: 0, y: 0 },
        data: {
          title: "相遇",
          script: [{ op: "say", characterId: "char-1", text: "新台词" }],
        },
      },
    ];
    const out = projectAxsFromCanvas(canvas, [], [saved], [], [], ROLES);
    expect(out).toContain("新台词");
    expect(out).not.toContain("旧台词");
  });
});

// ---------------------------------------------------------------------------
// 锚点（行级定位 v0，ADR-025 将升级为指令级）
// ---------------------------------------------------------------------------

describe("beatLineForNode", () => {
  const SOURCE = "# 开始\n旁白：故事从这里开始。\n\n# 相遇\n阿凛: 你来了。\n";

  it("按 beat id 定位标题行号", () => {
    // beat.id = slugifyTitle("相遇") = "相遇"
    expect(beatLineForNode(SOURCE, {}, "相遇")).toBe(4);
  });

  it("未知节点返回 null", () => {
    expect(beatLineForNode(SOURCE, {}, "不存在")).toBeNull();
  });
});
