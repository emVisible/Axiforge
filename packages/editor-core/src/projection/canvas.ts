/**
 * L3 画布快照合并（自 web projection.ts 语义平移）。
 * MergeableNode 以结构化窄接口承接传输态 DTO（ProjectNodeResponse 结构性满足）。
 */

import type { AxsDiagnostic } from "@axiforge/axs";
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

/**
 * 把画布快照并回传输态节点。
 *
 * **2026-10-01 复审改掉一处静默丢字段**：原实现把 `narrative_data` / `editor_data`
 * 整个**按白名单重建**（13 个已知键 + `position`），于是
 * ① `NarrativeData.choices`（legacy 分支组，`projection/axs.ts::buildScriptFromLegacy` 的唯一输入）
 * ② `narrative_data` 里任何白名单外的键（类型带 `[key: string]: unknown`，本就是开放的）
 * ③ `editor_data` 里除 `position` 外的键
 * 在画布碰过这个节点之后**全部消失，且零诊断**。
 *
 * 生产可达链（实测）：`useProjectEditor.openWriterAtSelection`（"在 Writer 中打开"）
 * → `projectAxsFromCanvas` → 本函数 → `setAxsSource(projected)`，
 * 于是 Writer 面板当场拿到的是丢过字段的文本，随后保存即落盘。
 * 实测读数：同一个 legacy 节点（两个选项）走 `draftToAxs` 直连时两个选项都在，
 * 走 `projectAxsFromCanvas` 时两个都不在、只剩一个光标题——**责任在本函数，不在 `buildScriptFromLegacy`**。
 *
 * 改法：**以持久态为底**，再把已知键按原归一化覆盖上去。
 * 不把画布 `data` 整体铺开——生产里 `data = {...narrative, stage_id}`，
 * 铺开会把 `stage_id` 漏进 `narrative_data`；而画布上 UI 私有的键本来就不该进持久态。
 */
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
    // 保留 base 里除 position 以外的键（原来只剩 position）
    editor_data: { ...(base?.editor_data ?? {}), position: node.position },
    narrative_data: {
      // 以 base 的持久态为底 ⇒ 白名单外的键不再被静默丢弃（`choices` 就在这一格里）
      ...(base?.narrative_data ?? {}),
      // 以下是原有的逐键归一化，语义与改前逐字一致，只是从"重建"变成"覆盖"
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

/**
 * 从画布状态生成 AXS 文本（未保存的剪辑/结构编辑即时预览，ADR-022）。
 *
 * `diagnostics` 是**可选出参**，语义与 `draftToAxs` 的那一个相同：文本输出与之前逐字相同，
 * 只把"这一拍有第二组分支，印出来的文本里读不回来"登记下来。这一趟特别需要它，因为
 * 调用方（`openWriterAtSelection`）把返回值**直接放进用户正在看的编辑框**——屏幕上显示的就是
 * 这次投影的结果，丢失在这里不发生一次比在装载或保存时更没处说。
 */
export function projectAxsFromCanvas(
  canvasNodes: CanvasNodeSnapshot[],
  canvasEdges: CanvasEdgeSnapshot[],
  allNodes: readonly MergeableNode[],
  projectEdges: readonly Edge[],
  scenes: Draft["scenes"],
  roles: Record<string, string>,
  options?: { scopeStageId?: string | null },
  diagnostics?: AxsDiagnostic[],
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
  return draftToAxs(draft, roles, diagnostics);
}
