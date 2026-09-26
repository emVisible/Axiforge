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
  fail,
  httpClearSave,
  httpDeleteAchievement,
  httpDeleteItem,
  httpDeleteScene,
  httpGetItem,
  httpGetSave,
  httpGetScene,
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
  toStoredCharacter,
  metaPatchToUpdateBody,
} from "./httpDomains";
import {
  httpDeleteStory,
  httpGetStory,
  httpListStories,
  httpSaveStory,
} from "./httpStories";
import type {
  AssetInput,
  CreateProjectInput,
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
  StoredStory,
  VisibilityScope,
} from "@axiforge/editor-core";
import { classifyAssetRef, err, filterByVisibility, ok } from "@axiforge/editor-core";
import type {
  ProjectNodeResponse,
  ProjectResponse,
} from "@/shared/types/project";

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
    worldSetting: p.world_setting ?? null,
    rules: p.rules ?? null,
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
      await projectApi.update(id, metaPatchToUpdateBody(patch));
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

  async addProjectScene(
    id: string,
    scene: { title: string },
  ): Promise<StorageResult<{ id: string }>> {
    try {
      const created = await projectApi.addScene(id, { title: scene.title });
      return ok({ id: String(created.id) });
    } catch (e) {
      return fail(e, "project", id);
    }
  }

  async removeProjectScene(id: string, sceneId: string): Promise<StorageResult<void>> {
    try {
      await projectApi.deleteScene(id, sceneId);
      return ok(undefined);
    } catch (e) {
      return fail(e, "scene", sceneId);
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

  // ---------- 各域实现体在外置模块（守 G1 行数预算）；纯转调不重复声明返回类型 ----------

  listItems(scope?: VisibilityScope) {
    return httpListItems(scope);
  }
  saveItem(item: StoredAssetItem) {
    return httpSaveItem(item, this.creatorId);
  }
  getItem(id: string) {
    return httpGetItem(id);
  }
  deleteItem(id: string) {
    return httpDeleteItem(id);
  }
  listScenes(scope?: VisibilityScope) {
    return httpListScenes(scope);
  }
  saveScene(scene: StoredAssetScene) {
    return httpSaveScene(scene, this.creatorId);
  }
  getScene(id: string) {
    return httpGetScene(id);
  }
  deleteScene(id: string) {
    return httpDeleteScene(id);
  }
  listStories(characterId: string) {
    return httpListStories(characterId);
  }
  saveStory(story: StoredStory) {
    return httpSaveStory(story);
  }
  getStory(characterId: string, id: string) {
    return httpGetStory(characterId, id);
  }
  deleteStory(characterId: string, id: string) {
    return httpDeleteStory(characterId, id);
  }
  listSaves(projectId: string, playerToken: string) {
    return httpListSaves(projectId, playerToken);
  }
  getSave(projectId: string, playerToken: string, slot = 0) {
    return httpGetSave(projectId, playerToken, slot);
  }
  writeSave(projectId: string, playerToken: string, input: SaveSlotInput) {
    return httpWriteSave(projectId, playerToken, input);
  }
  clearSave(projectId: string, playerToken: string, slot = 0) {
    return httpClearSave(projectId, playerToken, slot);
  }
  listAchievements(projectId: string) {
    return httpListAchievements(projectId);
  }
  saveAchievement(projectId: string, achievement: StoredAchievement) {
    return httpSaveAchievement(projectId, achievement);
  }
  deleteAchievement(projectId: string, id: string) {
    return httpDeleteAchievement(projectId, id);
  }
  unlockAchievement(projectId: string, playerToken: string, key: string) {
    return httpUnlockAchievement(projectId, playerToken, key);
  }
  listUnlocked(projectId: string, playerToken: string) {
    return httpListUnlocked(projectId, playerToken);
  }
}
