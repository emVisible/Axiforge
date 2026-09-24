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
import {
  assetRefFor,
  classifyAssetRef,
  contentKey,
  extensionFor,
} from "./assets";
import { filterByVisibility } from "./visibility";
import type {
  AssetInput,
  CreateProjectInput,
  LocalSaveSlot,
  NarrativePayload,
  ProjectBundle,
  ProjectMeta,
  ProjectMetaPatch,
  SaveSlotInput,
  StorageProvider,
  StorageResult,
  StoredAchievement,
  StoredAsset,
  StoredAssetItem,
  StoredAssetScene,
  StoredCharacter,
  StoredEdge,
  StoredNode,
  StoredRole,
  StoredScene,
  UnlockedAchievement,
  VisibilityScope,
} from "./types";
import { emptyProjectMetadata, err, ok } from "./types";

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

  /** 全局资产池与运行时状态：与 SQLite 实现同键语义（存档三元组、解锁按 key） */
  private items = new Map<string, StoredAssetItem>();
  private scenes = new Map<string, StoredAssetScene>();
  private saves = new Map<string, LocalSaveSlot>();
  private achievements = new Map<string, StoredAchievement>();
  private unlocked = new Map<string, Map<string, string>>();
  /** 成就定义归属工程——id 是随机串，故单独记账而非塞进 StoredAchievement（契约里 project 是入参不是字段） */
  private achievementProject = new Map<string, string>();
  private saveKey(projectId: string, token: string, slot: number) {
    return `${projectId}\u0000${token}\u0000${slot}`;
  }
  private assets = new Map<string, Uint8Array>();
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
    const meta: ProjectMeta = {
      id,
      title: input.title,
      updatedAt: nowIso(),
      isPublic: input.isPublic ?? false,
      ...emptyProjectMetadata(),
    };
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
    row.meta = {
      ...row.meta,
      updatedAt: nowIso(),
      description: patch.description ?? row.meta.description,
      coverImage: patch.coverImage !== undefined ? patch.coverImage : row.meta.coverImage,
      themeTags: patch.themeTags ?? row.meta.themeTags,
      mechanism: patch.mechanism !== undefined ? patch.mechanism : row.meta.mechanism,
      genre: patch.genre !== undefined ? patch.genre : row.meta.genre,
      isMeta: patch.isMeta ?? row.meta.isMeta,
    };
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

  async listCharacters(scope?: VisibilityScope): Promise<StorageResult<StoredCharacter[]>> {
    return ok(filterByVisibility([...this.characters.values()], scope));
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

  async saveAsset(input: AssetInput): Promise<StorageResult<StoredAsset>> {
    if (input.bytes.byteLength === 0) {
      return err({ code: "io", detail: "素材字节为空" });
    }
    const ref = assetRefFor(
      contentKey(input.bytes),
      extensionFor(input.name, input.mime),
    );
    this.assets.set(ref, input.bytes.slice());
    return ok({ ref, mime: input.mime, size: input.bytes.byteLength });
  }

  async readAsset(ref: string): Promise<StorageResult<Uint8Array>> {
    const kind = classifyAssetRef(ref);
    if (kind === "empty" || kind === "invalid") {
      return err({ code: "not_found", entity: "asset", id: String(ref) });
    }
    const bytes = this.assets.get(ref.trim());
    if (!bytes) return err({ code: "not_found", entity: "asset", id: ref });
    return ok(bytes.slice());
  }

  async listItems(scope?: VisibilityScope): Promise<StorageResult<StoredAssetItem[]>> {
    return ok(filterByVisibility([...this.items.values()], scope));
  }

  async saveItem(item: StoredAssetItem): Promise<StorageResult<{ id: string }>> {
    const id = item.id || this.nextId("item");
    this.items.set(id, { ...item, id, updatedAt: new Date().toISOString() });
    return ok({ id });
  }

  async deleteItem(id: string): Promise<StorageResult<void>> {
    return this.items.delete(id)
      ? ok(undefined)
      : err({ code: "not_found", entity: "item", id });
  }

  async listScenes(scope?: VisibilityScope): Promise<StorageResult<StoredAssetScene[]>> {
    return ok(filterByVisibility([...this.scenes.values()], scope));
  }

  async saveScene(scene: StoredAssetScene): Promise<StorageResult<{ id: string }>> {
    const id = scene.id || this.nextId("scene");
    this.scenes.set(id, { ...scene, id, updatedAt: new Date().toISOString() });
    return ok({ id });
  }

  async deleteScene(id: string): Promise<StorageResult<void>> {
    return this.scenes.delete(id)
      ? ok(undefined)
      : err({ code: "not_found", entity: "scene", id });
  }

  async listSaves(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<LocalSaveSlot[]>> {
    const prefix = `${projectId}\u0000${playerToken}\u0000`;
    const out = [...this.saves.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v)
      .sort((a, b) => a.slot - b.slot);
    return ok(out);
  }

  async getSave(
    projectId: string,
    playerToken: string,
    slot = 0,
  ): Promise<StorageResult<LocalSaveSlot>> {
    const hit = this.saves.get(this.saveKey(projectId, playerToken, slot));
    return hit
      ? ok(hit)
      : err({ code: "not_found", entity: "save_slot", id: `${projectId}/${slot}` });
  }

  async writeSave(
    projectId: string,
    playerToken: string,
    input: SaveSlotInput,
  ): Promise<StorageResult<LocalSaveSlot>> {
    if (!this.projects.has(projectId)) {
      return err({ code: "not_found", entity: "project", id: projectId });
    }
    const slot = input.slot ?? 0;
    const row: LocalSaveSlot = {
      slot,
      state: input.state,
      summary: input.summary ?? null,
      beatId: input.beatId ?? null,
      thumbRef: input.thumbRef ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.saves.set(this.saveKey(projectId, playerToken, slot), row);
    return ok(row);
  }

  async clearSave(
    projectId: string,
    playerToken: string,
    slot = 0,
  ): Promise<StorageResult<void>> {
    const key = this.saveKey(projectId, playerToken, slot);
    return this.saves.delete(key)
      ? ok(undefined)
      : err({ code: "not_found", entity: "save_slot", id: `${projectId}/${slot}` });
  }

  async listAchievements(
    projectId: string,
  ): Promise<StorageResult<StoredAchievement[]>> {
    const out = [...this.achievements.values()].filter(
      (a) => this.achievementProject.get(a.id) === projectId,
    );
    return ok(out);
  }

  async saveAchievement(
    projectId: string,
    achievement: StoredAchievement,
  ): Promise<StorageResult<StoredAchievement>> {
    if (!this.projects.has(projectId)) {
      return err({ code: "not_found", entity: "project", id: projectId });
    }
    const row = { ...achievement, id: achievement.id || this.nextId("ach") };
    this.achievements.set(row.id, row);
    this.achievementProject.set(row.id, projectId);
    return ok(row);
  }

  async deleteAchievement(
    projectId: string,
    id: string,
  ): Promise<StorageResult<void>> {
    if (this.achievementProject.get(id) !== projectId || !this.achievements.delete(id)) {
      return err({ code: "not_found", entity: "achievement", id });
    }
    this.achievementProject.delete(id);
    return ok(undefined);
  }

  async unlockAchievement(
    projectId: string,
    playerToken: string,
    key: string,
  ): Promise<StorageResult<void>> {
    const def = [...this.achievements.values()].find(
      (a) => a.key === key && this.achievementProject.get(a.id) === projectId,
    );
    if (!def) return err({ code: "not_found", entity: "achievement", id: `${projectId}/${key}` });
    const bucketKey = `${projectId}\u0000${playerToken}`;
    const bucket = this.unlocked.get(bucketKey) ?? new Map<string, string>();
    if (!bucket.has(def.key)) {
      bucket.set(def.key, new Date().toISOString()); // 幂等：已解锁则不改写时间
      this.unlocked.set(bucketKey, bucket);
    }
    return ok(undefined);
  }

  async listUnlocked(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<UnlockedAchievement[]>> {
    const bucket = this.unlocked.get(`${projectId}\u0000${playerToken}`);
    if (!bucket) return ok([]);
    return ok(
      [...bucket.entries()].map(([key, unlockedAt]) => ({ key, unlockedAt })),
    );
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
      meta: { id, title, updatedAt: nowIso(), isPublic: false, ...emptyProjectMetadata() },
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
