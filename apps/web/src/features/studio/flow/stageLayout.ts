import type { Node } from "reactflow";
import type { ProjectSceneResponse } from "@/shared/types/project";

import { STAGE_PALETTE, stageColorIndex } from "./stageColors";

const NODE_W = 280;
const NODE_H = 120;
const LANE_PAD = 40;

export interface StageLane {
  stageId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

export function stageNodeCounts(
  nodes: Node[],
  scenes: ProjectSceneResponse[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const scene of scenes) counts[scene.id] = 0;
  for (const node of nodes) {
    const sid = node.data.stage_id as string | undefined;
    if (sid && sid in counts) counts[sid] += 1;
  }
  return counts;
}

export function computeStageLanes(
  nodes: Node[],
  scenes: ProjectSceneResponse[],
): StageLane[] {
  if (!scenes.length || !nodes.length) return [];
  const stageIds = scenes.map((s) => s.id);

  return scenes
    .map((scene) => {
      const stageNodes = nodes.filter((n) => n.data.stage_id === scene.id);
      if (!stageNodes.length) return null;

      const xs = stageNodes.map((n) => n.position.x);
      const ys = stageNodes.map((n) => n.position.y);
      const minX = Math.min(...xs) - LANE_PAD;
      const minY = Math.min(...ys) - LANE_PAD - 24;
      const maxX = Math.max(...xs.map((x) => x + NODE_W)) + LANE_PAD;
      const maxY = Math.max(...ys.map((y) => y + NODE_H)) + LANE_PAD;
      const palette = STAGE_PALETTE[stageColorIndex(scene.id, stageIds)];

      return {
        stageId: scene.id,
        title: scene.title,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        fill: `${palette.dot}12`,
        stroke: `${palette.dot}30`,
      };
    })
    .filter((lane): lane is StageLane => lane !== null);
}

export function layoutNodesByStage(
  nodes: Node[],
  scenes: ProjectSceneResponse[],
): Node[] {
  if (!scenes.length) return nodes;

  const COL_W = 380;
  const ROW_H = 140;
  const START_X = 60;
  const START_Y = 60;

  const groups = new Map<string, Node[]>();
  for (const scene of scenes) groups.set(scene.id, []);
  const orphans: Node[] = [];

  for (const node of nodes) {
    const sid = node.data.stage_id as string | undefined;
    if (sid && groups.has(sid)) {
      groups.get(sid)!.push(node);
    } else {
      orphans.push(node);
    }
  }

  const positioned = new Map<string, Node>();

  scenes.forEach((scene, colIdx) => {
    const group = groups.get(scene.id) || [];
    group.forEach((node, rowIdx) => {
      positioned.set(node.id, {
        ...node,
        position: {
          x: START_X + colIdx * COL_W,
          y: START_Y + rowIdx * ROW_H,
        },
      });
    });
  });

  orphans.forEach((node, idx) => {
    positioned.set(node.id, {
      ...node,
      position: {
        x: START_X + scenes.length * COL_W,
        y: START_Y + idx * ROW_H,
      },
    });
  });

  return nodes.map((n) => positioned.get(n.id) ?? n);
}

export function stageBounds(
  nodes: Node[],
  stageId: string,
): { cx: number; cy: number; width: number; height: number } | null {
  const stageNodes = nodes.filter((n) => n.data.stage_id === stageId);
  if (!stageNodes.length) return null;

  const xs = stageNodes.map((n) => n.position.x);
  const ys = stageNodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs.map((x) => x + NODE_W));
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys.map((y) => y + NODE_H));

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}
