/**
 * `axs.import` 事务的实现：一段 AXS 文本 → 完整的节点图与边。
 * 从 L2 文档模型那一版里外提（G1 行数棘轮给的处置是「按域外提成协作模块」，不在原文件里继续堆）。
 * 依赖方向：本模块只依赖 ./types、./projection/axs 与 @axiforge/axs，**不回头依赖 L2 文档模型**，否则 check:circular 会亮。
 */
import { parseAxs } from "@axiforge/axs";
import type {
  ApplyError,
  Draft,
  Edge,
  NarrativeNode,
  NodeId,
} from "./types";
/**
 * `AXS 文本 → 节点图`的两条通路共用同一份映射、落位与「可复用 id」判据：
 * 唯一权威在 ./projection/axs（2026-10-01 归一，此前两处各抄一遍）。
 */
import { beatToNarrativeData, gridPosition, isReusableNodeId } from "./projection/axs";

export type AxsImportResult =
  | { ok: true; nodes: Map<NodeId, NarrativeNode>; edges: Edge[] }
  | { ok: false; error: ApplyError };

/**
 * 整体覆写语义：Beat 带节点 id 时沿用，其次按标题复用既有节点身份（Writer 轨重复保存不换 id），
 * 都没有才 `idGen()` 新建。**一个 id 在一次导入里只许被消费一次**——
 * 否则同名 Beat（解析后 id 为 `开场` / `开场-2`）会都落到同一个既有节点上，后写的把先写的覆盖掉。
 */
export function importAxsDraft(
  draft: Draft,
  source: string,
  roles: Record<string, string>,
  idGen: () => string,
): AxsImportResult {
  let doc;
  try {
    doc = parseAxs(source, { roles });
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "parse_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }
  const titleToId = new Map<string, NodeId>();
  for (const n of draft.nodes.values()) {
    const t = n.narrative.title;
    if (t && !titleToId.has(t)) titleToId.set(t, n.id);
  }
  const nodes = new Map<NodeId, NarrativeNode>();
  const beatIdToNodeId = new Map<string, NodeId>();
  const usedNodeIds = new Set<NodeId>();
  doc.beats.forEach((beat, idx) => {
    const candidate =
      (isReusableNodeId(beat.id) ? beat.id : undefined) ?? titleToId.get(beat.title);
    const resolved =
      candidate && !usedNodeIds.has(candidate) ? candidate : idGen();
    usedNodeIds.add(resolved);
    beatIdToNodeId.set(beat.id, resolved);
    const stage = beat.stage
      ? (draft.scenes.find((s) => s.title === beat.stage)?.id ?? null)
      : null;
    nodes.set(resolved, {
      id: resolved,
      stageId: stage,
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
  return { ok: true, nodes, edges };
}
