import { describe, expect, it } from "vitest";
import { createDraft } from "../document";
import type { Draft, Edge, NarrativeNode } from "../types";
import type { AxsDiagnostic } from "@axiforge/axs";
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

  it("旧版选项目标 ID 投影为目标 Beat 标题", () => {
    const d = draftOf([
      node("old", {
        title: "抉择",
        dialogue: "走哪？",
        choices: [{ label: "东", target_node_id: "east" }],
      }),
      node("east", { title: "东方" }),
    ]);
    // 2026-10-01 更正：无 speaker 的 legacy 对白以前打印成 ": text"，那一行回读会被解析器拒掉
    // 并降级成旁白、冒号还留在玩家文本里。发射器现在按旁白那一支印出去（与运行端 resolveSpeaker→null
    // 时不显示名字、`ir.ts:90`「缺省为旁白」同一语义）。本条对选项目标映射的钉原样保留。
    expect(draftToAxs(d, {})).toBe("# 抉择\n走哪？\n> 东 -> 东方\n\n# 东方\n");
  });

  it("legacy 选项指向同名 Beat 的第二个时投影出消歧形式，不静默指到第一个", () => {
    const d = draftOf([
      node("old", {
        title: "抉择",
        dialogue: "走哪？",
        choices: [{ label: "东", target_node_id: "east2" }],
      }),
      node("east1", { title: "开场" }),
      node("east2", { title: "开场" }),
    ]);

    // 打印侧的消歧规则与解析侧 assignBeatIds 一致：第一个沿用裸标题，第二个起加 -N
    expect(draftToAxs(d, {})).toContain("> 东 -> 开场-2");
  });

  it("ChoiceInstruction 目标 ID 投影为目标 Beat 标题", () => {
    const d = draftOf([
      node("choice", {
        title: "抉择",
        script: [{ op: "choice", options: [{ label: "向东", to: "east" }] }],
      }),
      node("east", { title: "东方" }),
    ]);

    expect(draftToAxs(d, {})).toBe("# 抉择\n> 向东 -> 东方\n\n# 东方\n");
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

  it("同名 Beat 不许共用同一个既有节点 id（这是 Writer 保存的主通路）", () => {
    let n = 0;
    const plan = parseAxsToPlan(
      "# 开场\n第一处开场。\n\n# 开场\n第二处开场。\n",
      {},
      [{ id: "existing-1", title: "开场" }],
      [],
      () => `gen-${++n}`,
    );
    // 载荷里节点 id 必须唯一：两个同 id 节点送到存储侧就是后写悄悄覆盖前写
    expect(plan.nodes.map((p) => p.id)).toEqual(["existing-1", "gen-1"]);
    // 邻接边两端若解析成同一个 id，会退化成自环
    expect(plan.edges.every((e) => e.source !== e.target)).toBe(true);
  });

  it("关键拍判定在 Writer 主通路上也钉住（映射归一成一份权威后，两路都要拦得下来）", () => {
    let n = 0;
    const plan = parseAxsToPlan(
      "# 开始\n旁白：开场。\n\n# 第二拍 [key: intro]\n旁白：说明。\n\n# 第三拍\n旁白：其它。\n",
      {},
      [],
      [],
      () => `n${++n}`,
    );
    // 「标题=开始」或「key=intro」才算关键拍；这条此前只在 axs.import 那一侧被钉过，
    // 而 Writer 保存走的是这里——一次 is_anchor 的回归只会红一半。
    expect(plan.nodes.map((p) => p.narrative.is_anchor)).toEqual([true, true, false]);
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
  /**
   * 2026-10-01 复审新增：画布投影曾把 `narrative_data` 按 13 键白名单**重建**，
   * 于是 legacy 分支组 `choices`（`buildScriptFromLegacy` 的唯一输入）连同
   * 白名单外的所有键一起消失，零诊断。生产链是
   * `openWriterAtSelection` → `projectAxsFromCanvas` → `setAxsSource` → 保存落盘，
   * 所以"在 Writer 里打开一次"就足以永久删掉选项。
   *
   * 这条特意**带对照组**（同一节点走 `draftToAxs` 直连），
   * 因为责任很容易被推给 `buildScriptFromLegacy`：只有两组读数一起看，
   * 才能证明丢失发生在画布这一层而不是投影层。
   * 牙：把 `canvasNodeToMergeable` 装回"白名单重建"形状 ⇒ 恰好 1 红（对照组那半仍绿）。
   */
  it("画布碰过节点后仍保留 legacy choices 与白名单外的键（对照组：直连投影本就保留）", () => {
    const narrative = {
      title: "岔路口",
      script: [] as unknown[],
      choices: [
        { label: "走左", target_node_id: "b" },
        { label: "走右", target_node_id: "c" },
      ],
      customNarrativeKey: 42,
    };
    const base = {
      id: "a",
      stage_id: null,
      editor_data: { position: { x: 0, y: 0 }, customEditorKey: "keep-me" },
      narrative_data: narrative,
      sort_order: 0,
    };
    const all = [
      base,
      { id: "b", stage_id: null, narrative_data: { title: "左路", script: [] }, sort_order: 1 },
      { id: "c", stage_id: null, narrative_data: { title: "右路", script: [] }, sort_order: 2 },
    ];

    // 对照组：不经画布，直连内核投影——本来就该有选项。
    // 注意这里必须用 **Draft 形态**（`narrative`）另建一份：`all` 是传输态形态（`narrative_data`），
    // 两种形态字段名不同，混用会造出一个"节点没有 narrative"的假红。
    const direct = draftToAxs(
      createDraft({
        nodes: [
          { id: "a", narrative: narrative as never },
          { id: "b", narrative: { title: "左路", script: [] } as never },
          { id: "c", narrative: { title: "右路", script: [] } as never },
        ],
      }),
      ROLES,
    );
    expect(direct).toContain("走左");
    expect(direct).toContain("走右");

    // 实验组：同节点经画布投影
    const viaCanvas = projectAxsFromCanvas(
      [{ id: "a", position: { x: 0, y: 0 }, data: { ...narrative } }],
      [],
      all as never,
      [],
      [],
      ROLES,
    );
    expect(viaCanvas).toContain("走左");
    expect(viaCanvas).toContain("走右");
  });

  it("画布投影不得把画布私有的 stage_id 漏进 narrative_data", () => {
    // 上一条的改法是"以 base 的持久态为底 + 覆盖已知键"，刻意**不**整体铺开画布 data，
    // 因为生产里 data = {...narrative, stage_id}。这条钉住那个取舍。
    const out = projectAxsFromCanvas(
      [{ id: "a", position: { x: 0, y: 0 }, data: { title: "相遇", script: [], stage_id: "s9" } }],
      [],
      [mergeable("a", "相遇", "s1")],
      [],
      [{ id: "s9", title: "新舞台" }],
      ROLES,
    );
    // stage_id 只该影响 @stage(...) 那一行，不该作为拍字段混进正文
    expect(out).toContain("@stage(新舞台)");
    expect(out.split("\n").filter((l) => l.trim().startsWith("stage_id"))).toHaveLength(0);
  });

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

  it("画布物化把第二组分支的丢失交给调用方，且文本与不传诊断时逐字相同", () => {
    /*
     * 三个投影时刻里的第三个：`openWriterAtSelection` 把这次投影的返回值**直接写进用户正在看的
     * 编辑框**，所以"丢了东西却没人说"在这一趟比装载或保存时更没有别的出口。
     * 对照组（只有一组分支 ⇒ 诊断必须为空）是这条判据的一部分：没有它，
     * "只要递了数组就永远塞一条告警"这种假接法也能全绿。
     */
    const beat = (labels: string[][]) => ({
      title: "抉择",
      script: [
        { op: "narration", text: "天色渐晚。" },
        ...labels.map((opts) => ({
          op: "choice",
          options: opts.map((label) => ({ label, target_node_id: null })),
        })),
      ],
    });
    type Beat = ReturnType<typeof beat>;
    const call = (narrative: Beat, diagnostics?: AxsDiagnostic[]) =>
      projectAxsFromCanvas(
        [{ id: "a", position: { x: 0, y: 0 }, data: { ...narrative } }],
        [],
        [mergeable("a", "抉择")],
        [],
        [],
        ROLES,
        undefined,
        diagnostics,
      );

    const two = beat([["离开"], ["留下"]]);
    const warns: AxsDiagnostic[] = [];
    const withDiag = call(two, warns);
    expect(withDiag, `诊断出参不该改变文本：${JSON.stringify(warns)}`).toBe(call(two));
    expect(warns.map((w) => w.message).join("\n")).toContain("读不回来");

    const clean: AxsDiagnostic[] = [];
    call(beat([["离开"]]), clean);
    expect(clean, "一组分支不该被报成丢失").toHaveLength(0);
  });
});

describe("draftToAxs 的发射侧诊断出参（Writer 主通路会把它显示出来）", () => {
  /*
   * `printAxs` 那三条判据量的是发射器本身；这一段量的是**投影层有没有把那个出参真的接上**。
   * 少接一层（editor-core 收了但不往上交，或 web 交了但 hook 不用）在这段就会红，
   * 而只在最底下加参数、上面全是摆设——正是本项目点过名的「收下形参却不用」那一族。
   */
  const twoGroups = {
    title: "抉择",
    script: [
      { op: "narration", text: "天色渐晚。" },
      { op: "choice", options: [{ label: "离开", target_node_id: null }] },
      { op: "choice", options: [{ label: "留下", target_node_id: null }] },
    ],
  };

  it("把第二组分支的丢失报给调用方，且投影文本与不传诊断时逐字相同", () => {
    const d = draftOf([node("a", twoGroups as never)]);
    const plain = draftToAxs(d, {});
    const diagnostics: AxsDiagnostic[] = [];
    const withDiag = draftToAxs(d, {}, diagnostics);
    expect(withDiag).toBe(plain);
    expect(withDiag).not.toContain("留下");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe("warning");
    expect(diagnostics[0]?.message).toContain("读不回来");
  });

  it("一组分支时投影层也不该报（否则 Writer 每次都挂着一条噪音条）", () => {
    const d = draftOf([
      node("a", {
        title: "抉择",
        script: [
          { op: "choice", options: [{ label: "离开", target_node_id: null }] },
        ],
      } as never),
    ]);
    const diagnostics: AxsDiagnostic[] = [];
    draftToAxs(d, {}, diagnostics);
    expect(diagnostics).toEqual([]);
  });
});
