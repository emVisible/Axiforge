/**
 * L3 投影：Draft ⇄ AXS（KERNEL_DESIGN §2.4）。
 * 自 apps/web/src/features/writer/lib/projection.ts 语义平移；
 * 全部纯函数：无副作用、不读时钟、不触网（不变量 I8）。
 */

import type { AxsBeat, AxsDiagnostic, AxsDocument, AxsEdge } from "@axiforge/axs";
import { parseAxs, printAxs } from "@axiforge/axs";
import type { Instruction } from "@axiforge/core";
import type { Draft, Edge, NarrativeData, NarrativeNode, NodeId } from "../types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 「什么样的 beat.id 算既有节点身份」的唯一判据（2026-10-01 归一）。
 * 此前 `axsImport.ts` 里的 `NODE_ID_RE` 与本行的 `UUID_RE` 是同一串字面量抄两遍——
 * 只放宽一边，另一条通路的 id 契约就悄悄换了口径，而两条通路守的是同一条 I5 确定性。
 */
export function isReusableNodeId(id: string): boolean {
  return UUID_RE.test(id);
}

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
        to: c.target_node_id ?? null,
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

/**
 * Draft → AXS 源文本（roles：显示名 → characterRefId，用于反解说话人）。
 *
 * 第三个参数是**可选出参**：发射侧的告警（例如"这一拍有第二组分支，印出来的文本里读不回来"）。
 * 之所以要它：Writer 主通路是把节点图投影成 `axs_source` 并**在保存时写回去**，
 * 丢了东西却无人说一声，就是把丢失固化进存档。文本输出与之前逐字相同。
 */
export function draftToAxs(
  draft: Draft,
  roles: Record<string, string>,
  diagnostics?: AxsDiagnostic[],
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
  return printAxs(doc, { roles, diagnostics });
}

/**
 * 新建节点的网格落位：每行 4 个，横向 220、纵向 140。
 * **这是唯一一份**（2026-10-01 归一）：`axs.import` 与 Writer 保存的 `parseAxsToPlan` 此前各写了一遍同样的公式，
 * 而它决定的是"用户打开画布时节点长在哪"——两半各抄一份时，改一处只会让两条通路摆出不同的图。
 */
export function gridPosition(index: number): { x: number; y: number } {
  return { x: 120 + (index % 4) * 220, y: 80 + Math.floor(index / 4) * 140 };
}

/** AXS Beat → 域 NarrativeData（**两处映射归一后的唯一权威**；is_anchor 规则见 ADR-016 的 `[key]` 语义） */
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
  // 标题索引取**第一个**同名既有节点（与 importAxsDraft 同策略，2026-10-01 归一）：
  // `new Map(existing.map(...))` 是"最后一个赢"，于是同一份源文本在草稿事务里改 A、在 Writer 保存里改 Z。
  const existingByTitle = new Map<string, string>();
  for (const n of existing) {
    const title = n.title ?? "";
    if (title && !existingByTitle.has(title)) existingByTitle.set(title, String(n.id));
  }
  const beatIdToNodeId = new Map<string, NodeId>();
  const nodes: NarrativeNode[] = [];
  const usedNodeIds = new Set<NodeId>();

  doc.beats.forEach((beat, idx) => {
    const candidate =
      (isReusableNodeId(beat.id) ? beat.id : undefined) ??
      existingByTitle.get(beat.title);
    // 一次同步里一个节点 id 只许被消费一次（与 axs.import 走同一条契约）：
    // 两个同名 Beat 若都复用同一个既有 id，载荷里就会出现两个同 id 节点，存储侧后写悄悄盖掉前写。
    const resolvedId =
      candidate && !usedNodeIds.has(candidate) ? candidate : idGen();
    usedNodeIds.add(resolvedId);
    beatIdToNodeId.set(beat.id, resolvedId);
    nodes.push({
      id: resolvedId,
      stageId: beat.stage
        ? (scenes.find((s) => s.title === beat.stage)?.id ?? null)
        : null,
      position: gridPosition(idx),
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

/** 节点 ID / 标题 → AXS 标题行号。 */
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

/**
 * 节点 + 指令下标 → AXS 源行号（指令级锚点，ADR-025）。
 * 若 lineMap 不可用则回退到 beat 标题行号。
 */
export function instructionLineForNode(
  source: string,
  roles: Record<string, string>,
  nodeId: NodeId,
  instructionIndex: number,
  nodeTitle?: string,
): number | null {
  const doc = parseAxs(source, { roles });
  const beat =
    doc.beats.find((b) => b.id === nodeId) ??
    (nodeTitle ? doc.beats.find((b) => b.title === nodeTitle) : null);
  if (!beat) return null;
  if (beat.lineMap && instructionIndex >= 0 && instructionIndex < beat.lineMap.length) {
    return beat.lineMap[instructionIndex] ?? beat.line;
  }
  return beat.line;
}
