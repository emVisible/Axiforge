/**
 * 工程内「挂接域」的 SQLite 落地：舞台、角色、道具引用三张子表。
 *
 * 从 `SqliteProjectStore` 外提的轴是语义的，不只为 G1 行数预算：
 * `projects / nodes / edges` 是工程的正文，`project_scenes / project_roles /
 * project_asset_refs` 是挂在正文上的三种引用，各有各的增删口与失败语义。
 * 正文侧仍然是 bundle 的装配处——它把这里的一次 `loadLinks` 合并进 ProjectBundle，
 * 所以调用方看到的仍是一份工程，两张读路径不会各自漂移。
 */

import type {
  AssetRefInput,
  ProjectSceneInput,
  StorageResult,
  StoredAssetRef,
  StoredRole,
  StoredScene,
} from "../types";
import { err, ok } from "../types";
import type { SqlBackend } from "./backend";
import { nowIso, uuid } from "./rows";

/** 工程束里由本模块负责的那三段 */
export interface ProjectLinks {
  readonly scenes: readonly StoredScene[];
  readonly roles: readonly StoredRole[];
  readonly assetRefs: readonly StoredAssetRef[];
}

export class SqliteProjectLinkStore {
  constructor(private readonly backend: SqlBackend) {}

  /** 一次读齐三段：顺序即工程束里的顺序（道具引用那段注释说明了为什么必须有序） */
  async loadLinks(projectId: string): Promise<StorageResult<ProjectLinks>> {
    try {
      const sceneRows = await this.backend.select<{
        id: string; title: string; description: string | null; location: string | null;
        atmosphere: string | null; scene_ref_id: string | null; source: string | null;
        sort_order: number;
      }>(
        `SELECT id, title, description, location, atmosphere, scene_ref_id, source, sort_order
         FROM project_scenes WHERE project_id = ? ORDER BY sort_order, id`,
        [projectId],
      );
      const roleRows = await this.backend.select<{ id: string; character_ref_id: string }>(
        `SELECT id, character_ref_id FROM project_roles WHERE project_id = ?`,
        [projectId],
      );
      /**
       * 道具引用。`ORDER BY created_at, id` 不是装饰：没有 ORDER BY 时 SQLite 按
       * 页布局返回行，同一份数据在"刚写完"与"重启后"可能给出不同顺序——
       * 而剪辑台侧栏把这个顺序直接当成道具列表的顺序。
       */
      const refRows = await this.backend.select<{
        id: string; asset_type: string; asset_id: string;
      }>(
        `SELECT id, asset_type, asset_id FROM project_asset_refs
         WHERE project_id = ? ORDER BY created_at, id`,
        [projectId],
      );
      return ok({
        scenes: sceneRows.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description ?? "",
          location: s.location,
          atmosphere: s.atmosphere,
          sceneRefId: s.scene_ref_id,
          source: (s.source ?? "inline") as StoredScene["source"],
          sortOrder: Number(s.sort_order) || 0,
        })),
        roles: roleRows.map((r) => ({ id: r.id, characterRefId: r.character_ref_id })),
        assetRefs: refRows.map((r) => ({
          id: r.id,
          projectId,
          assetType: r.asset_type as StoredAssetRef["assetType"],
          assetId: r.asset_id,
        })),
      });
    } catch (cause) {
      return err({ code: "io", detail: "loadLinks 查询失败", cause });
    }
  }

  async addProjectScene(
    id: string,
    scene: ProjectSceneInput,
  ): Promise<StorageResult<{ id: string }>> {
    try {
      const exists = await this.backend.select<{ id: string }>(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!exists.length) return err({ code: "not_found", entity: "project", id });
      const sceneId = uuid();
      await this.backend.execute(
        `INSERT INTO project_scenes
         (id, project_id, title, sort_order, description, location, atmosphere, scene_ref_id, source)
         VALUES (?, ?, ?,
           (SELECT COUNT(*) FROM project_scenes WHERE project_id = ?), ?, ?, ?, ?, ?)`,
        [
          sceneId, id, scene.title, id,
          scene.description ?? "", scene.location ?? null, scene.atmosphere ?? null,
          scene.sceneRefId ?? null, scene.source ?? "inline",
        ],
      );
      return ok({ id: sceneId });
    } catch (cause) {
      return err({ code: "io", detail: "addProjectScene 失败", cause });
    }
  }

  async removeProjectScene(
    id: string,
    sceneId: string,
  ): Promise<StorageResult<void>> {
    try {
      // 本地 project_nodes.stage_id 没有 FK 约束，PG 的 ON DELETE SET NULL
      // 必须在删行之前显式兑现，否则删一次舞台就把节点挂到不存在的 stage_id 上。
      await this.backend.execute(
        `UPDATE project_nodes SET stage_id = NULL WHERE project_id = ? AND stage_id = ?`,
        [id, sceneId],
      );
      const removed = await this.backend.execute(
        `DELETE FROM project_scenes WHERE id = ? AND project_id = ?`,
        [sceneId, id],
      );
      if (!removed.rowsAffected) {
        return err({ code: "not_found", entity: "scene", id: sceneId });
      }
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "removeProjectScene 失败", cause });
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

  /** 一次裸 INSERT，不去重——语义跟着后端 `add_asset_ref` 走（理由见契约注释） */
  async addAssetRef(
    id: string,
    ref: AssetRefInput,
  ): Promise<StorageResult<{ id: string }>> {
    try {
      const exists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!exists.length) return err({ code: "not_found", entity: "project", id });
      const refId = uuid();
      await this.backend.execute(
        `INSERT INTO project_asset_refs (id, project_id, asset_type, asset_id, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [refId, id, ref.assetType, ref.assetId, nowIso()],
      );
      return ok({ id: refId });
    } catch (cause) {
      return err({ code: "io", detail: "addAssetRef 失败", cause });
    }
  }

  async removeAssetRef(id: string, refId: string): Promise<StorageResult<void>> {
    try {
      const removed = await this.backend.execute(
        `DELETE FROM project_asset_refs WHERE project_id = ? AND id = ?`,
        [id, refId],
      );
      return removed.rowsAffected > 0
        ? ok(undefined)
        : err({ code: "not_found", entity: "asset_ref", id: refId });
    } catch (cause) {
      return err({ code: "io", detail: "removeAssetRef 失败", cause });
    }
  }
}
