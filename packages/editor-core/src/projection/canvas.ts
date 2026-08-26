/**
 * L3 画布快照合并（自 web projection.ts 语义平移）。
 * MergeableNode 以结构化窄接口承接传输态 DTO（ProjectNodeResponse 结构性满足）。
 */

import type { Instruction } from "@axiforge/core";
import { draftToAxs } from "./axs";
import type { Draft, Edge } from "../types";

export interface MergeableNode {
  id: string;
  stage_id?: string | null;
  scene_id?: string | null;
  editor_data?: Record<string, unknown>;
  narrative_data: Record<string, unknown>;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type CanvasNodeSnapshot = {
  id: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type CanvasEdgeSnapshot = {
  source: string;
  target: string;
  label?: string | null;
};

function canvasNodeToMergeable(
  node: CanvasNodeSnapshot,
  base?: MergeableNode,
): MergeableNode {
  const d = node.data;
  const now = new Date().toISOString();
  return {
    id: base ? String(base.id) : node.id,
    stage_id: (d.stage_id as string) ?? base?.stage_id ?? base?.scene_id ?? null,
    scene_id: base?.scene_id ?? null,
    editor_data: { position: node.position },
    narrative_data: {
      title: (d.title as string) || "未命名",
      description: (d.description as string) || "",
      is_anchor: Boolean(d.is_anchor),
      is_ending: Boolean(d.is_ending),
      ending_label: (d.ending_label as string) || null,
      speaker: (d.speaker as string) || null,
      dialogue: (d.dialogue as string) || null,
      narration: (d.narration as string) || null,
      script: (d.script as Instruction[]) || [],
      trigger_condition: d.trigger_condition,
      effects: d.effects,
      props: (d.props as string[]) || [],
    },
    sort_order: base?.sort_order ?? 0,
    created_at: base?.created_at ?? now,
    updated_at: base?.updated_at ?? now,
  };
}

/** 将画布节点合并进节点列表（单舞台模式会剔除该舞台已删节点）。 */
export function mergeCanvasIntoNodes(
  canvasNodes: CanvasNodeSnapshot[],
  allNodes: readonly MergeableNode[],
  options?: { scopeStageId?: string | null },
): MergeableNode[] {
  const canvasById = new Map(canvasNodes.map((n) => [n.id, n]));
  const knownIds = new Set(allNodes.map((n) => String(n.id)));
  const out: MergeableNode[] = [];

  for (const proj of allNodes) {
    const id = String(proj.id);
    const sid = proj.stage_id ?? proj.scene_id;
    const canvas = canvasById.get(id);

    if (options?.scopeStageId && sid === options.scopeStageId) {
      if (!canvas) continue;
      out.push(canvasNodeToMergeable(canvas, proj));
      continue;
    }

    if (canvas) {
      out.push(canvasNodeToMergeable(canvas, proj));
    } else {
      out.push(proj);
    }
  }

  for (const canvas of canvasNodes) {
    if (!knownIds.has(canvas.id)) {
      out.push(canvasNodeToMergeable(canvas));
    }
  }

  return out;
}

function canvasEdgeToEdge(e: CanvasEdgeSnapshot): Edge {
  return {
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label ?? null,
  };
}

export function canvasEdgesForProjection(
  canvasEdges: CanvasEdgeSnapshot[],
  projectEdges: readonly Edge[],
  scopeNodeIds: Set<string> | null,
): Edge[] {
  if (!scopeNodeIds) {
    return canvasEdges.map(canvasEdgeToEdge);
  }
  const preserved = projectEdges.filter((e) => {
    const src = String(e.source);
    const tgt = String(e.target);
    return !(scopeNodeIds.has(src) && scopeNodeIds.has(tgt));
  });
  return [...preserved, ...canvasEdges.map(canvasEdgeToEdge)];
}

/** 从画布状态生成 AXS 文本（未保存的剪辑/结构编辑即时预览，ADR-022）。 */
export function projectAxsFromCanvas(
  canvasNodes: CanvasNodeSnapshot[],
  canvasEdges: CanvasEdgeSnapshot[],
  allNodes: readonly MergeableNode[],
  projectEdges: readonly Edge[],
  scenes: Draft["scenes"],
  roles: Record<string, string>,
  options?: { scopeStageId?: string | null },
): string {
  const merged = mergeCanvasIntoNodes(canvasNodes, allNodes, options);
  const scopeNodeIds = options?.scopeStageId
    ? new Set(canvasNodes.map((n) => n.id))
    : null;
  const edges = canvasEdgesForProjection(canvasEdges, projectEdges, scopeNodeIds);
  const draft: Draft = {
    rev: 0,
    nodes: new Map(
      merged.map((n) => [
        String(n.id),
        {
          id: String(n.id),
          stageId: n.stage_id ?? n.scene_id ?? null,
          position:
            (n.editor_data?.position as { x: number; y: number }) ??
            { x: 0, y: 0 },
          narrative: n.narrative_data,
          sortOrder: n.sort_order ?? 0,
        },
      ]),
    ),
    edges,
    roles: [],
    scenes,
  };
  return draftToAxs(draft, roles);
}
