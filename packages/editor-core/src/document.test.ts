import { describe, expect, it } from "vitest";
import type { Envelope, Transaction } from "./types";
import { apply, createDraft, emptyDraft, gridPosition } from "./document";
import { emptyJournal, journalUndo, record, redo } from "./journal";

let seq = 0;
const idGen = () => `gen-${++seq}`;

const say = (text: string) => ({ op: "say" as const, speaker: "甲", text });
const wait = (ms: number) => ({ op: "wait" as const, ms });

function baseDraft() {
  return createDraft({
    nodes: [
      {
        id: "a",
        narrative: { title: "甲", script: [say("一"), wait(500)] },
        sortOrder: 0,
      },
      { id: "b", narrative: { title: "乙" }, sortOrder: 1 },
    ],
    edges: [{ id: "e1", source: "a", target: "b", label: null }],
    roles: [{ id: "r1", characterRefId: "char-1", name: "甲" }],
    scenes: [{ id: "s1", title: "主场景" }],
  });
}

const env = (tx: Envelope["tx"], origin: Envelope["origin"] = "cut"): Envelope => ({
  tx,
  origin,
});

// ---------------------------------------------------------------------------
// 创建与不变量
// ---------------------------------------------------------------------------

describe("createDraft / 不变量", () => {
  it("空 Draft：rev=0，四集合为空", () => {
    const d = emptyDraft();
    expect(d.rev).toBe(0);
    expect(d.nodes.size).toBe(0);
    expect(d.edges).toEqual([]);
  });

  it("apply 成功后 rev 单调 +1（I1），原 Draft 不被修改（值语义）", () => {
    const d0 = baseDraft();
    const before = (d0.nodes.get("a")!.narrative.script as unknown[]).length;
    const r = apply(d0, env({ kind: "script.remove", nodeId: "a", index: 1 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.rev).toBe(d0.rev + 1);
    // 原 Draft 保持原样
    expect((d0.nodes.get("a")!.narrative.script as unknown[]).length).toBe(before);
    expect(d0.rev).toBe(0);
  });

  it("确定性（I5）：同一序列产出相同 rev 与内容", () => {
    const run = () => {
      let d = baseDraft();
      const r1 = apply(d, env({ kind: "script.patch", nodeId: "a", index: 0, patch: { text: "改" } }));
      d = (r1 as { ok: true; draft: typeof d }).draft;
      const r2 = apply(d, env({ kind: "node.remove", nodeId: "b" }));
      d = (r2 as { ok: true; draft: typeof d }).draft;
      return { rev: d.rev, a: (d.nodes.get("a")!.narrative.script as unknown[])[0], size: d.nodes.size };
    };
    expect(run()).toEqual(run());
  });

  it("createDraft 全缺省输入", () => {
    const d = createDraft({});
    expect(d.nodes.size).toBe(0);
    expect(d.edges).toEqual([]);
    expect(d.roles).toEqual([]);
    expect(d.scenes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// script.* 事务
// ---------------------------------------------------------------------------

describe("script 事务", () => {
  it("script.replace 替换指令序列", () => {
    const r = apply(baseDraft(), env({ kind: "script.replace", nodeId: "a", script: [wait(1)] }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.nodes.get("a")!.narrative.script as unknown[]).toEqual([wait(1)]);
    }
  });

  it("script.replace 拒绝未知 op（I3）", () => {
    const r = apply(baseDraft(), env({
      kind: "script.replace",
      nodeId: "a",
      script: [{ op: "boom" } as unknown as never],
    }));
    expect(r).toEqual({
      ok: false,
      error: { code: "invalid_script", nodeId: "a", detail: expect.any(String) },
    });
  });

  it("script.reorder 移动指令并拒绝越界/同位", () => {
    const ok = apply(baseDraft(), env({ kind: "script.reorder", nodeId: "a", from: 0, to: 1 }));
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect((ok.draft.nodes.get("a")!.narrative.script as unknown[]).map((i: any) => i.op)).toEqual(["wait", "say"]);
    }
    const bad = apply(baseDraft(), env({ kind: "script.reorder", nodeId: "a", from: 5, to: 0 }));
    expect(bad.ok).toBe(false);
    const neg = apply(baseDraft(), env({ kind: "script.reorder", nodeId: "a", from: -1, to: 0 }));
    expect(neg.ok).toBe(false);
    const negTo = apply(baseDraft(), env({ kind: "script.reorder", nodeId: "a", from: 0, to: -1 }));
    expect(negTo.ok).toBe(false);
    const same = apply(baseDraft(), env({ kind: "script.reorder", nodeId: "a", from: 1, to: 1 }));
    expect(same.ok).toBe(false);
  });

  it("script.remove / script.patch 拒绝负索引", () => {
    const rm = apply(baseDraft(), env({ kind: "script.remove", nodeId: "a", index: -1 }));
    expect(rm.ok).toBe(false);
    const pa = apply(baseDraft(), env({ kind: "script.patch", nodeId: "a", index: -1, patch: {} }));
    expect(pa.ok).toBe(false);
  });

  it("script.remove 删除指定片段", () => {
    const r = apply(baseDraft(), env({ kind: "script.remove", nodeId: "a", index: 0 }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect((r.draft.nodes.get("a")!.narrative.script as unknown[]).map((i: any) => i.op)).toEqual(["wait"]);
    }
  });

  it("script.patch 合并字段但拒绝更换 op", () => {
    const ok = apply(baseDraft(), env({
      kind: "script.patch",
      nodeId: "a",
      index: 0,
      patch: { text: "改词" },
    }));
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect((ok.draft.nodes.get("a")!.narrative.script as unknown[])[0]).toMatchObject({ op: "say", text: "改词" });
    }
    const conflict = apply(baseDraft(), env({
      kind: "script.patch",
      nodeId: "a",
      index: 0,
      patch: { op: "wait" },
    }));
    expect(conflict).toEqual({
      ok: false,
      error: { code: "op_conflict", nodeId: "a", index: 0 },
    });
  });

  it("所有 script 事务对缺失节点返回 node_not_found", () => {
    const txs = [
      { kind: "script.replace", nodeId: "zz", script: [] },
      { kind: "script.reorder", nodeId: "zz", from: 0, to: 1 },
      { kind: "script.remove", nodeId: "zz", index: 0 },
      { kind: "script.patch", nodeId: "zz", index: 0, patch: {} },
      { kind: "node.patch", nodeId: "zz", patch: {} },
    ] as Transaction[];
    for (const tx of txs) {
      const r = apply(baseDraft(), env(tx));
      expect(r).toEqual({ ok: false, error: { code: "node_not_found", nodeId: "zz" } });
    }
  });
});

// ---------------------------------------------------------------------------
// node / edges / roles 事务
// ---------------------------------------------------------------------------

describe("node 与图事务", () => {
  it("node.move 更新位置并拒绝缺失节点（拖拽落点记序）", () => {
    const ok = apply(baseDraft(), env({ kind: "node.move", nodeId: "a", position: { x: 320, y: 64 } }, "flow"));
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.draft.nodes.get("a")!.position).toEqual({ x: 320, y: 64 });
      expect(ok.draft.rev).toBe(1);
    }
    const miss = apply(baseDraft(), env({ kind: "node.move", nodeId: "zz", position: { x: 0, y: 0 } }, "flow"));
    expect(miss).toEqual({ ok: false, error: { code: "node_not_found", nodeId: "zz" } });
  });

  it("node.restage 更新舞台归属并拒绝缺失节点", () => {
    const ok = apply(baseDraft(), env({ kind: "node.restage", nodeId: "a", stageId: "s9" }, "flow"));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.draft.nodes.get("a")!.stageId).toBe("s9");
    const miss = apply(baseDraft(), env({ kind: "node.restage", nodeId: "zz", stageId: null }, "flow"));
    expect(miss).toEqual({ ok: false, error: { code: "node_not_found", nodeId: "zz" } });
  });

  it("node.add 拒绝重复 id", () => {
    const r = apply(baseDraft(), env({
      kind: "node.add",
      node: { id: "a", stageId: null, position: { x: 0, y: 0 }, narrative: { title: "重复" }, sortOrder: 2 },
    }));
    expect(r).toEqual({ ok: false, error: { code: "duplicate_node", nodeId: "a" } });
  });

  it("node.add / node.patch 拒绝非法 script（I3）", () => {
    const bad = [1, "x"] as unknown as never[];
    const add = apply(baseDraft(), env({
      kind: "node.add",
      node: { id: "c", stageId: null, position: { x: 0, y: 0 }, narrative: { title: "丙", script: bad }, sortOrder: 0 },
    }));
    expect(add).toEqual({
      ok: false,
      error: { code: "invalid_script", nodeId: "c", detail: expect.any(String) },
    });
    const patch = apply(baseDraft(), env({
      kind: "node.patch",
      nodeId: "a",
      patch: { script: bad },
    }));
    expect(patch).toEqual({
      ok: false,
      error: { code: "invalid_script", nodeId: "a", detail: expect.any(String) },
    });
  });

  it("node.remove 级联移除关联边（I2）", () => {
    const r = apply(baseDraft(), env({ kind: "node.remove", nodeId: "a" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.nodes.has("a")).toBe(false);
      expect(r.draft.edges).toEqual([]);
      expect(r.changed.edges).toBe(true);
    }
  });

  it("edges.replaceAll 拒绝悬空边（source 或 target 缺失）", () => {
    const targetMissing = apply(baseDraft(), env({
      kind: "edges.replaceAll",
      edges: [{ id: "x", source: "a", target: "ghost", label: null }],
    }));
    expect(targetMissing).toEqual({
      ok: false,
      error: { code: "edge_dangling", edgeId: "x", missing: "ghost" },
    });
    const sourceMissing = apply(baseDraft(), env({
      kind: "edges.replaceAll",
      edges: [{ id: "y", source: "ghost", target: "a", label: null }],
    }));
    expect(sourceMissing).toEqual({
      ok: false,
      error: { code: "edge_dangling", edgeId: "y", missing: "ghost" },
    });
  });

  it("node.patch 接受合法 script", () => {
    const r = apply(baseDraft(), env({
      kind: "node.patch",
      nodeId: "b",
      patch: { script: [wait(1)] },
    }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.draft.nodes.get("b")!.narrative.script as unknown[]).toEqual([wait(1)]);
  });

  it("edges.replaceAll 合法边整体替换成功", () => {
    const edges = [
      { id: "n1", source: "a", target: "b", label: "分支" },
      { id: "n2", source: "b", target: "a", label: null },
    ];
    const r = apply(baseDraft(), env({ kind: "edges.replaceAll", edges }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.edges).toEqual(edges);
      expect(r.changed.edges).toBe(true);
    }
  });

  it("node.add 接受无 script 的节点", () => {
    const r = apply(baseDraft(), env({
      kind: "node.add",
      node: { id: "c", stageId: null, position: { x: 0, y: 0 }, narrative: { title: "丙" }, sortOrder: 0 },
    }));
    expect(r.ok).toBe(true);
  });

  it("node.patch 合并 narrative 字段", () => {
    const r = apply(baseDraft(), env({ kind: "node.patch", nodeId: "b", patch: { is_ending: true } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.nodes.get("b")!.narrative.is_ending).toBe(true);
      expect(r.draft.nodes.get("b")!.narrative.title).toBe("乙");
    }
  });
});

describe("roles 事务", () => {
  it("role.add / role.remove，拒绝重复 characterRefId", () => {
    const add = apply(baseDraft(), env({
      kind: "role.add",
      role: { id: "r2", characterRefId: "char-2", name: "乙" },
    }, "flow"));
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    expect(add.draft.roles).toHaveLength(2);
    const dup = apply(add.draft, env({
      kind: "role.add",
      role: { id: "r3", characterRefId: "char-2", name: "乙二" },
    }));
    expect(dup).toEqual({
      ok: false,
      error: { code: "duplicate_role", characterRefId: "char-2" },
    });
    const rm = apply(add.draft, env({ kind: "role.remove", characterRefId: "char-1" }, "flow"));
    expect(rm.ok).toBe(true);
    if (rm.ok) expect(rm.draft.roles.map((r) => r.characterRefId)).toEqual(["char-2"]);
  });
});

// ---------------------------------------------------------------------------
// axs.import
// ---------------------------------------------------------------------------

describe("axs.import", () => {
  const SOURCE = "# 开始\n旁白：开场。\n\n# 新章\n甲: 台词。\n";

  it("整体覆写节点图：标题复用既有 id，新节点走 idGen，边物化", () => {
    seq = 0;
    // baseDraft 标题为 甲/乙；SOURCE 的 开始/新章 均为新标题 → 走 idGen
    const r = apply(baseDraft(), env({ kind: "axs.import", source: SOURCE, roles: { 甲: "char-1" } }, "writer"), idGen);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.nodes.size).toBe(2);
    expect(r.draft.nodes.has("a")).toBe(false);
    const start = r.draft.nodes.get("gen-1");
    expect(start?.narrative.title).toBe("开始");
    expect(start?.narrative.is_anchor).toBe(true);
    const fresh = r.draft.nodes.get("gen-2");
    expect(fresh?.narrative.title).toBe("新章");
    expect((fresh?.narrative.script as unknown[] | undefined)?.[0]).toMatchObject({ op: "say", characterId: "char-1" });
    expect(r.draft.edges[0]?.source).toBe("gen-1");
    expect(r.draft.edges[0]?.target).toBe("gen-2");
  });

  it("标题匹配既有节点时复用其 id（Writer 覆写不丢节点身份）", () => {
    seq = 0;
    const d = createDraft({
      nodes: [{ id: "keep-1", narrative: { title: "开始", script: [] } }],
    });
    const r = apply(d, env({ kind: "axs.import", source: "# 开始\n旁白：改写。\n", roles: {} }, "writer"), idGen);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.nodes.has("keep-1")).toBe(true);
    expect((r.draft.nodes.get("keep-1")!.narrative.script as unknown[] | undefined)?.[0]).toMatchObject({ op: "narration", text: "旁白：改写。" });
  });

  it("网格布局与 sort_order 按序生成", () => {
    seq = 10;
    const r = apply(emptyDraft(), env({ kind: "axs.import", source: SOURCE, roles: {} }, "writer"), idGen);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const nodes = [...r.draft.nodes.values()].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(nodes[0]!.position).toEqual(gridPosition(0));
    expect(nodes[1]!.position).toEqual(gridPosition(1));
  });

  it("舞台标题解析为 stageId；触发条件进入 narrative", () => {
    const r = apply(baseDraft(), env({
      kind: "axs.import",
      source: "# 主场景开场 @stage(主场景) [if: flag.x == 1]\n旁白：x\n",
      roles: {},
    }, "writer"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      const node = [...r.draft.nodes.values()][0]!;
      expect(node.stageId).toBe("s1");
      expect(node.narrative.trigger_condition).toMatchObject({ type: "flag", key: "x" });
    }
  });

  it("UUID 标题的 beat 直接复用其 id；key:intro 置为锚点；未知舞台落 null；网格按 4 列换行", () => {
    const UUID = "550e8400-e29b-41d4-a716-446655440000";
    const source = [
      `# ${UUID} [key: intro]`,
      "旁白：一",
      "",
      "# 第二拍 @stage(不存在舞台)",
      "旁白：二",
      "",
      "# 第三拍",
      "旁白：三",
      "",
      "# 第四拍",
      "旁白：四",
      "",
      "# 第五拍",
      "旁白：五",
    ].join("\n");
    const r = apply(emptyDraft(), env({ kind: "axs.import", source, roles: {} }, "writer"), idGen);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.nodes.has(UUID)).toBe(true);
    expect(r.draft.nodes.get(UUID)!.narrative.is_anchor).toBe(true);
    const second = [...r.draft.nodes.values()].find((n) => n.narrative.title === "第二拍")!;
    expect(second.stageId).toBeNull();
    const fifth = [...r.draft.nodes.values()].find((n) => n.narrative.title === "第五拍")!;
    expect(fifth.position).toEqual(gridPosition(4));
    expect(fifth.position.y).toBeGreaterThan(gridPosition(0).y);
  });

  it("结局标记与 ending_label 进入 narrative", () => {
    const r = apply(emptyDraft(), env({
      kind: "axs.import",
      source: "# 终局 [ending: NE]\n旁白：完\n",
      roles: {},
    }, "writer"), idGen);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const node = [...r.draft.nodes.values()][0]!;
      expect(node.narrative.is_ending).toBe(true);
      expect(node.narrative.ending_label).toBe("NE");
    }
  });
});

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

describe("journal", () => {
  it("record → undo 指针回退到快照，redo 重放事务", () => {
    const d0 = baseDraft();
    const r1 = apply(d0, env({ kind: "script.remove", nodeId: "a", index: 0 }));
    const d1 = (r1 as { ok: true; draft: typeof d0 }).draft;
    let j = emptyJournal();
    j = record(j, { envelope: env({ kind: "script.remove", nodeId: "a", index: 0 }), rev: d0.rev, before: d0 });

    const u = journalUndo(d1, j);
    expect(u.ok).toBe(true);
    if (!u.ok) return;
    expect(u.draft.rev).toBe(d0.rev);
    expect(u.journal.future).toHaveLength(1);

    const r = redo(u.draft, u.journal, apply);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draft.rev).toBe(d1.rev);
      expect((r.draft.nodes.get("a")!.narrative.script as unknown[]).length).toBe(1);
    }
  });

  it("新事务入栈清空 future；空栈 undo/redo 返回失败", () => {
    let j = emptyJournal();
    expect(journalUndo(baseDraft(), j).ok).toBe(false);
    expect(redo(baseDraft(), j, apply).ok).toBe(false);
    j = record(j, { envelope: env({ kind: "node.remove", nodeId: "b" }), rev: 0, before: baseDraft() });
    j = record(j, { envelope: env({ kind: "node.remove", nodeId: "a" }), rev: 1, before: baseDraft() });
    expect(j.past).toHaveLength(2);
    expect(j.future).toHaveLength(0);
  });

  it("FIFO 淘汰：超过 max 丢弃最旧项（I7）", () => {
    let j = emptyJournal();
    for (let i = 0; i < 5; i++) {
      j = record(
        j,
        { envelope: env({ kind: "node.patch", nodeId: "a", patch: { title: String(i) } }), rev: i, before: baseDraft() },
        3,
      );
    }
    expect(j.past).toHaveLength(3);
    expect(j.past[0]!.rev).toBe(2);
  });

  it("redo 时事务应用失败则整体失败（不产生半状态）", () => {
    const d0 = baseDraft();
    const tx = env({ kind: "node.remove", nodeId: "b" });
    const r1 = apply(d0, tx);
    const d1 = (r1 as { ok: true; draft: typeof d0 }).draft;
    const j = record(emptyJournal(), { envelope: tx, rev: d0.rev, before: d0 });
    const u = journalUndo(d1, j);
    if (!u.ok) return fail("undo 应成功");
    // 构造 redo 必败：当前 Draft 已无节点 b（模拟环境漂移）
    const broken = createDraft({ nodes: [] });
    const r = redo(broken, u.journal, apply);
    expect(r.ok).toBe(false);
  });

  function fail(msg: string): never {
    throw new Error(msg);
  }
});
