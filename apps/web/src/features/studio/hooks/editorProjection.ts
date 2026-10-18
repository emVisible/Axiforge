import { MarkerType, type Edge, type Node } from "reactflow";

import type { Instruction } from "@axiforge/core";
import type {
  CanvasNodeSnapshot,
  Draft,
  Edge as KernelEdge,
  NarrativeNode as KernelNode,
} from "@axiforge/editor-core";
import type { ProjectSceneResponse } from "@/shared/types/project";

import { STAGE_PALETTE, stageColorIndex } from "../flow/stageColors";
import { flowEdgeStroke } from "../flow/types";
import type { CanvasViewMode } from "./useCanvasView";

import type {
  ConditionItem,
  EffectItem,
  NodeFormState,
} from "../flow/types";


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

// ============================================================
// 检视器（Inspector）的读侧与写侧
// ============================================================
//
// 这两半本来是散在 useProjectEditor 里的内联表达式。它们不碰 React 状态、
// 也不读图的内容，按宪章 G1 的两条判据（依赖方向 / 纯度）属于「先外提」的那一类：
// 外提之后可单测，且行为零变更。Inspector 是 narrativeData 与人眼之间唯一的
// 翻译层——空值到底给 ""、null 还是 []，决定的是「重新打开工程后字段有没有悄悄变」。

/** narrativeData 的 JSON 列可能是任何东西（含 null）：读侧一律给真实空值，不猜 */
export function inspectorFromNarrative(nd: Record<string, unknown> | null | undefined): {
  form: NodeFormState;
  conditions: ConditionItem[];
  effects: EffectItem[];
  nodeProps: string[];
  script: Instruction[];
} {
  const n = nd ?? {};
  const tc = n.trigger_condition as Record<string, unknown> | null;
  return {
    form: {
      title: (n.title as string) || "",
      description: (n.description as string) || "",
      is_anchor: Boolean(n.is_anchor),
      is_ending: Boolean(n.is_ending),
      ending_label: (n.ending_label as string) || "",
      speaker: (n.speaker as string) || "",
      dialogue: (n.dialogue as string) || "",
      narration: (n.narration as string) || "",
    },
    conditions: (tc?.conditions as ConditionItem[]) || [],
    effects: (n.effects as EffectItem[]) || [],
    nodeProps: (n.props as string[]) || [],
    script: ((n.script ?? []) as Instruction[]) || [],
  };
}

/**
 * 表单 → node.patch 载荷。`is_anchor` / `is_ending` 必须显式归一：
 * 未勾选的复选框在部分路径上给的是 undefined，直接进 patch 会留下 `undefined` 而不是 false，
 * 于是「取消勾选」在 JSON 列里等价于「从没勾过」——两者在导出与回放时可不等价。
 */
export function patchFromForm(nd: NodeFormState): Record<string, unknown> {
  return {
    ...nd,
    is_anchor: Boolean(nd.is_anchor),
    is_ending: Boolean(nd.is_ending),
  };
}

/** 空条件列表写 null 而不是 `{type:"all",conditions:[]}`：后者在两端编译器里都恒真，语义不同 */
export function conditionGroupFromItems(
  items: ConditionItem[],
): { type: "all"; conditions: ConditionItem[] } | null {
  return items.length > 0 ? { type: "all", conditions: items } : null;
}

/** React Flow 边 → 内核边（dispatch 载荷的窄形状） */
export function kernelEdgeFromRf(e: Edge): KernelEdge {
  return { id: e.id, source: e.source, target: e.target, label: (e.label as string) ?? null };
}

/** React Flow 节点 → 内核节点；sortOrder 由调用方给（原实现就地取 rfNodes.length） */
export function kernelNodeFromRf(n: Node, sortOrder: number): KernelNode {
  return {
    id: n.id,
    stageId: (n.data.stage_id as string) ?? null,
    position: n.position,
    narrative: n.data as Record<string, unknown>,
    sortOrder,
  };
}

/**
 * 内核节点 → editor-core 的画布快照（`projectAxsFromCanvas` 的入参形状）。
 * 与 `kernelNodeFromRf` 方向相反：那一条把画布节点折进内核，这一条把内核节点摊给投影器。
 * `stage_id` 只进 `data`（投影器据此排舞台），不写回内核节点本身。
 */
export function canvasSnapshotFromKernel(n: KernelNode): CanvasNodeSnapshot {
  return { id: n.id, position: n.position, data: { ...n.narrative, stage_id: n.stageId } };
}
