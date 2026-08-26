/**
 * L4 存取契约（KERNEL_DESIGN §2.5）——失败语义显式的存储抽象。
 *
 * 设计裁决：
 * - 一切方法返回 StorageResult 判别联合，禁止异常穿越内核边界
 * - 空值五义显式区分（axiom 第三部 1.4）：不存在=not_found；解析失败=corrupted；
 *   磁盘/网络故障=io；字段缺失=领域内 null；空集合=合法空数组
 * - 重试/提示是调用方（L5）的策略；Provider 只如实报告失败
 * - 契约测试套件（storage/contract.test.ts）是一切实现的验收标准：
 *   Memory / HTTP / SQLite 实现都必须全绿
 */

import type { Instruction, Condition, Effect } from "@axiforge/core";

// ------------------------------------------------------------
// 结果与错误
// ------------------------------------------------------------

export type StorageError =
  | { code: "not_found"; entity: string; id: string }
  | { code: "corrupted"; entity: string; detail: string; cause?: unknown }
  | { code: "io"; detail: string; cause?: unknown };

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StorageError };

export const ok = <T>(data: T): StorageResult<T> => ({ ok: true, data });
export const err = <T>(error: StorageError): StorageResult<T> => ({
  ok: false,
  error,
});


// ------------------------------------------------------------
// 记录形态（存储态；与传输态 DTO、使用态 Draft 三者解耦）
// ------------------------------------------------------------

export interface ProjectMeta {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
}

export interface StoredNode {
  readonly id: string;
  readonly stageId: string | null;
  readonly editorData: Record<string, unknown>; // 含 position
  readonly narrativeData: Record<string, unknown>; // 含 script: Instruction[]（JSON 列）
  readonly sortOrder: number;
}

export interface StoredEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label: string | null;
}

export interface StoredScene {
  readonly id: string;
  readonly title: string;
}

export interface StoredRole {
  readonly id: string;
  readonly characterRefId: string;
}

export interface ProjectBundle {
  readonly meta: ProjectMeta;
  readonly axsSource: string | null;
  readonly nodes: readonly StoredNode[];
  readonly edges: readonly StoredEdge[];
  readonly scenes: readonly StoredScene[];
  readonly roles: readonly StoredRole[];
}

/** 一次原子叙事保存（nodes/edges/axs_source 同批提交，对应后端 sync 语义） */
export interface NarrativePayload {
  readonly axsSource: string | null;
  readonly nodes: readonly StoredNode[];
  readonly edges: readonly StoredEdge[];
}

export interface StoredCharacter {
  readonly id: string;
  readonly name: string;
  readonly characterData: Record<string, unknown>; // 六层模型 JSON（ADR-001）
  readonly imagePath: string | null;
}

export interface CreateProjectInput {
  readonly title: string;
  readonly isPublic?: boolean;
}

export interface ProjectMetaPatch {
  readonly title?: string;
  readonly axsSource?: string | null;
}

// ------------------------------------------------------------
// 契约
// ------------------------------------------------------------

export interface StorageProvider {
  /** 工程清单（无工程=空数组，非错误） */
  listProjects(): Promise<StorageResult<ProjectMeta[]>>;

  /** 新建工程（引导默认舞台/节点由实现决定，等价于现行 create 语义） */
  createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>>;

  /**
   * 失败语义：不存在→not_found；存储损坏→corrupted；底层故障→io。
   * 成功返回完整 ProjectBundle（含 nodes/edges/scenes/roles）。
   */
  loadProject(id: string): Promise<StorageResult<ProjectBundle>>;

  /** 不存在→not_found */
  deleteProject(id: string): Promise<StorageResult<void>>;

  /** 元信息补丁（标题/axs_source 投影快照） */
  updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>>;

  /** 原子覆写叙事图（Writer 轨保存与剪辑台 saveAll 共用） */
  saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>>;

  /** 重复 characterRefId→duplicate 语义由实现以 io/detail 报告（v0 不单列错误码） */
  addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>>;

  removeRole(
    id: string,
    roleId: string,
  ): Promise<StorageResult<void>>;

  listCharacters(): Promise<StorageResult<StoredCharacter[]>>;

  getCharacter(id: string): Promise<StorageResult<StoredCharacter>>;

  /**
   * upsert：id 命中既有角色则更新；否则创建并返回服务端分配的 id
   * （HTTP 后端不支持客户端指定 id——契约以返回值为准，调用方不得假设入参 id 生效）
   */
  saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>>;
}

// ------------------------------------------------------------
// 便捷守卫（L5 消费用）
// ------------------------------------------------------------

export const isStorageFailure = <T>(
  r: StorageResult<T>,
): r is { ok: false; error: StorageError } => !r.ok;

/** IR 相关类型再导出：存储态 narrativeData 内的 script 元素形状 */
export type { Instruction, Condition, Effect };
