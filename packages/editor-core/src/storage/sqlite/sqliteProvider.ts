/**
 * SqliteStorageProvider —— L4 契约的 SQLite 实现（本地优先，ADR-024 决策 3）。
 *
 * 语义裁决（与 Memory 实现一致，契约套件双重验收）：
 * - createProject 引导默认舞台「主场景」+ 开始/结束两节点 + 一条边
 * - saveNarrative 在事务内原子覆写 nodes/edges/axs_source（I4）
 * - saveCharacter upsert（id 命中更新，否则插入）
 * - 失败语义：SQL 异常 → io；载入 JSON 解析失败 → corrupted
 */

import { filterByVisibility } from "../visibility";
import { deleteById, listItems, listScenes, saveItem, saveScene } from "./assetPool";
import {
  clearSave,
  getSave,
  listAchievements,
  listSaves,
  listUnlocked,
  saveAchievement,
  unlockAchievement,
  writeSave,
  deleteAchievement,
} from "./runtimeLocal";
import { asBool, nowIso, parseJson, uuid } from "./rows";
import type {
  AssetInput,
  AssetStore,
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
  UnlockedAchievement,
  VisibilityScope,
} from "../types";
import { emptyProjectMetadata, err, ok } from "../types";
import { applyMigrations, type SqlBackend, type SqlStmt } from "./backend";

interface ProjectRow {
  id: string;
  title: string;
  updated_at: string;
  axs_source: string | null;
  is_public?: number | boolean | null;
  description?: string | null;
  cover_image?: string | null;
  theme_tags?: string | null;
  mechanism?: string | null;
  genre?: string | null;
  is_meta?: number | boolean | null;
}

/** projects 行 → ProjectMeta：JSON 列逐字段解码，缺列按「本地库尚未迁移」如实归零 */
function toProjectMeta(r: ProjectRow): StorageResult<ProjectMeta> {
  const tags = parseJson<string[]>(r.theme_tags, "project.theme_tags", r.id, []);
  if (!tags.ok) return tags;
  return ok({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    isPublic: asBool(r.is_public),
    description: r.description ?? "",
    coverImage: r.cover_image ?? null,
    themeTags: tags.data,
    mechanism: r.mechanism ?? null,
    genre: r.genre ?? null,
    isMeta: asBool(r.is_meta),
  });
}

const PROJECT_COLS = `id, title, updated_at, is_public, description, cover_image,
  theme_tags, mechanism, genre, is_meta`;

interface CharacterRow {
  id: string;
  name: string;
  character_data: string;
  image_path: string | null;
  author_id: string | null;
  /** 旧库补列前可能取不到；sql.js 与 sqlx 的布尔表示不同，故显式归一 */
  is_public?: number | boolean | null;
}

export class SqliteStorageProvider implements StorageProvider {
  constructor(
    private readonly backend: SqlBackend,
    /** 素材字节存储（桌面=Tauri fs；缺省=本实现不接素材，saveAsset 返回 io） */
    private readonly assetStore?: AssetStore,
    /**
     * 本地建档者。工程与角色需要归属，否则「我的」列表永远为空
     * （桌面首启实测：播种成功但工程列表空——因为 author_id 一直是 NULL）。
     */
    private readonly authorId: string | null = null,
  ) {}

  async init(): Promise<void> {
    await applyMigrations(this.backend);
  }

  async listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT ${PROJECT_COLS} FROM projects ORDER BY updated_at DESC`,
      );
      const out: ProjectMeta[] = [];
      for (const r of rows) {
        const meta = toProjectMeta(r);
        if (!meta.ok) return meta;
        out.push(meta.data);
      }
      return ok(out);
    } catch (cause) {
      return err({ code: "io", detail: "listProjects 查询失败", cause });
    }
  }

  async createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>> {
    const id = uuid();
    const now = nowIso();
    const sceneId = uuid();
    const startId = uuid();
    const endId = uuid();
    try {
      await this.backend.execute(
        `INSERT INTO projects (id, title, updated_at, created_at, author_id, is_public) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.title, now, now, this.authorId, input.isPublic ? 1 : 0],
      );
      await this.backend.execute(
        `INSERT INTO project_scenes (id, project_id, title, sort_order) VALUES (?, ?, ?, 0)`,
        [sceneId, id, "主场景"],
      );
      const bootstrap = [
        [startId, "开始", JSON.stringify({ position: { x: 120, y: 80 } }),
         JSON.stringify({ title: "开始", narration: "故事从这里开始...", is_anchor: true }), 0],
        [endId, "结束", JSON.stringify({ position: { x: 420, y: 80 } }),
         JSON.stringify({ title: "结束", script: [] }), 1],
      ] as const;
      for (const [nid, , ed, nd, so] of bootstrap) {
        await this.backend.execute(
          `INSERT INTO project_nodes (id, project_id, stage_id, editor_data, narrative_data, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [nid, id, sceneId, ed, nd, so],
        );
      }
      await this.backend.execute(
        `INSERT INTO project_edges (id, project_id, source_node_id, target_node_id, label)
         VALUES (?, ?, ?, ?, ?)`,
        [`${startId}-${endId}`, id, startId, endId, "开始"],
      );
      return ok({
        id,
        title: input.title,
        updatedAt: now,
        isPublic: input.isPublic ?? false,
        ...emptyProjectMetadata(),
      });
    } catch (cause) {
      return err({ code: "io", detail: "createProject 写入失败", cause });
    }
  }

  async loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT ${PROJECT_COLS}, axs_source FROM projects WHERE id = ?`,
        [id],
      );
      if (!rows.length) return err({ code: "not_found", entity: "project", id });
      const row = rows[0]!;
      const meta = toProjectMeta(row);
      if (!meta.ok) return meta;

      const nodeRows = await this.backend.select<{
        id: string; stage_id: string | null; editor_data: string;
        narrative_data: string; sort_order: number;
      }>(
        `SELECT id, stage_id, editor_data, narrative_data, sort_order
         FROM project_nodes WHERE project_id = ? ORDER BY sort_order, id`,
        [id],
      );
      const nodes: StoredNode[] = [];
      for (const r of nodeRows) {
        const editor = parseJson<Record<string, unknown>>(r.editor_data, "node.editor_data", r.id, {});
        if (!editor.ok) return { ok: false, error: editor.error };
        const narrative = parseJson<Record<string, unknown>>(r.narrative_data, "node.narrative_data", r.id, {});
        if (!narrative.ok) return { ok: false, error: narrative.error };
        nodes.push({
          id: r.id,
          stageId: r.stage_id,
          editorData: editor.data,
          narrativeData: narrative.data,
          sortOrder: r.sort_order,
        });
      }

      const edgeRows = await this.backend.select<{
        id: string; source_node_id: string; target_node_id: string; label: string | null;
      }>(
        `SELECT id, source_node_id, target_node_id, label FROM project_edges WHERE project_id = ?`,
        [id],
      );
      const edges: StoredEdge[] = edgeRows.map((e) => ({
        id: e.id, source: e.source_node_id, target: e.target_node_id, label: e.label,
      }));

      const sceneRows = await this.backend.select<{ id: string; title: string }>(
        `SELECT id, title FROM project_scenes WHERE project_id = ? ORDER BY sort_order, id`,
        [id],
      );
      const roleRows = await this.backend.select<{ id: string; character_ref_id: string }>(
        `SELECT id, character_ref_id FROM project_roles WHERE project_id = ?`,
        [id],
      );

      return ok({
        meta: meta.data,
        axsSource: row.axs_source,
        nodes,
        edges,
        scenes: sceneRows,
        roles: roleRows.map((r) => ({ id: r.id, characterRefId: r.character_ref_id })),
      });
    } catch (cause) {
      return err({ code: "io", detail: "loadProject 查询失败", cause });
    }
  }

  async deleteProject(id: string): Promise<StorageResult<void>> {
    try {
      const r = await this.backend.execute(`DELETE FROM projects WHERE id = ?`, [id]);
      return r.rowsAffected > 0
        ? ok(undefined)
        : err({ code: "not_found", entity: "project", id });
    } catch (cause) {
      return err({ code: "io", detail: "deleteProject 失败", cause });
    }
  }

  async updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>> {
    try {
      const sets: string[] = ["updated_at = ?"];
      const params: unknown[] = [nowIso()];
      if (patch.title !== undefined) { sets.push("title = ?"); params.push(patch.title); }
      if (patch.axsSource !== undefined) { sets.push("axs_source = ?"); params.push(patch.axsSource); }
      if (patch.description !== undefined) { sets.push("description = ?"); params.push(patch.description); }
      if (patch.coverImage !== undefined) { sets.push("cover_image = ?"); params.push(patch.coverImage); }
      if (patch.themeTags !== undefined) { sets.push("theme_tags = ?"); params.push(JSON.stringify(patch.themeTags)); }
      if (patch.mechanism !== undefined) { sets.push("mechanism = ?"); params.push(patch.mechanism); }
      if (patch.genre !== undefined) { sets.push("genre = ?"); params.push(patch.genre); }
      if (patch.isMeta !== undefined) { sets.push("is_meta = ?"); params.push(patch.isMeta ? 1 : 0); }
      params.push(id);
      const r = await this.backend.execute(
        `UPDATE projects SET ${sets.join(", ")} WHERE id = ?`, params,
      );
      return r.rowsAffected > 0
        ? ok(undefined)
        : err({ code: "not_found", entity: "project", id });
    } catch (cause) {
      return err({ code: "io", detail: "updateProjectMeta 失败", cause });
    }
  }

  async saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>> {
    try {
      const exists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!exists.length) return err({ code: "not_found", entity: "project", id });
      const stmts = [
        { sql: `DELETE FROM project_nodes WHERE project_id = ?`, params: [id] },
        { sql: `DELETE FROM project_edges WHERE project_id = ?`, params: [id] },
        ...payload.nodes.map(
          (n): SqlStmt => ({
            sql: `INSERT INTO project_nodes (id, project_id, stage_id, editor_data, narrative_data, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            params: [n.id, id, n.stageId, JSON.stringify(n.editorData), JSON.stringify(n.narrativeData), n.sortOrder],
          }),
        ),
        ...payload.edges.map(
          (e): SqlStmt => ({
            sql: `INSERT INTO project_edges (id, project_id, source_node_id, target_node_id, label)
             VALUES (?, ?, ?, ?, ?)`,
            params: [e.id, id, e.source, e.target, e.label],
          }),
        ),
        {
          sql: `UPDATE projects SET axs_source = ?, updated_at = ? WHERE id = ?`,
          params: [payload.axsSource, nowIso(), id],
        },
      ];
      await this.backend.transactional(stmts);
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "saveNarrative 事务失败已回滚", cause });
    }
  }

  async addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>> {
    try {
      const projectExists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!projectExists.length) return err({ code: "not_found", entity: "project", id });
      const dup = await this.backend.select(
        `SELECT id FROM project_roles WHERE project_id = ? AND character_ref_id = ?`,
        [id, role.characterRefId],
      );
      if (dup.length) {
        return err({ code: "io", detail: `duplicate role characterRefId=${role.characterRefId}` });
      }
      await this.backend.execute(
        `INSERT INTO project_roles (id, project_id, character_ref_id) VALUES (?, ?, ?)`,
        [uuid(), id, role.characterRefId],
      );
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "addRole 失败", cause });
    }
  }

  async removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    try {
      const projectExists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!projectExists.length) return err({ code: "not_found", entity: "project", id });
      await this.backend.execute(
        `DELETE FROM project_roles WHERE project_id = ? AND id = ?`,
        [id, roleId],
      );
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "removeRole 失败", cause });
    }
  }

  async listCharacters(scope?: VisibilityScope): Promise<StorageResult<StoredCharacter[]>> {
    try {
      const rows = await this.backend.select<CharacterRow>(
        `SELECT id, name, character_data, image_path, author_id, is_public FROM characters`,
      );
      const out: StoredCharacter[] = [];
      for (const r of rows) {
        const cd = parseJson<Record<string, unknown>>(r.character_data, "character.character_data", r.id, {});
        if (!cd.ok) return { ok: false, error: cd.error };
        out.push({
          id: r.id,
          name: r.name,
          characterData: cd.data,
          imagePath: r.image_path,
          isPublic: r.is_public === 1 || r.is_public === true,
          authorId: r.author_id ?? null,
        });
      }
      return ok(filterByVisibility(out, scope));
    } catch (cause) {
      return err({ code: "io", detail: "listCharacters 查询失败", cause });
    }
  }

  async getCharacter(id: string): Promise<StorageResult<StoredCharacter>> {
    try {
      const rows = await this.backend.select<CharacterRow>(
        `SELECT id, name, character_data, image_path, author_id, is_public FROM characters WHERE id = ?`,
        [id],
      );
      if (!rows.length) return err({ code: "not_found", entity: "character", id });
      const r = rows[0]!;
      const cd = parseJson<Record<string, unknown>>(r.character_data, "character.character_data", r.id, {});
      if (!cd.ok) return cd;
      return ok({
        id: r.id,
        name: r.name,
        characterData: cd.data,
        imagePath: r.image_path,
        isPublic: r.is_public === 1 || r.is_public === true,
        authorId: r.author_id ?? null,
      });
    } catch (cause) {
      return err({ code: "io", detail: "getCharacter 查询失败", cause });
    }
  }

  async saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>> {
    try {
      const id = character.id || uuid();
      const cd = JSON.stringify(character.characterData);
      const exists = await this.backend.select(
        `SELECT id FROM characters WHERE id = ?`, [id],
      );
      if (exists.length) {
        await this.backend.execute(
          `UPDATE characters SET name = ?, character_data = ?, image_path = ?, author_id = ?, is_public = ? WHERE id = ?`,
          [character.name, cd, character.imagePath, character.authorId, character.isPublic ? 1 : 0, id],
        );
      } else {
        await this.backend.execute(
          `INSERT INTO characters (id, name, character_data, image_path, author_id, is_public) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, character.name, cd, character.imagePath, character.authorId, character.isPublic ? 1 : 0],
        );
      }
      return ok({ id });
    } catch (cause) {
      return err({ code: "io", detail: "saveCharacter 失败", cause });
    }
  }

  /**
   * 素材不经 SQL 存储：字节归文件系统（ADR-024 决策 3），DB 只出现 ref 字符串
   * （活在 narrative_data / characters.image_path 里）。故此处纯委派注入端口。
   */
  async saveAsset(input: AssetInput): Promise<StorageResult<StoredAsset>> {
    if (!this.assetStore) {
      return err({ code: "io", detail: "未配置素材存储（AssetStore 未注入）" });
    }
    return this.assetStore.write(input);
  }

  async readAsset(ref: string): Promise<StorageResult<Uint8Array>> {
    if (!this.assetStore) {
      return err({ code: "io", detail: "未配置素材存储（AssetStore 未注入）" });
    }
    return this.assetStore.read(ref);
  }

  // ---------- 全局资产池 / 运行时状态：实现体在 assetPool 与 runtimeLocal ----------

  listItems(scope?: VisibilityScope) {
    return listItems(this.backend, scope);
  }

  saveItem(item: StoredAssetItem) {
    return saveItem(this.backend, item, this.authorId);
  }

  deleteItem(id: string) {
    return deleteById(this.backend, "asset_items", "item", id);
  }

  listScenes(scope?: VisibilityScope) {
    return listScenes(this.backend, scope);
  }

  saveScene(scene: StoredAssetScene) {
    return saveScene(this.backend, scene, this.authorId);
  }

  deleteScene(id: string) {
    return deleteById(this.backend, "asset_scenes", "scene", id);
  }

  listSaves(projectId: string, playerToken: string): Promise<StorageResult<LocalSaveSlot[]>> {
    return listSaves(this.backend, projectId, playerToken);
  }

  getSave(projectId: string, playerToken: string, slot = 0): Promise<StorageResult<LocalSaveSlot>> {
    return getSave(this.backend, projectId, playerToken, slot);
  }

  writeSave(
    projectId: string,
    playerToken: string,
    input: SaveSlotInput,
  ): Promise<StorageResult<LocalSaveSlot>> {
    return writeSave(this.backend, projectId, playerToken, input);
  }

  clearSave(projectId: string, playerToken: string, slot = 0): Promise<StorageResult<void>> {
    return clearSave(this.backend, projectId, playerToken, slot);
  }

  listAchievements(projectId: string): Promise<StorageResult<StoredAchievement[]>> {
    return listAchievements(this.backend, projectId);
  }

  saveAchievement(
    projectId: string,
    achievement: StoredAchievement,
  ): Promise<StorageResult<StoredAchievement>> {
    return saveAchievement(this.backend, projectId, achievement);
  }

  deleteAchievement(projectId: string, id: string): Promise<StorageResult<void>> {
    return deleteAchievement(this.backend, projectId, id);
  }

  unlockAchievement(
    projectId: string,
    playerToken: string,
    key: string,
  ): Promise<StorageResult<void>> {
    return unlockAchievement(this.backend, projectId, playerToken, key);
  }

  listUnlocked(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<UnlockedAchievement[]>> {
    return listUnlocked(this.backend, projectId, playerToken);
  }
}
