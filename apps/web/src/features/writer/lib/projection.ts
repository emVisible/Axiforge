/**
 * Web 适配层（L5）：editor-core 投影的传输态 DTO 包装。
 *
 * Phase 1b 绞杀者迁移：实现已迁至 @axiforge/editor-core（L2/L3，KERNEL_DESIGN §2.4）；
 * 本文件只剩 DTO ⇄ 域类型转换与 web 特有形状（ProjectNodeResponse 等）。
 * apps/web 的 18 例行为基线钉住本文件公共签名，迁移期不得变更语义。
 */

import type { AxsBeat, AxsDiagnostic } from "@axiforge/axs";
import { parseAxs } from "@axiforge/axs";
import type { Draft, Edge, NarrativeData, NarrativeNode } from "@axiforge/editor-core";
import {
  beatLineForNode as coreBeatLineForNode,
  mergeCanvasIntoNodes,
  parseAxsToPlan,
  projectAxsFromCanvas as coreProjectAxsFromCanvas,
} from "@axiforge/editor-core";
import type { NarrativeSyncRequest } from "@/shared/api/editor";
import type {
  ProjectEdgeResponse,
  ProjectNodeResponse,
  ProjectSceneResponse,
} from "@/shared/types/project";
import { draftToAxs } from "@axiforge/editor-core";

export type { CanvasEdgeSnapshot, CanvasNodeSnapshot } from "@axiforge/editor-core";
import type { CanvasEdgeSnapshot, CanvasNodeSnapshot } from "@axiforge/editor-core";

// ---------------------------------------------------------------------------
// DTO → 域类型转换
// ---------------------------------------------------------------------------

function toDraftNode(n: ProjectNodeResponse): NarrativeNode {
  return {
    id: String(n.id),
    stageId: n.stage_id ?? n.scene_id ?? null,
    position:
      (n.editor_data?.position as { x: number; y: number }) ?? { x: 0, y: 0 },
    narrative: (n.narrative_data ?? {}) as NarrativeData,
    sortOrder: n.sort_order ?? 0,
  };
}

function toEdge(e: ProjectEdgeResponse): Edge {
  return {
    id: e.id,
    source: String(e.source_node_id),
    target: String(e.target_node_id),
    label: e.label,
  };
}

export function draftFromProject(
  nodes: ProjectNodeResponse[],
  edges: ProjectEdgeResponse[],
  scenes: ProjectSceneResponse[],
): Draft {
  return {
    rev: 0,
    nodes: new Map(nodes.map((n) => [String(n.id), toDraftNode(n)])),
    edges: edges.map(toEdge),
    roles: [],
    scenes: scenes.map((s) => ({ id: s.id, title: s.title })),
  };
}

/** 收集项目全部节点（优先 project.nodes，回退 scene.nodes） */
export function collectProjectNodes(
  projectNodes: ProjectNodeResponse[] | undefined,
  scenes: ProjectSceneResponse[],
): ProjectNodeResponse[] {
  if (projectNodes?.length) return projectNodes;
  const fromScenes: ProjectNodeResponse[] = [];
  for (const scene of scenes) {
    for (const node of scene.nodes || []) {
      fromScenes.push(node);
    }
  }
  return fromScenes;
}

/** 节点图 → AXS 源文本（委托 editor-core） */
export function projectToAxs(
  nodes: ProjectNodeResponse[],
  edges: ProjectEdgeResponse[],
  scenes: ProjectSceneResponse[],
  roles: Record<string, string>,
  diagnostics?: AxsDiagnostic[],
): string {
  if (!nodes.length) {
    return `# 开始\n旁白：故事从这里开始。\n`;
  }
  return draftToAxs(draftFromProject(nodes, edges, scenes), roles, diagnostics);
}

/**
 * 装载路径专用：一次投影同时给出文本和那条「读不回来」的常驻说明。
 *
 * 告警只在**屏幕上显示的就是这次投影的结果**时才对用户成立：存档里没有文本，或存档文本
 * 与投影逐字节相同（那它就是上一次投影写回去的）。存档里躺着 Writer 手写文本时报「投影会丢」
 * 是误导——用户看到的并不是投影。
 */
export function projectWithNotice(
  nodes: ProjectNodeResponse[],
  edges: ProjectEdgeResponse[],
  scenes: ProjectSceneResponse[],
  roles: Record<string, string>,
  storedSource: string | null | undefined,
): { text: string; notice: string | null } {
  const warns: AxsDiagnostic[] = [];
  const text = projectToAxs(nodes, edges, scenes, roles, warns);
  const showsProjection = !storedSource || storedSource === text;
  return { text, notice: showsProjection ? noticeFor(warns) : null };
}

/**
 * 发射侧告警 → 那条常驻说明。
 *
 * 发射器**逐拍**报（一条消息里写着「第「X」拍有 N 组分支」），而界面上只有一条横幅：
 * 只印 `warns[0]` 就等于把"这次投影丢了几处"吞掉——用户读到第一拍的例子，其余几拍无声消失，
 * 那正是本家族要修的「静默」本身。多条时把总数说出来，第一条的原文照旧保留。
 */
export function noticeFor(warns: AxsDiagnostic[]): string | null {
  if (!warns.length) return null;
  const first = warns[0]!.message;
  return warns.length === 1
    ? first
    : `${first}（这次投影共有 ${warns.length} 处读不回来的丢失）`;
}

/** AXS 源文本 → 同步载荷（委托 editor-core 的物化计划，映射为传输 DTO） */
export function axsToSyncPayload(
  source: string,
  roles: Record<string, string>,
  scenes: ProjectSceneResponse[],
  existingNodes: ProjectNodeResponse[],
): NarrativeSyncRequest {
  const plan = parseAxsToPlan(
    source,
    roles,
    existingNodes.map((n) => ({
      id: String(n.id),
      title: (n.narrative_data?.title as string) || "",
    })),
    scenes.map((s) => ({ id: s.id, title: s.title })),
    () => crypto.randomUUID(),
  );

  const nodes = plan.nodes.map((n) => ({
    id: n.id,
    stage_id: n.stageId,
    editor_data: { position: n.position },
    narrative_data: n.narrative,
    sort_order: n.sortOrder,
  }));

  const edges = plan.edges.map((e) => ({
    source_node_id: e.source,
    target_node_id: e.target,
    source_port: "output",
    label: e.label ?? null,
  }));

  return { axs_source: source, nodes, edges };
}

/** 节点 ID / 标题 → AXS 标题行号（委托 editor-core） */
export function beatLineForNode(
  source: string,
  roles: Record<string, string>,
  nodeId: string,
  nodeTitle?: string,
): number | null {
  return coreBeatLineForNode(source, roles, nodeId, nodeTitle);
}

/** Beat → 项目节点 ID（优先 UUID beat.id，否则按标题匹配） */
export function nodeIdForBeat(
  beat: { id: string; title: string },
  existingNodes: ProjectNodeResponse[],
): string | null {
  if (UUID_RE.test(beat.id)) return beat.id;
  const node = existingNodes.find(
    (n) => ((n.narrative_data?.title as string) || "") === beat.title,
  );
  return node ? String(node.id) : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export { parseAxs };
export type { AxsBeat };

// ---------------------------------------------------------------------------
// 画布合并（委托 editor-core；DTO 生命周期字段经结构兼容透传）
// ---------------------------------------------------------------------------

/** 将画布节点合并进项目节点列表（单舞台模式会剔除该舞台已删节点）。 */
export function mergeCanvasIntoProjectNodes(
  canvasNodes: CanvasNodeSnapshot[],
  allNodes: ProjectNodeResponse[],
  options?: { scopeStageId?: string | null },
): ProjectNodeResponse[] {
  return mergeCanvasIntoNodes(canvasNodes, allNodes, options) as ProjectNodeResponse[];
}

export function canvasEdgesForProjection(
  canvasEdges: CanvasEdgeSnapshot[],
  projectEdges: ProjectEdgeResponse[],
  scopeNodeIds: Set<string> | null,
): ProjectEdgeResponse[] {
  if (!scopeNodeIds) {
    return canvasEdges.map(canvasEdgeToProjectEdge);
  }
  const preserved = projectEdges.filter((e) => {
    const src = String(e.source_node_id);
    const tgt = String(e.target_node_id);
    return !(scopeNodeIds.has(src) && scopeNodeIds.has(tgt));
  });
  return [...preserved, ...canvasEdges.map(canvasEdgeToProjectEdge)];
}

function canvasEdgeToProjectEdge(e: CanvasEdgeSnapshot): ProjectEdgeResponse {
  return {
    id: `${e.source}-${e.target}`,
    project_id: "",
    source_node_id: e.source,
    target_node_id: e.target,
    source_port: "output",
    label: e.label ?? null,
    condition: null,
    created_at: "",
  };
}

/**
 * 从当前画布状态生成 AXS 文本（未保存的剪辑/结构编辑也可预览到剧本轨）。
 * `diagnostics` 是可选出参，语义与 `projectToAxs` 的那一个相同；这一趟的返回值会被
 * `openWriterAtSelection` **直接写进用户正在看的编辑框**，所以丢失只能在这里说。
 */
export function projectAxsFromCanvas(
  canvasNodes: CanvasNodeSnapshot[],
  canvasEdges: CanvasEdgeSnapshot[],
  allNodes: ProjectNodeResponse[],
  projectEdges: ProjectEdgeResponse[],
  scenes: ProjectSceneResponse[],
  roles: Record<string, string>,
  options?: { scopeStageId?: string | null },
  diagnostics?: AxsDiagnostic[],
): string {
  return coreProjectAxsFromCanvas(
    canvasNodes,
    canvasEdges,
    allNodes,
    projectEdges.map(toEdge),
    scenes.map((s) => ({ id: s.id, title: s.title })),
    roles,
    options,
    diagnostics,
  );
}
