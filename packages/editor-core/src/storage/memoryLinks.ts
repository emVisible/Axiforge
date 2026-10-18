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
    // 排序号的规则（2026-10-01 复审）：**给了就照给，没给才算下一个**。
    // 此前 Memory 原样存调用方的值，于是不传时留下 `undefined`（读回是 `null`），
    // 而 SQLite 恒给 `COUNT(*)` ⇒ 同一份契约在两端读回不同：
    // 实测三个舞台，Memory `[null,null,null]` / SQLite `[0,1,2]`。
    // Memory 不是生产路径（只有 DEV 的 `?storage=memory`），但**契约套件跑的就是它**——
    // 一个在测试宿主上顺序不同、对桌面又绿的排序，是最难查的那类偏差。
    // 顺带收掉 SQLite 那一侧的契约违反：`ProjectSceneInput = Omit<StoredScene, "id">`
    // 声明了 `sortOrder`，而 SQLite 原先硬编码 `COUNT(*)` 把它整个忽略（生产路径，
    // `.axsp` 导入显式传的就是它）。分母：随包三份 `.axsp` 的 `sortOrder` 全是 `null`
    // ⇒ 现有内容零影响，所以这条改动是纯"让实现兑现声明"。
    const wanted = scene.sortOrder;
    const sortOrder =
      typeof wanted === "number" && Number.isFinite(wanted) ? wanted : this.rowOf(id)!.scenes.length;
    row.scenes = [...row.scenes, { ...scene, id: sceneId, sortOrder }];
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
    // 对不存在的 role 报 not_found，不做幂等吞掉——2026-10-01 复审。
    // 依据是**后端已经这么实现**（`router.py::remove_role` 在 `remove_role()` 返回假时抛 404，
    // HTTP provider 原样转成本地错误码），所以原先这里是本地两端与后端的三方分歧：
    // Memory 与 SQLite 都报 ok，而浏览器态会拿到 not_found。
    // 理由与 `removeAssetRef` 同源（见 `types.ts` 里那行注释）：吞掉会把"点错了行"
    // 报成"已经删好了"，而它其实什么都没删——`CutWorkspace` 的成功 toast 就是这句话。
    // 同族另外两个 remove（`removeProjectScene` / `removeAssetRef`）本来就报 not_found。
    if (!row.roles.some((r) => r.id === roleId)) {
      return err({ code: "not_found", entity: "role", id: roleId });
    }
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
