/**
 * MemoryStorageProvider —— 契约的内存实现。
 *
 * 双职责：① 契约测试的基准实现（确定性、无 I/O）② 桌面端离线 mock 的雏形。
 * 语义裁决（文档化于本文件，实现必须与之一致）：
 * - createProject 引导默认舞台「主场景」+ 开始/结束两节点 + 一条边（对齐现行 HTTP 后端语义）
 * - saveNarrative 原子覆写 nodes/edges/axsSource（I4）
 * - saveCharacter 为 upsert（按 id 覆盖或追加）
 */

import { createDraft } from "../document";
import type { Draft } from "../types";
import type {
  CreateProjectInput,
  NarrativePayload,
  ProjectBundle,
  ProjectMeta,
  ProjectMetaPatch,
  StorageProvider,
  StorageResult,
  StoredCharacter,
  StoredEdge,
  StoredNode,
  StoredRole,
  StoredScene,
} from "./types";
import { err, ok } from "./types";

interface ProjectRow {
  meta: ProjectMeta;
  axsSource: string | null;
  nodes: Map<string, StoredNode>;
  edges: StoredEdge[];
  scenes: StoredScene[];
  roles: StoredRole[];
}

const nowIso = () => new Date().toISOString();

function bootstrapScenesAndNodes(): {
  scenes: StoredScene[];
  nodes: StoredNode[];
  edges: StoredEdge[];
} {
  const scenes: StoredScene[] = [{ id: "scene-main", title: "主场景" }];
  const nodes: StoredNode[] = [
    {
      id: "node-start",
      stageId: "scene-main",
      editorData: { position: { x: 120, y: 80 } },
      narrativeData: { title: "开始", narration: "故事从这里开始...", is_anchor: true },
      sortOrder: 0,
    },
    {
      id: "node-end",
      stageId: "scene-main",
      editorData: { position: { x: 420, y: 80 } },
      narrativeData: { title: "结束", script: [] },
      sortOrder: 1,
    },
  ];
  const edges: StoredEdge[] = [
    { id: "node-start-node-end", source: "node-start", target: "node-end", label: "开始" },
  ];
  return { scenes, nodes, edges };
}

export class MemoryStorageProvider implements StorageProvider {
  private projects = new Map<string, ProjectRow>();
  private characters = new Map<string, StoredCharacter>();
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq.toString(36).padStart(4, "0")}`;
  }

  async listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    const list = [...this.projects.values()]
      .map((r) => r.meta)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return ok(list);
  }

  async createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>> {
    const id = this.nextId("proj");
    const meta: ProjectMeta = { id, title: input.title, updatedAt: nowIso() };
    const { scenes, nodes, edges } = bootstrapScenesAndNodes();
    this.projects.set(id, {
      meta,
      axsSource: null,
      nodes: new Map(nodes.map((n) => [n.id, n])),
      edges,
      scenes,
      roles: [],
    });
    return ok(meta);
  }

  async loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    const row = this.projects.get(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    return ok(this.bundleOf(row));
  }

  async deleteProject(id: string): Promise<StorageResult<void>> {
    if (!this.projects.delete(id)) {
      return err({ code: "not_found", entity: "project", id });
    }
    return ok(undefined);
  }

  async updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>> {
    const row = this.projects.get(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    if (patch.title !== undefined) row.meta = { ...row.meta, title: patch.title };
    if (patch.axsSource !== undefined) row.axsSource = patch.axsSource;
    row.meta = { ...row.meta, updatedAt: nowIso() };
    return ok(undefined);
  }

  async saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>> {
    const row = this.projects.get(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    row.nodes = new Map(payload.nodes.map((n) => [n.id, n]));
    row.edges = [...payload.edges];
    row.axsSource = payload.axsSource;
    row.meta = { ...row.meta, updatedAt: nowIso() };
    return ok(undefined);
  }

  async addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>> {
    const row = this.projects.get(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    if (row.roles.some((r) => r.characterRefId === role.characterRefId)) {
      return err({
        code: "io",
        detail: `duplicate role characterRefId=${role.characterRefId}`,
      });
    }
    row.roles = [...row.roles, { id: this.nextId("role"), characterRefId: role.characterRefId }];
    return ok(undefined);
  }

  async removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    const row = this.projects.get(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    row.roles = row.roles.filter((r) => r.id !== roleId);
    return ok(undefined);
  }

  async listCharacters(): Promise<StorageResult<StoredCharacter[]>> {
    return ok([...this.characters.values()]);
  }

  async getCharacter(id: string): Promise<StorageResult<StoredCharacter>> {
    const c = this.characters.get(id);
    if (!c) return err({ code: "not_found", entity: "character", id });
    return ok(c);
  }

  async saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>> {
    const id = character.id || this.nextId("char");
    this.characters.set(id, { ...character, id });
    return ok({ id });
  }

  // ---- 测试辅助：Draft 视图 ----
  bundleOf(row: ProjectRow): ProjectBundle {
    return {
      meta: row.meta,
      axsSource: row.axsSource,
      nodes: [...row.nodes.values()],
      edges: row.edges,
      scenes: row.scenes,
      roles: row.roles,
    };
  }

  /** 载入既有 Draft 快照（测试夹具/迁移用） */
  seedProject(id: string, title: string, draft: Draft): void {
    const nodes: StoredNode[] = [...draft.nodes.values()].map((n) => ({
      id: n.id,
      stageId: n.stageId,
      editorData: { position: n.position },
      narrativeData: n.narrative as unknown as Record<string, unknown>,
      sortOrder: n.sortOrder,
    }));
    const edges: StoredEdge[] = draft.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? null,
    }));
    this.projects.set(id, {
      meta: { id, title, updatedAt: nowIso() },
      axsSource: null,
      nodes: new Map(nodes.map((n) => [n.id, n])),
      edges,
      scenes: [...draft.scenes],
      roles: [...draft.roles],
    });
  }
}

/** 便捷构造：空 Draft（re-export 避免测试文件跨包再引） */
export const emptyDraftOf = createDraft;
