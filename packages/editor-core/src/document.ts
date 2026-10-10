/**
 * L2 文档模型：Draft 的创建与事务应用（KERNEL_DESIGN §2.1/2.2）。
 *
 * 不变量：
 *   I1 rev 随每次成功 apply 单调 +1
 *   I2 边的 source/target 必须引用存在节点（node.remove 级联删边）
 *   I3 script[] 元素均为合法 IR 指令（宽松校验：op 为已知字符串，与
 *      web sanitizeScript 语义对齐，保证行为等价）
 *   I4 apply 原子：要么整体成功返回新 Draft，要么拒绝——无半应用状态
 *   I5 确定性：同一起始 Draft + 同一事务序列（含注入的 idGen）必产出相同结果
 */

import type { Instruction } from "@axiforge/core";
import { importAxsDraft } from "./axsImport";
import type {
  ApplyError,
  ApplyResult,
  ChangedRef,
  Draft,
  Edge,
  Envelope,
  NarrativeData,
  NarrativeNode,
  NodeId,
  ProjectRole,
  Scene,
} from "./types";

export const INSTRUCTION_OPS: ReadonlySet<string> = new Set([
  "say",
  "narration",
  "show",
  "hide",
  "move",
  "bg",
  "bgm",
  "se",
  "voice",
  "camera",
  "transition",
  "fx",
  "wait",
  "choice",
]);

/** 与 web sanitizeScript 语义对齐的宽松校验（行为等价基线） */
export function isValidScript(v: unknown): v is Instruction[] {
  return (
    Array.isArray(v) &&
    v.every(
      (i) =>
        Boolean(i) &&
        typeof i === "object" &&
        typeof (i as { op?: unknown }).op === "string" &&
        INSTRUCTION_OPS.has((i as { op: string }).op),
    )
  );
}

export function emptyDraft(): Draft {
  return { rev: 0, nodes: new Map(), edges: [], roles: [], scenes: [] };
}

export interface NodeInput {
  id: NodeId;
  stageId?: string | null;
  position?: { x: number; y: number };
  narrative: NarrativeData;
  sortOrder?: number;
}

export function createDraft(input: {
  nodes?: NodeInput[];
  edges?: Edge[];
  roles?: ProjectRole[];
  scenes?: Scene[];
}): Draft {
  const nodes = new Map<NodeId, NarrativeNode>();
  for (const n of input.nodes ?? []) {
    nodes.set(n.id, {
      id: n.id,
      stageId: n.stageId ?? null,
      position: n.position ?? { x: 0, y: 0 },
      narrative: n.narrative,
      sortOrder: n.sortOrder ?? 0,
    });
  }
  return {
    rev: 0,
    nodes,
    edges: input.edges ?? [],
    roles: input.roles ?? [],
    scenes: input.scenes ?? [],
  };
}

function withNode(
  draft: Draft,
  nodeId: NodeId,
  narrative: NarrativeData,
): Draft {
  const nodes = new Map(draft.nodes);
  const prev = nodes.get(nodeId)!;
  nodes.set(nodeId, { ...prev, narrative });
  return { ...draft, rev: draft.rev + 1, nodes };
}

function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export type IdGen = () => string;

export function defaultIdGen(): string {
  return crypto.randomUUID();
}

/** 应用一个事务：唯一写入口。 */
export function apply(
  draft: Draft,
  envelope: Envelope,
  idGen: IdGen = defaultIdGen,
): ApplyResult {
  const { tx } = envelope;
  const fail = (error: ApplyError): ApplyResult => ({ ok: false, error });
  const done = (draft: Draft, changed: ChangedRef): ApplyResult => ({
    ok: true,
    draft,
    changed,
  });

  switch (tx.kind) {
    case "script.replace": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      if (!isValidScript(tx.script)) {
        return fail({
          code: "invalid_script",
          nodeId: tx.nodeId,
          detail: "script 含未知 op 或非对象元素",
        });
      }
      return done(withNode(draft, tx.nodeId, { ...node.narrative, script: tx.script }), {
        nodes: new Set([tx.nodeId]),
        edges: false,
        roles: false,
      });
    }

    case "script.reorder": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      const script = (node.narrative.script ?? []) as Instruction[];
      if (
        tx.from < 0 ||
        tx.to < 0 ||
        tx.from >= script.length ||
        tx.to >= script.length ||
        tx.from === tx.to
      ) {
        return fail({
          code: "index_out_of_range",
          nodeId: tx.nodeId,
          index: tx.from,
          length: script.length,
        });
      }
      return done(
        withNode(draft, tx.nodeId, {
          ...node.narrative,
          script: reorder(script, tx.from, tx.to),
        }),
        { nodes: new Set([tx.nodeId]), edges: false, roles: false },
      );
    }

    case "script.remove": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      const script = (node.narrative.script ?? []) as Instruction[];
      if (tx.index < 0 || tx.index >= script.length) {
        return fail({
          code: "index_out_of_range",
          nodeId: tx.nodeId,
          index: tx.index,
          length: script.length,
        });
      }
      const next = script.filter((_, i) => i !== tx.index);
      return done(withNode(draft, tx.nodeId, { ...node.narrative, script: next }), {
        nodes: new Set([tx.nodeId]),
        edges: false,
        roles: false,
      });
    }

    case "script.patch": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      const script = (node.narrative.script ?? []) as Instruction[];
      if (tx.index < 0 || tx.index >= script.length) {
        return fail({
          code: "index_out_of_range",
          nodeId: tx.nodeId,
          index: tx.index,
          length: script.length,
        });
      }
      const target = script[tx.index] as unknown as Record<string, unknown>;
      if (
        typeof tx.patch.op === "string" &&
        tx.patch.op !== target.op
      ) {
        return fail({ code: "op_conflict", nodeId: tx.nodeId, index: tx.index });
      }
      // op 保持不变 + 原 script 已通过 I3 校验 ⇒ 合并结果必然合法，无需复检
      const merged = { ...target, ...tx.patch };
      const next = script.map((s, i) =>
        i === tx.index ? (merged as unknown as Instruction) : s,
      );
      return done(withNode(draft, tx.nodeId, { ...node.narrative, script: next }), {
        nodes: new Set([tx.nodeId]),
        edges: false,
        roles: false,
      });
    }

    case "node.move": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      const nodes = new Map(draft.nodes);
      nodes.set(tx.nodeId, { ...node, position: tx.position });
      return done({ ...draft, rev: draft.rev + 1, nodes }, {
        nodes: new Set([tx.nodeId]),
        edges: false,
        roles: false,
      });
    }

    case "node.restage": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      const nodes = new Map(draft.nodes);
      nodes.set(tx.nodeId, { ...node, stageId: tx.stageId });
      return done({ ...draft, rev: draft.rev + 1, nodes }, {
        nodes: new Set([tx.nodeId]),
        edges: false,
        roles: false,
      });
    }

    case "node.add": {
      if (draft.nodes.has(tx.node.id)) {
        return fail({ code: "duplicate_node", nodeId: tx.node.id });
      }
      if (!isValidScript(tx.node.narrative.script ?? [])) {
        return fail({
          code: "invalid_script",
          nodeId: tx.node.id,
          detail: "node.add 的 script 含未知 op",
        });
      }
      const nodes = new Map(draft.nodes);
      nodes.set(tx.node.id, tx.node);
      return done({ ...draft, rev: draft.rev + 1, nodes }, {
        nodes: new Set([tx.node.id]),
        edges: false,
        roles: false,
      });
    }

    case "node.remove": {
      if (!draft.nodes.has(tx.nodeId)) {
        return fail({ code: "node_not_found", nodeId: tx.nodeId });
      }
      const nodes = new Map(draft.nodes);
      nodes.delete(tx.nodeId);
      // I2：级联移除悬空边
      const edges = draft.edges.filter(
        (e) => e.source !== tx.nodeId && e.target !== tx.nodeId,
      );
      return done({ ...draft, rev: draft.rev + 1, nodes, edges }, {
        nodes: new Set([tx.nodeId]),
        edges: true,
        roles: false,
      });
    }

    case "node.patch": {
      const node = draft.nodes.get(tx.nodeId);
      if (!node) return fail({ code: "node_not_found", nodeId: tx.nodeId });
      if (
        tx.patch.script !== undefined &&
        !isValidScript(tx.patch.script)
      ) {
        return fail({
          code: "invalid_script",
          nodeId: tx.nodeId,
          detail: "node.patch 的 script 含未知 op",
        });
      }
      return done(
        withNode(draft, tx.nodeId, { ...node.narrative, ...tx.patch }),
        { nodes: new Set([tx.nodeId]), edges: false, roles: false },
      );
    }

    case "edges.replaceAll": {
      for (const e of tx.edges) {
        const missing = !draft.nodes.has(e.source)
          ? e.source
          : !draft.nodes.has(e.target)
            ? e.target
            : null;
        if (missing) {
          return fail({ code: "edge_dangling", edgeId: e.id, missing });
        }
      }
      return done({ ...draft, rev: draft.rev + 1, edges: tx.edges }, {
        nodes: new Set(),
        edges: true,
        roles: false,
      });
    }

    case "role.add": {
      if (draft.roles.some((r) => r.characterRefId === tx.role.characterRefId)) {
        return fail({
          code: "duplicate_role",
          characterRefId: tx.role.characterRefId,
        });
      }
      return done({ ...draft, rev: draft.rev + 1, roles: [...draft.roles, tx.role] }, {
        nodes: new Set(),
        edges: false,
        roles: true,
      });
    }

    case "role.remove": {
      return done(
        {
          ...draft,
          rev: draft.rev + 1,
          roles: draft.roles.filter((r) => r.characterRefId !== tx.characterRefId),
        },
        { nodes: new Set(), edges: false, roles: true },
      );
    }

    case "axs.import": {
      const imported = importAxsDraft(draft, tx.source, tx.roles, idGen);
      if (!imported.ok) return fail(imported.error);
      return done(
        { ...draft, rev: draft.rev + 1, nodes: imported.nodes, edges: imported.edges },
        { nodes: new Set(imported.nodes.keys()), edges: true, roles: false },
      );
    }
  }
}
