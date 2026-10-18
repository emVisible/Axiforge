import type { Condition, Effect, Instruction } from "@axiforge/core";

/** 单个 Beat（桥段）的 AXS AST 节点 */
export interface AxsBeat {
  id: string;
  title: string;
  /** 标题行号（1-based） */
  line: number;
  stage?: string | null;
  key?: string | null;
  isEnding?: boolean;
  endingLabel?: string | null;
  trigger?: Condition | null;
  script: Instruction[];
  /** 每条指令对应的 AXS 源行号（1-based），与 script 平行 */
  lineMap?: number[];
  effects?: Effect[];
  /** `-> 目标标题` 显式跳转（标题文本，解析边时映射为 id） */
  jumps?: string[];
  /** 未知指令等原样保留行（round-trip 透传） */
  passthrough?: string[];
}

/** Beat 之间的有向边 */
export interface AxsEdge {
  from: string;
  to: string;
  label?: string | null;
}

export type AxsDiagnosticSeverity = "error" | "warning" | "info";

export interface AxsDiagnostic {
  line: number;
  message: string;
  severity: AxsDiagnosticSeverity;
}

/** AXS 文档根 */
export interface AxsDocument {
  beats: AxsBeat[];
  edges: AxsEdge[];
  diagnostics: AxsDiagnostic[];
}

export interface ParseOptions {
  /** 显示名 → characterRefId */
  roles?: Record<string, string>;
}
