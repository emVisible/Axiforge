/**
 * MemoryStorageProvider 的挂接域：工程上的舞台 / 角色 / 道具引用三张表。
 *
 * 与 SQLite 侧的 `sqliteProjectLinks.ts` 同轴拆分——同一个契约域在两端各自成模块，
 * 「新增一个域」因此只动一处，而不是把 Provider 重新长成巨石（memoryPools 的先例）。
 * 行形状用结构化参数注入而不是 import memory.ts：内核包不得出现循环依赖（check:circular）。
 */

import type {
  AssetRefInput,
  ProjectSceneInput,
  StorageResult,
  StoredAssetRef,
  StoredNode,
  StoredRole,
  StoredScene,
} from "./types";
import { err, ok } from "./types";

/** 挂接域要读写的行内栏位（`ProjectRow` 的结构子集，由 Provider 提供） */
export interface MemoryLinkRow {
  scenes: StoredScene[];
  roles: StoredRole[];
  assetRefs: StoredAssetRef[];
  nodes: Map<string, StoredNode>;
}

export class MemoryLinks {
  constructor(
    private readonly rowOf: (id: string) => MemoryLinkRow | undefined,
    private readonly nextId: (prefix: string) => string,
  ) {}

  async addProjectScene(
    id: string,
    scene: ProjectSceneInput,
  ): Promise<StorageResult<{ id: string }>> {
    const row = this.rowOf(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    const sceneId = this.nextId("scene");
    row.scenes = [...row.scenes, { ...scene, id: sceneId }];
    return ok({ id: sceneId });
  }

  async removeProjectScene(id: string, sceneId: string): Promise<StorageResult<void>> {
    const row = this.rowOf(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    if (!row.scenes.some((s) => s.id === sceneId)) {
      return err({ code: "not_found", entity: "scene", id: sceneId });
    }
    row.scenes = row.scenes.filter((s) => s.id !== sceneId);
    // 删舞台不删节点：节点只是不再归属任何舞台（对齐 PG 的 ON DELETE SET NULL）
    row.nodes = new Map(
      [...row.nodes].map(([k, n]) => [k, n.stageId === sceneId ? { ...n, stageId: null } : n]),
    );
    return ok(undefined);
  }

  async addRole(id: string, role: { characterRefId: string }): Promise<StorageResult<void>> {
    const row = this.rowOf(id);
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
    const row = this.rowOf(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    row.roles = row.roles.filter((r) => r.id !== roleId);
    return ok(undefined);
  }

  /** 不去重：一次调用留一行，与后端 `add_asset_ref` 的裸 INSERT 同语义 */
  async addAssetRef(id: string, ref: AssetRefInput): Promise<StorageResult<{ id: string }>> {
    const row = this.rowOf(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    const refId = this.nextId("asset-ref");
    row.assetRefs = [
      ...row.assetRefs,
      { id: refId, projectId: id, assetType: ref.assetType, assetId: ref.assetId },
    ];
    return ok({ id: refId });
  }

  async removeAssetRef(id: string, refId: string): Promise<StorageResult<void>> {
    const row = this.rowOf(id);
    if (!row) return err({ code: "not_found", entity: "project", id });
    if (!row.assetRefs.some((r) => r.id === refId)) {
      return err({ code: "not_found", entity: "asset_ref", id: refId });
    }
    row.assetRefs = row.assetRefs.filter((r) => r.id !== refId);
    return ok(undefined);
  }
}
