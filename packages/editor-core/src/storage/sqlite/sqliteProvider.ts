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
import { asBool, parseJson, uuid } from "./rows";
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
  UnlockedAchievement,
  VisibilityScope,
} from "../types";
import { err, ok } from "../types";
import { applyMigrations, type SqlBackend } from "./backend";
import { SqliteProjectStore } from "./sqliteProject";

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
  ) {
    this.projectStore = new SqliteProjectStore(backend, authorId);
  }

  /** 工程域（projects / nodes / edges / scenes / roles）交给协作者持有 */
  private readonly projectStore: SqliteProjectStore;

  async init(): Promise<void> {
    await applyMigrations(this.backend);
  }

  // ---------- 工程域：实现体在 sqliteProject.ts，本类只做契约分派 ----------

  listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    return this.projectStore.listProjects();
  }

  createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>> {
    return this.projectStore.createProject(input);
  }

  loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    return this.projectStore.loadProject(id);
  }

  deleteProject(id: string): Promise<StorageResult<void>> {
    return this.projectStore.deleteProject(id);
  }

  updateProjectMeta(id: string, patch: ProjectMetaPatch): Promise<StorageResult<void>> {
    return this.projectStore.updateProjectMeta(id, patch);
  }

  saveNarrative(id: string, payload: NarrativePayload): Promise<StorageResult<void>> {
    return this.projectStore.saveNarrative(id, payload);
  }

  addRole(id: string, role: { characterRefId: string }): Promise<StorageResult<void>> {
    return this.projectStore.addRole(id, role);
  }

  removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    return this.projectStore.removeRole(id, roleId);
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
          isPublic: asBool(r.is_public),
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
        isPublic: asBool(r.is_public),
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
