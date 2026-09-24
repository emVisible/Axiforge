/**
 * HttpStorageProvider —— L4 契约的 HTTP 实现（包装既有 api 层）。
 *
 * 语义映射：
 * - loadProject = GET project → ProjectBundle（nodes 取 project.nodes，回退 scenes 展开）
 * - saveNarrative = PUT /narrative（后端原子覆写 nodes/edges/axs_source）
 * - saveCharacter = id 命中→PUT 更新；否则 POST 创建（返回服务端 id）
 * 失败语义：404 → not_found；其余网络/服务端错误 → io（detail 携带状态码）。
 */
import { projectApi } from "@/shared/api/editor";
import { getApiBase } from "@/shared/api/client";
import { characterApi } from "@/shared/api/characters";
import { collectProjectNodes } from "@/features/writer/lib/projection";
import {
  httpClearSave,
  httpDeleteAchievement,
  httpDeleteItem,
  httpDeleteScene,
  httpGetSave,
  httpListAchievements,
  httpListItems,
  httpListSaves,
  httpListScenes,
  httpListUnlocked,
  httpSaveAchievement,
  httpSaveItem,
  httpSaveScene,
  httpUnlockAchievement,
  httpWriteSave,
} from "./httpDomains";
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
  UnlockedAchievement,
  VisibilityScope,
} from "@axiforge/editor-core";
import { classifyAssetRef, err, filterByVisibility, ok } from "@axiforge/editor-core";
import type {
  ProjectNodeResponse,
  ProjectResponse,
  ProjectUpdate,
} from "@/shared/types/project";

function fail<T>(e: unknown, entity: string, id: string): StorageResult<T> {
  const status = (e as { status?: number })?.status;
  if (status === 404) return err({ code: "not_found", entity, id });
  return err({
    code: "io",
    detail: `${entity} 请求失败${status ? ` (HTTP ${status})` : ""}`,
    cause: e,
  });
}

/** 传输态 Character → 存储态 StoredCharacter（字段显式映射，缺省即声明缺省） */
function toStoredCharacter(c: {
  id: string | number;
  name: string;
  character_data?: unknown;
  image_path?: string | null;
  author_id?: string | null;
  is_public?: boolean | null;
}): StoredCharacter {
  return {
    id: String(c.id),
    name: c.name,
    characterData: (c.character_data ?? {}) as Record<string, unknown>,
    imagePath: c.image_path ?? null,
    isPublic: c.is_public ?? false,
    authorId: c.author_id ?? null,
  };
}

/** 工程元数据：一处映射，list / create / bundle 三处共用，避免同一转换写三遍 */
function projectMetaOf(p: ProjectResponse): ProjectMeta {
  return {
    id: String(p.id),
    title: p.title,
    updatedAt: p.updated_at,
    isPublic: Boolean(p.is_public),
    description: p.description ?? "",
    coverImage: p.cover_image ?? null,
    themeTags: p.theme_tags ?? [],
    mechanism: p.mechanism ?? null,
    genre: p.genre ?? null,
    isMeta: Boolean(p.is_meta),
  };
}

function toBundle(p: ProjectResponse): ProjectBundle {
  const nodes = collectProjectNodes(p.nodes, p.scenes || []);
  return {
    meta: projectMetaOf(p),
    axsSource: p.axs_source ?? null,
    nodes: nodes.map((n: ProjectNodeResponse) => ({
      id: String(n.id),
      stageId: n.stage_id ?? n.scene_id ?? null,
      editorData: (n.editor_data ?? {}) as Record<string, unknown>,
      narrativeData: (n.narrative_data ?? {}) as Record<string, unknown>,
      sortOrder: n.sort_order ?? 0,
    })),
    edges: (p.edges || []).map((e) => ({
      id: e.id,
      source: String(e.source_node_id),
      target: String(e.target_node_id),
      label: e.label,
    })),
    scenes: (p.scenes || []).map((s) => ({ id: s.id, title: s.title })),
    roles: (p.roles || []).map((r) => ({
      id: r.id,
      characterRefId: r.character_ref_id,
    })),
  };
}

export class HttpStorageProvider implements StorageProvider {
  constructor(private readonly creatorId: string) {}

  async listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    try {
      const list = await projectApi.list({ author_id: this.creatorId });
      return ok(list.map(projectMetaOf));
    } catch (e) {
      return fail(e, "projects", this.creatorId);
    }
  }

  async createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>> {
    try {
      const p = await projectApi.create({
        title: input.title,
        is_public: input.isPublic ?? false,
      });
      return ok(projectMetaOf(p));
    } catch (e) {
      return fail(e, "project", input.title);
    }
  }

  async loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    try {
      return ok(toBundle(await projectApi.get(id)));
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async deleteProject(id: string): Promise<StorageResult<void>> {
    try {
      await projectApi.delete(id);
      return ok(undefined);
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>> {
    try {
      await projectApi.update(id, {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.axsSource !== undefined ? { axs_source: patch.axsSource } : {}),
      } as ProjectUpdate);
      return ok(undefined);
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>> {
    try {
      await projectApi.syncNarrative(id, {
        axs_source: payload.axsSource ?? "",
        nodes: payload.nodes.map((n) => ({
          id: n.id,
          stage_id: n.stageId,
          editor_data: n.editorData as Record<string, unknown>,
          narrative_data: n.narrativeData as Record<string, unknown>,
          sort_order: n.sortOrder,
        })),
        edges: payload.edges.map((e) => ({
          source_node_id: e.source,
          target_node_id: e.target,
          source_port: "output",
          label: e.label,
        })),
      });
      return ok(undefined);
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>> {
    try {
      await projectApi.addRole(id, { character_ref_id: role.characterRefId });
      return ok(undefined);
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    try {
      await projectApi.removeRole(id, roleId);
      return ok(undefined);
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  /**
   * 范围取数：我的走 listUser，公开走 listPublic（带 search），
   * 两者都取时按 id 合并去重——与桌面实现共用同一「我的 ∪ 公开」语义。
   */
  async listCharacters(scope?: VisibilityScope): Promise<StorageResult<StoredCharacter[]>> {
    try {
      const authorId = scope?.authorId ?? null;
      const includePublic = scope?.includePublic ?? authorId === null;
      const merged = new Map<string, StoredCharacter>();

      if (authorId !== null) {
        const mine = await characterApi.listUser(authorId);
        for (const c of mine) merged.set(String(c.id), toStoredCharacter(c));
      }
      if (includePublic) {
        const page = await characterApi.listPublic({
          limit: 200,
          ...(scope?.search ? { search: scope.search } : {}),
        });
        for (const c of page.items ?? []) {
          const key = String(c.id);
          if (!merged.has(key)) merged.set(key, toStoredCharacter(c));
        }
      }
      return ok(filterByVisibility([...merged.values()], scope));
    } catch (e) {
      return fail(e, "characters", scope?.authorId ?? this.creatorId);
    }
  }

  async getCharacter(id: string): Promise<StorageResult<StoredCharacter>> {
    try {
      return ok(toStoredCharacter(await characterApi.get(id)));
    } catch (e) {
      return fail(e, "character", id);
    }
  }

  async saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>> {
    try {
      if (character.id) {
        await characterApi.update(character.id, {
          character_data: character.characterData as never,
          image_path: character.imagePath === null ? undefined : character.imagePath,
        } as never);
        return ok({ id: character.id });
      }
      const created = await characterApi.create({
        character_data: character.characterData as never,
        image_path: character.imagePath ?? undefined,
        author_id: character.authorId ?? this.creatorId,
        is_public: character.isPublic,
      } as never);
      return ok({ id: String(created.id) });
    } catch (e) {
      return fail(e, "character", character.id || "(new)");
    }
  }

  /** 素材走服务端上传口（web 冻结线行为）：ref = 服务端返回的 /uploads/... 绝对路径 */
  async saveAsset(input: AssetInput): Promise<StorageResult<StoredAsset>> {
    if (input.bytes.byteLength === 0) {
      return err({ code: "io", detail: "素材字节为空" });
    }
    try {
      const form = new FormData();
      form.append("file", new Blob([input.bytes as BlobPart], { type: input.mime }), input.name);
      const res = await fetch(`${getApiBase()}/upload`, { method: "POST", body: form });
      if (!res.ok) {
        return err({ code: "io", detail: `素材上传失败 (HTTP ${res.status})` });
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) return err({ code: "corrupted", entity: "asset", detail: "上传响应缺 url" });
      return ok({ ref: data.url, mime: input.mime, size: input.bytes.byteLength });
    } catch (e) {
      return err({ code: "io", detail: "素材上传请求失败", cause: e });
    }
  }

  async readAsset(ref: string): Promise<StorageResult<Uint8Array>> {
    if (classifyAssetRef(ref) !== "direct") {
      return err({ code: "not_found", entity: "asset", id: ref });
    }
    try {
      const res = await fetch(ref);
      if (!res.ok) {
        return err({ code: "not_found", entity: "asset", id: ref });
      }
      return ok(new Uint8Array(await res.arrayBuffer()));
    } catch (e) {
      return err({ code: "io", detail: "素材读取请求失败", cause: e });
    }
  }

  // ---------- 四个新域：实现体在 httpDomains.ts（守 G1 行数预算） ----------

  listItems(scope?: VisibilityScope): Promise<StorageResult<StoredAssetItem[]>> {
    return httpListItems(scope);
  }

  saveItem(item: StoredAssetItem): Promise<StorageResult<{ id: string }>> {
    return httpSaveItem(item, this.creatorId);
  }

  deleteItem(id: string): Promise<StorageResult<void>> {
    return httpDeleteItem(id);
  }

  listScenes(scope?: VisibilityScope): Promise<StorageResult<StoredAssetScene[]>> {
    return httpListScenes(scope);
  }

  saveScene(scene: StoredAssetScene): Promise<StorageResult<{ id: string }>> {
    return httpSaveScene(scene, this.creatorId);
  }

  deleteScene(id: string): Promise<StorageResult<void>> {
    return httpDeleteScene(id);
  }

  listSaves(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<LocalSaveSlot[]>> {
    return httpListSaves(projectId, playerToken);
  }

  getSave(
    projectId: string,
    playerToken: string,
    slot = 0,
  ): Promise<StorageResult<LocalSaveSlot>> {
    return httpGetSave(projectId, playerToken, slot);
  }

  writeSave(
    projectId: string,
    playerToken: string,
    input: SaveSlotInput,
  ): Promise<StorageResult<LocalSaveSlot>> {
    return httpWriteSave(projectId, playerToken, input);
  }

  clearSave(
    projectId: string,
    playerToken: string,
    slot = 0,
  ): Promise<StorageResult<void>> {
    return httpClearSave(projectId, playerToken, slot);
  }

  listAchievements(projectId: string): Promise<StorageResult<StoredAchievement[]>> {
    return httpListAchievements(projectId);
  }

  saveAchievement(
    projectId: string,
    achievement: StoredAchievement,
  ): Promise<StorageResult<StoredAchievement>> {
    return httpSaveAchievement(projectId, achievement);
  }

  deleteAchievement(projectId: string, id: string): Promise<StorageResult<void>> {
    return httpDeleteAchievement(projectId, id);
  }

  unlockAchievement(
    projectId: string,
    playerToken: string,
    key: string,
  ): Promise<StorageResult<void>> {
    return httpUnlockAchievement(projectId, playerToken, key);
  }

  listUnlocked(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<UnlockedAchievement[]>> {
    return httpListUnlocked(projectId, playerToken);
  }
}
