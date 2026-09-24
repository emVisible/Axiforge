import { MarkerType, type Edge, type Node } from "reactflow";

import type { Instruction } from "@axiforge/core";
import type { Draft } from "@axiforge/editor-core";
import type { ProjectSceneResponse } from "@/shared/types/project";

import { STAGE_PALETTE, stageColorIndex } from "../flow/stageColors";
import { flowEdgeStroke } from "../flow/types";
import type { CanvasViewMode } from "./useCanvasView";

/**
 * 画布投影：把内核 Draft 变成 React Flow 的 nodes/edges。
 *
 * 之所以从 useProjectEditor 里搬出来：这两段是**纯函数**（同样的输入必得同样的输出），
 * 放在 hook 里既撑大文件又无法单测；搬出来之后 hook 只负责决定「何时重算」，
 * 「算什么」由这里承担并可直接被用例覆盖。useMemo 的依赖数组仍留在宿主，逐一未改。
 */

const stageScopedIds = (
  draft: Draft,
  stageScoped: ProjectSceneResponse | null | undefined,
): Set<string> | null =>
  stageScoped
    ? new Set(
        [...draft.nodes.values()]
          .filter((n) => n.stageId === stageScoped.id)
          .map((n) => n.id),
      )
    : null;

/** Draft 节点 → React Flow 节点投影（data 形状与旧 nodeResponseToFlowNode 逐字段一致） */
export function flowNodeOf(
  draft: Draft,
  id: string,
  dragPositions: Map<string, { x: number; y: number }>,
  selected: boolean,
  scenes: ProjectSceneResponse[] = [],
  dimmed = false,
): Node | null {
  const n = draft.nodes.get(id);
  if (!n) return null;
  const nd = n.narrative;
  const tc = nd.trigger_condition as Record<string, unknown> | null;
  const ef = (nd.effects as unknown as Record<string, unknown>[]) || [];
  const script = (nd.script as Instruction[]) || [];
  const props = (nd.props as string[]) || [];
  const palette = STAGE_PALETTE[stageColorIndex(n.stageId, scenes.map((x) => x.id))];
  return {
    id: n.id,
    type: "custom",
    position: dragPositions.get(n.id) ?? n.position,
    selected,
    style: dimmed ? { opacity: 0.3 } : undefined,
    data: {
      title: nd.title || "未命名",
      description: nd.description || "",
      is_anchor: Boolean(nd.is_anchor),
      is_ending: Boolean(nd.is_ending),
      ending_label: (nd.ending_label as string) || "",
      speaker: nd.speaker || "",
      dialogue: nd.dialogue || "",
      narration: nd.narration || "",
      script,
      has_conditions: Boolean((tc as { conditions?: unknown[] } | null)?.conditions?.length),
      has_effects: Boolean(ef.length),
      has_script: Boolean(script.length),
      trigger_condition: tc,
      effects: ef,
      props,
      has_props: Boolean(props.length),
      stage_id: n.stageId,
      stage_title: scenes.find((x) => x.id === n.stageId)?.title ?? null,
      stage_border: palette.border,
      stage_header: palette.header,
      stage_dot: palette.dot,
    },
  };
}

/**
 * 上移自宿主：Draft 节点 → React Flow 节点投影
 * （data 形状与旧 nodeResponseToFlowNode 逐字段一致）
 */
export function projectRfNodes(input: {
  draft: Draft;
  dragPositions: Map<string, { x: number; y: number }>;
  selectedId: string | null;
  filteredStageId: string | null;
  viewMode: CanvasViewMode;
  currentScene: ProjectSceneResponse | null;
  scenesList: ProjectSceneResponse[];
}): Node[] {
  const {
    draft,
    dragPositions,
    selectedId,
    filteredStageId,
    viewMode,
    currentScene,
    scenesList,
  } = input;
  const stageScoped = viewMode === "stage" && currentScene;
  return [...draft.nodes.values()]
    .filter((n) => (stageScoped ? n.stageId === currentScene!.id : true))
    .map((n) =>
      flowNodeOf(
        draft,
        n.id,
        dragPositions,
        selectedId === n.id,
        scenesList,
        Boolean(filteredStageId && n.stageId !== filteredStageId),
      )!,
    );
}

export function projectRfEdges(input: {
  draft: Draft;
  viewMode: CanvasViewMode;
  currentScene: ProjectSceneResponse | null;
  selectedEdgeId: string | null;
}): Edge[] {
  const { draft, viewMode, currentScene, selectedEdgeId } = input;
  const visible = stageScopedIds(
    draft,
    viewMode === "stage" ? currentScene : null,
  );
  return draft.edges
    .filter((e) => !visible || (visible.has(e.source) && visible.has(e.target)))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: "output",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: flowEdgeStroke, strokeWidth: 2 },
      label: e.label || "",
      selected: selectedEdgeId === e.id,
    }));
}
