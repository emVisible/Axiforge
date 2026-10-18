import { describe, expect, it } from "vitest";
import type { Draft, NarrativeNode } from "@axiforge/editor-core";

import {
  canvasSnapshotFromKernel,
  conditionGroupFromItems,
  inspectorFromNarrative,
  patchFromForm,
  projectRfEdges,
  projectRfNodes,
} from "./editorProjection";
import type { ConditionItem, NodeFormState } from "../flow/types";

const node = (id: string, stageId: string | null): NarrativeNode =>
  ({
    id,
    stageId,
    position: { x: 10, y: 20 },
    narrative: { title: id, script: [] },
  }) as unknown as NarrativeNode;

const draft = (nodes: NarrativeNode[], edges: { id: string; source: string; target: string }[]): Draft =>
  ({
    rev: 1,
    nodes: new Map(nodes.map((n) => [n.id, n])),
    edges,
    roles: [],
    scenes: [],
  }) as unknown as Draft;

const scene = (id: string) => ({ id, title: `舞台 ${id}` }) as never;
const A = node("a", "s1");
const B = node("b", "s1");
const C = node("c", "s2");
const EDGES = [
  { id: "a-b", source: "a", target: "b" },
  { id: "b-c", source: "b", target: "c" },
];

describe("projectRfEdges", () => {
  it("全览模式出全部边", () => {
    const out = projectRfEdges({
      draft: draft([A, B, C], EDGES),
      viewMode: "full",
      currentScene: null,
      selectedEdgeId: null,
    });
    expect(out.map((e) => e.id)).toEqual(["a-b", "b-c"]);
  });

  it("单舞台模式只留两端都在该舞台的边（跨舞台边被切掉）", () => {
    const out = projectRfEdges({
      draft: draft([A, B, C], EDGES),
      viewMode: "stage",
      currentScene: scene("s1"),
      selectedEdgeId: null,
    });
    expect(out.map((e) => e.id)).toEqual(["a-b"]);
  });

  it("selectedEdgeId 只标记那一条，不改变边的集合", () => {
    const out = projectRfEdges({
      draft: draft([A, B, C], EDGES),
      viewMode: "full",
      currentScene: null,
      selectedEdgeId: "b-c",
    });
    expect(out.map((e) => e.selected)).toEqual([false, true]);
  });
});

describe("projectRfNodes", () => {
  it("单舞台模式按 stageId 过滤，选中与淡出标记逐节点独立", () => {
    const out = projectRfNodes({
      draft: draft([A, B, C], EDGES),
      dragPositions: new Map([["b", { x: 99, y: 99 }]]),
      selectedId: "a",
      filteredStageId: "s2",
      viewMode: "stage",
      currentScene: scene("s1"),
      scenesList: [scene("s1"), scene("s2")] as never,
    });
    expect(out.map((n) => n.id)).toEqual(["a", "b"]);
    expect(out[0]?.selected).toBe(true);
    expect(out[1]?.selected).toBe(false);
    // 拖拽临时层优先于草稿落位
    expect(out[1]?.position).toEqual({ x: 99, y: 99 });
  });

  it("全览模式出全部节点", () => {
    const out = projectRfNodes({
      draft: draft([A, B, C], EDGES),
      dragPositions: new Map(),
      selectedId: null,
      filteredStageId: null,
      viewMode: "full",
      currentScene: null,
      scenesList: [scene("s1"), scene("s2")] as never,
    });
    expect(out.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
});

describe("检视器读写侧（Inspector ↔ narrativeData）", () => {
  it("缺字段一律给真实空值：不出现 undefined，也不把没有的 trigger_condition 读成空条件组", () => {
    const empty = inspectorFromNarrative(undefined);
    expect(empty.form).toEqual({
      title: "", description: "", is_anchor: false, is_ending: false,
      ending_label: "", speaker: "", dialogue: "", narration: "",
    });
    expect(empty.conditions).toEqual([]);
    expect(empty.effects).toEqual([]);
    expect(empty.nodeProps).toEqual([]);
    expect(empty.script).toEqual([]);
    expect(inspectorFromNarrative({}).script).toEqual([]);
    // trigger_condition 在但 conditions 缺：读成空列表而不是 [undefined]
    expect(inspectorFromNarrative({ trigger_condition: { type: "all" } }).conditions).toEqual([]);
  });

  it("脚本与属性原样带出；trigger_condition 里的条件被拆出来给表单", () => {
    const got = inspectorFromNarrative({
      title: "开场", is_anchor: 1, script: [{ op: "say", text: "在" }],
      props: ["key"], trigger_condition: { type: "all", conditions: [{ type: "flag", key: "k" }] },
    });
    expect(got.form.title).toBe("开场");
    expect(got.form.is_anchor).toBe(true);
    expect(got.script).toEqual([{ op: "say", text: "在" }]);
    expect(got.nodeProps).toEqual(["key"]);
    expect(got.conditions).toEqual([{ type: "flag", key: "k" }]);
  });

  it("写侧把复选框的 undefined 归一成 false——取消勾选不能写成「从没勾过」", () => {
    const base = {
      title: "t", description: "", is_anchor: undefined, is_ending: undefined,
      ending_label: "", speaker: "", dialogue: "", narration: "",
    } as unknown as NodeFormState;
    expect(patchFromForm(base)).toMatchObject({ is_anchor: false, is_ending: false, title: "t" });
  });

  it("空条件组写 null：{type:'all',conditions:[]} 在两端编译器里都恒真，语义不同", () => {
    expect(conditionGroupFromItems([])).toBeNull();
    const one = [{ type: "flag", key: "k", operator: "eq", value: "1" }] as ConditionItem[];
    expect(conditionGroupFromItems(one)).toEqual({ type: "all", conditions: one });
  });
});

describe("canvasSnapshotFromKernel（内核节点 → 投影器入参；从 hook 里搬出来的那一截）", () => {
  it("摊平 narrative 并把 stage_id 注入 data，同时不写回内核节点", () => {
    const n = node("a", "s1");
    expect(canvasSnapshotFromKernel(n)).toEqual({
      id: "a",
      position: { x: 10, y: 20 },
      data: { title: "a", script: [], stage_id: "s1" },
    });
    expect("stage_id" in n).toBe(false);
  });

  it("stageId 为 null 时 data.stage_id 如实为 null（投影器据此排舞台，不能糊成空串）", () => {
    expect(canvasSnapshotFromKernel(node("b", null)).data.stage_id).toBeNull();
  });
});
