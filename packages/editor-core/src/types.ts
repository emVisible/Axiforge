/**
 * editor-core L2 文档模型类型（KERNEL_DESIGN.md §2）
 *
 * 依赖方向铁律：本包只依赖 @axiforge/core（L0）与 @axiforge/axs（L1），
 * 禁止 import react / react-dom / DOM API / 网络库（CI 断言）。
 */

import type { Condition, Effect, Instruction } from "@axiforge/core";

export type NodeId = string;

/** 事务来源轨（ADR-025「最后编辑者权威」的记序依据） */
export type Origin = "cut" | "writer" | "flow" | "system";

// ------------------------------------------------------------
// 文档域类型（使用态；与传输态 DTO 解耦，axiom 第三部 1.1）
// ------------------------------------------------------------

/** 节点叙事数据（域形态）。script 为 IR 指令序列。 */
export interface NarrativeData {
  title?: string;
  description?: string;
  is_anchor?: boolean;
  is_ending?: boolean;
  ending_label?: string | null;
  speaker?: string | null;
  dialogue?: string | null;
  narration?: string | null;
  trigger_condition?: Condition | null;
  effects?: Effect[];
  choices?: { label: string; target_node_id?: string | null }[];
  [key: string]: unknown;
}

export interface NarrativeNode {
  readonly id: NodeId;
  readonly stageId: string | null;
  readonly position: { x: number; y: number };
  readonly narrative: Readonly<NarrativeData>;
  /** 编辑器排序（后端 sort_order 的域形态） */
  readonly sortOrder: number;
}

export interface Edge {
  readonly id: string;
  readonly source: NodeId;
  readonly target: NodeId;
  readonly label?: string | null;
}

export interface ProjectRole {
  /** project_roles 行 id（移除时定位用） */
  readonly id: string;
  readonly characterRefId: string;
  /** 显示名（来自角色库；可能延迟填充） */
  readonly name?: string | null;
}

export interface Scene {
  readonly id: string;
  readonly title: string;
}

/**
 * 编辑器世界的全部状态。值语义：永不原地修改（不变量 I1–I3）。
 */
export interface Draft {
  readonly rev: number;
  readonly nodes: ReadonlyMap<NodeId, NarrativeNode>;
  readonly edges: readonly Edge[];
  readonly roles: readonly ProjectRole[];
  readonly scenes: readonly Scene[];
}

// ------------------------------------------------------------
// 事务（唯一写入口，KERNEL_DESIGN §2.2）
// ------------------------------------------------------------

export type Transaction =
  | { kind: "script.replace"; nodeId: NodeId; script: Instruction[] }
  | { kind: "script.reorder"; nodeId: NodeId; from: number; to: number }
  | { kind: "script.remove"; nodeId: NodeId; index: number }
  | {
      kind: "script.patch";
      nodeId: NodeId;
      index: number;
      /** 与既有指令合并；携带 op 时必须与原 op 一致 */
      patch: Record<string, unknown>;
    }
  | { kind: "node.add"; node: NarrativeNode }
  | { kind: "node.move"; nodeId: NodeId; position: { x: number; y: number } }
  | { kind: "node.remove"; nodeId: NodeId }
  | { kind: "node.patch"; nodeId: NodeId; patch: Partial<NarrativeData> }
  | { kind: "edges.replaceAll"; edges: Edge[] }
  | { kind: "role.add"; role: ProjectRole }
  | { kind: "role.remove"; characterRefId: string }
  | {
      kind: "axs.import";
      /** AXS 全文（Writer 轨保存 = 一个事务，整体覆写节点图） */
      source: string;
      /** 显示名 → characterRefId（解析说话人用） */
      roles: Record<string, string>;
    };

/** 一次原子编辑意图 + 来源。at（rev）由 store 在应用时记录。 */
export interface Envelope {
  readonly tx: Transaction;
  readonly origin: Origin;
}

// ------------------------------------------------------------
// 应用结果：显式失败语义（铁律 8，axiom 第三部 4.1）
// ------------------------------------------------------------

export type ApplyError =
  | { code: "node_not_found"; nodeId: NodeId }
  | { code: "duplicate_node"; nodeId: NodeId }
  | { code: "duplicate_role"; characterRefId: string }
  | { code: "index_out_of_range"; nodeId: NodeId; index: number; length: number }
  | { code: "edge_dangling"; edgeId: string; missing: NodeId }
  | { code: "invalid_script"; nodeId: NodeId; detail: string }
  | { code: "op_conflict"; nodeId: NodeId; index: number }
  | { code: "parse_failed"; detail: string };

export type ChangedRef = {
  nodes: ReadonlySet<NodeId>;
  edges: boolean;
  roles: boolean;
};

export type ApplyResult =
  | { ok: true; draft: Draft; changed: ChangedRef }
  | { ok: false; error: ApplyError };
