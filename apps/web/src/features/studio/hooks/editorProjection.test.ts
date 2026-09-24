import { describe, expect, it } from "vitest";
import type { Draft, NarrativeNode } from "@axiforge/editor-core";

import { projectRfEdges, projectRfNodes } from "./editorProjection";

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
