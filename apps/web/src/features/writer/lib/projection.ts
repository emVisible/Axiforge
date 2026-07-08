import type { AxsBeat, AxsDocument, AxsEdge } from "@axiforge/axs";
import { parseAxs, printAxs } from "@axiforge/axs";
import type { Instruction } from "@axiforge/core";
import type { NarrativeSyncRequest } from "@/shared/api/editor";
import type {
  ProjectEdgeResponse,
  ProjectNodeResponse,
  ProjectSceneResponse,
} from "@/shared/types/project";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function stageTitle(
  stageId: string | null | undefined,
  scenes: ProjectSceneResponse[],
): string | null {
  if (!stageId) return null;
  const scene = scenes.find((s) => s.id === stageId);
  return scene?.title ?? null;
}

function stageIdByTitle(
  title: string | null | undefined,
  scenes: ProjectSceneResponse[],
): string | null {
  if (!title) return null;
  const scene = scenes.find((s) => s.title === title);
  return scene?.id ?? null;
}

function nodeToBeat(
  node: ProjectNodeResponse,
  scenes: ProjectSceneResponse[],
): AxsBeat {
  const nd = node.narrative_data || {};
  const script = (nd.script as Instruction[] | undefined) ?? [];
  const hasScript = script.length > 0;

  const beatScript: Instruction[] = hasScript
    ? [...script]
    : buildScriptFromLegacy(nd);

  return {
    id: String(node.id),
    title: (nd.title as string) || "未命名",
    line: 1,
    stage: stageTitle(node.stage_id ?? node.scene_id, scenes),
    key: (nd.key as string) || null,
    isEnding: Boolean(nd.is_ending),
    endingLabel: (nd.ending_label as string) || null,
    trigger: (nd.trigger_condition as AxsBeat["trigger"]) ?? null,
    script: beatScript,
    effects: (nd.effects as AxsBeat["effects"]) ?? [],
  };
}

function buildScriptFromLegacy(nd: Record<string, unknown>): Instruction[] {
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
  const choices = nd.choices as { label: string; target_node_id?: string | null }[] | undefined;
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

/** 节点图 → AXS 源文本 */
export function projectToAxs(
  nodes: ProjectNodeResponse[],
  edges: ProjectEdgeResponse[],
  scenes: ProjectSceneResponse[],
  roles: Record<string, string>,
): string {
  if (!nodes.length) {
    return `# 开始\n旁白：故事从这里开始。\n`;
  }

  const nodeOrder = topologicalNodeOrder(nodes, edges);
  const beats = nodeOrder.map((n) => nodeToBeat(n, scenes));

  const axsEdges: AxsEdge[] = edges
    .filter(
      (e) =>
        nodeOrder.some((n) => n.id === e.source_node_id) &&
        nodeOrder.some((n) => n.id === e.target_node_id),
    )
    .map((e) => ({
      from: String(e.source_node_id),
      to: String(e.target_node_id),
      label: e.label || null,
    }));

  const doc: AxsDocument = { beats, edges: axsEdges, diagnostics: [] };
  return printAxs(doc, { roles });
}

function topologicalNodeOrder(
  nodes: ProjectNodeResponse[],
  edges: ProjectEdgeResponse[],
): ProjectNodeResponse[] {
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const incoming = new Map<string, number>();
  for (const n of nodes) incoming.set(String(n.id), 0);
  for (const e of edges) {
    const t = String(e.target_node_id);
    if (byId.has(t)) incoming.set(t, (incoming.get(t) ?? 0) + 1);
  }
  const anchors = nodes.filter((n) => n.narrative_data?.is_anchor);
  const queue: ProjectNodeResponse[] = [
    ...(anchors.length ? anchors : []),
    ...nodes.filter((n) => (incoming.get(String(n.id)) ?? 0) === 0 && !anchors.includes(n)),
  ];
  const seen = new Set<string>();
  const ordered: ProjectNodeResponse[] = [];
  const outEdges = new Map<string, string[]>();
  for (const e of edges) {
    const s = String(e.source_node_id);
    const list = outEdges.get(s) ?? [];
    list.push(String(e.target_node_id));
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

function beatToNarrative(beat: AxsBeat): Record<string, unknown> {
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

function resolveNodeId(
  beat: AxsBeat,
  existingByTitle: Map<string, string>,
): string | undefined {
  if (UUID_RE.test(beat.id)) return beat.id;
  const byTitle = existingByTitle.get(beat.title);
  if (byTitle) return byTitle;
  return undefined;
}

/** AXS 源文本 → 同步载荷 */
export function axsToSyncPayload(
  source: string,
  roles: Record<string, string>,
  scenes: ProjectSceneResponse[],
  existingNodes: ProjectNodeResponse[],
): NarrativeSyncRequest {
  const doc = parseAxs(source, { roles });
  const existingByTitle = new Map(
    existingNodes.map((n) => [(n.narrative_data?.title as string) || "", String(n.id)]),
  );
  const beatIdToNodeId = new Map<string, string>();

  const nodes = doc.beats.map((beat, idx) => {
    const resolvedId = resolveNodeId(beat, existingByTitle) ?? crypto.randomUUID();
    beatIdToNodeId.set(beat.id, resolvedId);
    return {
      id: resolvedId,
      stage_id: stageIdByTitle(beat.stage, scenes),
      editor_data: { position: { x: 120 + (idx % 4) * 220, y: 80 + Math.floor(idx / 4) * 140 } },
      narrative_data: beatToNarrative(beat),
      sort_order: idx,
    };
  });

  const edges = doc.edges.map((e) => ({
    source_node_id: beatIdToNodeId.get(e.from) ?? e.from,
    target_node_id: beatIdToNodeId.get(e.to) ?? e.to,
    source_port: "output",
    label: e.label || null,
  }));

  return { axs_source: source, nodes, edges };
}

/** 节点 ID / 标题 → AXS 标题行号 */
export function beatLineForNode(
  source: string,
  roles: Record<string, string>,
  nodeId: string,
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

export { parseAxs };
