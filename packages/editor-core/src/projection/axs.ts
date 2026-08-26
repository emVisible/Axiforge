/**
 * L3 投影：Draft ⇄ AXS（KERNEL_DESIGN §2.4）。
 * 自 apps/web/src/features/writer/lib/projection.ts 语义平移；
 * 全部纯函数：无副作用、不读时钟、不触网（不变量 I8）。
 */

import type { AxsBeat, AxsDocument, AxsEdge } from "@axiforge/axs";
import { parseAxs, printAxs } from "@axiforge/axs";
import type { Instruction } from "@axiforge/core";
import type { Draft, Edge, NarrativeData, NarrativeNode, NodeId } from "../types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stageTitle(
  stageId: string | null | undefined,
  scenes: Draft["scenes"],
): string | null {
  if (!stageId) return null;
  return scenes.find((s) => s.id === stageId)?.title ?? null;
}

function nodeToBeat(
  node: NarrativeNode,
  scenes: Draft["scenes"],
): AxsBeat {
  const nd = node.narrative;
  const script = (nd.script as Instruction[] | undefined) ?? [];
  const hasScript = script.length > 0;

  return {
    id: String(node.id),
    title: (nd.title as string) || "未命名",
    line: 1,
    stage: stageTitle(node.stageId, scenes),
    key: (nd.key as string) || null,
    isEnding: Boolean(nd.is_ending),
    endingLabel: (nd.ending_label as string) || null,
    trigger: (nd.trigger_condition as AxsBeat["trigger"]) ?? null,
    script: hasScript ? [...script] : buildScriptFromLegacy(nd),
    effects: (nd.effects as AxsBeat["effects"]) ?? [],
  };
}

function buildScriptFromLegacy(nd: NarrativeData): Instruction[] {
  const out: Instruction[] = [];
  if (nd.narration) {
    out.push({ op: "narration", text: String(nd.narration) });
  }
  if (nd.dialogue) {
    out.push({
      op: "say",
      speaker: (nd.speaker as string) || undefined,
      text: String(nd.dialogue),
    });
  }
  const choices = nd.choices as
    | { label: string; target_node_id?: string | null }[]
    | undefined;
  if (choices?.length) {
    out.push({
      op: "choice",
      options: choices.map((c) => ({
        label: c.label,
        to: c.target_node_id ? undefined : null,
      })),
    });
  }
  return out;
}

/** 拓扑排序：锚点优先，其次零入度，BFS 沿出边；不可达节点按原序兜底。 */
export function topologicalOrder(
  nodes: readonly NarrativeNode[],
  edges: readonly Edge[],
): NarrativeNode[] {
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const incoming = new Map<string, number>();
  for (const n of nodes) incoming.set(String(n.id), 0);
  for (const e of edges) {
    const t = String(e.target);
    if (byId.has(t)) incoming.set(t, (incoming.get(t) ?? 0) + 1);
  }
  const anchors = nodes.filter((n) => n.narrative.is_anchor);
  const queue: NarrativeNode[] = [
    ...anchors,
    ...nodes.filter(
      (n) => (incoming.get(String(n.id)) ?? 0) === 0 && !anchors.includes(n),
    ),
  ];
  const seen = new Set<string>();
  const ordered: NarrativeNode[] = [];
  const outEdges = new Map<string, string[]>();
  for (const e of edges) {
    const s = String(e.source);
    const list = outEdges.get(s) ?? [];
    list.push(String(e.target));
    outEdges.set(s, list);
  }
  while (queue.length) {
    const n = queue.shift()!;
    const id = String(n.id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(n);
    for (const tgt of outEdges.get(id) ?? []) {
      const child = byId.get(tgt);
      if (child && !seen.has(tgt)) queue.push(child);
    }
  }
  for (const n of nodes) {
    if (!seen.has(String(n.id))) ordered.push(n);
  }
  return ordered;
}

/** Draft → AXS 源文本（roles：显示名 → characterRefId，用于反解说话人）。 */
export function draftToAxs(
  draft: Draft,
  roles: Record<string, string>,
): string {
  if (draft.nodes.size === 0) {
    return `# 开始\n旁白：故事从这里开始。\n`;
  }
  const nodes = [...draft.nodes.values()];
  const nodeOrder = topologicalOrder(nodes, draft.edges);
  const beats = nodeOrder.map((n) => nodeToBeat(n, draft.scenes));

  const axsEdges: AxsEdge[] = draft.edges
    .filter(
      (e) =>
        nodeOrder.some((n) => String(n.id) === String(e.source)) &&
        nodeOrder.some((n) => String(n.id) === String(e.target)),
    )
    .map((e) => ({
      from: String(e.source),
      to: String(e.target),
      label: e.label || null,
    }));

  const doc: AxsDocument = { beats, edges: axsEdges, diagnostics: [] };
  return printAxs(doc, { roles });
}

/** AXS Beat → 域 NarrativeData（is_anchor 规则与既有行为一致） */
export function beatToNarrativeData(beat: AxsBeat): NarrativeData {
  return {
    title: beat.title,
    key: beat.key ?? undefined,
    is_anchor: beat.key === "intro" || beat.title === "开始",
    is_ending: beat.isEnding ?? false,
    ending_label: beat.endingLabel ?? null,
    trigger_condition: beat.trigger ?? null,
    script: beat.script,
    effects: beat.effects ?? [],
  };
}

export interface AxsPlan {
  nodes: NarrativeNode[];
  edges: Edge[];
  beatIdToNodeId: Map<string, NodeId>;
}

/**
 * AXS 文本 → 物化计划（节点/边的域形态）。
 * id 解析：UUID beat.id 直接复用；否则按既有标题匹配；再否则 idGen() 新建。
 * 确定性（I5）：idGen 可注入。
 */
export function parseAxsToPlan(
  source: string,
  roles: Record<string, string>,
  existing: readonly { id: NodeId; title?: string }[],
  scenes: Draft["scenes"],
  idGen: () => string,
): AxsPlan {
  const doc = parseAxs(source, { roles });
  const existingByTitle = new Map(
    existing.map((n) => [n.title ?? "", String(n.id)]),
  );
  const beatIdToNodeId = new Map<string, NodeId>();
  const nodes: NarrativeNode[] = [];

  doc.beats.forEach((beat, idx) => {
    const resolvedId =
      (UUID_RE.test(beat.id) ? beat.id : undefined) ??
      existingByTitle.get(beat.title) ??
      idGen();
    beatIdToNodeId.set(beat.id, resolvedId);
    nodes.push({
      id: resolvedId,
      stageId: beat.stage
        ? (scenes.find((s) => s.title === beat.stage)?.id ?? null)
        : null,
      position: { x: 120 + (idx % 4) * 220, y: 80 + Math.floor(idx / 4) * 140 },
      narrative: beatToNarrativeData(beat),
      sortOrder: idx,
    });
  });

  const edges: Edge[] = doc.edges.map((e) => ({
    id: `${e.from}-${e.to}`,
    source: beatIdToNodeId.get(e.from)!,
    target: beatIdToNodeId.get(e.to)!,
    label: e.label ?? null,
  }));

  return { nodes, edges, beatIdToNodeId };
}

/** 节点 ID / 标题 → AXS 标题行号（锚点 v0，ADR-025 将升级为指令级）。 */
export function beatLineForNode(
  source: string,
  roles: Record<string, string>,
  nodeId: NodeId,
  nodeTitle?: string,
): number | null {
  const doc = parseAxs(source, { roles });
  const byId = doc.beats.find((b) => b.id === nodeId);
  if (byId) return byId.line;
  if (nodeTitle) {
    const byTitle = doc.beats.find((b) => b.title === nodeTitle);
    if (byTitle) return byTitle.line;
  }
  return null;
}
