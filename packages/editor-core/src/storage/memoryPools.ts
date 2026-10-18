/**
 * MemoryStorageProvider 的资产池与运行时状态域（道具 / 场景 / 存档 / 成就）。
 *
 * 与 SQLite 侧的 assetPool / runtimeLocal 对应：同一个契约域在两端各自成模块，
 * 便于「新增一个域」始终只动一处，而不是把 Provider 重新长成巨石。
 * 键语义刻意与 SQLite 一致（存档按 project×token×slot 三元组、解锁按 key 不按 id）。
 */

import { filterByVisibility } from "./visibility";
import type {
  LocalSaveSlot,
  SaveSlotInput,
  StoredAchievement,
  StoredAssetItem,
  StoredAssetScene,
  StorageResult,
  UnlockedAchievement,
  VisibilityScope,
} from "./types";
import { err, ok } from "./types";

export class MemoryPools {
  constructor(
    private readonly hasProject: (id: string) => boolean,
    private readonly nextId: (prefix: string) => string,
  ) {}

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

  async listItems(scope?: VisibilityScope): Promise<StorageResult<StoredAssetItem[]>> {
    // 按 `updatedAt` 降序——2026-10-01 复审。SQLite 那一侧的 `listItems` 是
    // `ORDER BY updated_at DESC`（`sqlite/assetPool.ts`），而这里原先直接给插入序，
    // 于是「存 A、存 B、再改 B」读回来是 `["A","B改"]` / `["B改","A"]` 两端不同。
    // 同一个文件里的 `saveItem` 会刷新 `updatedAt`，所以这个顺序就是"最近动过的在前"。
    // 照抄 `memory.ts::listProjects` 的比较器而不是另发明一个：**那个方法早就为对齐 SQLite
    // 而特意排过序**（"两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项"那条裁决的同类），
    // 这里只是同一意图漏了两处。`Array#sort` 稳定、SQLite 对并列行序未定义，
    // 所以 `updatedAt` 撞在一起时两端仍可能不同——与 `listProjects` 是同一个已知限度，不额外加 tiebreaker。
    return ok(
      filterByVisibility([...this.items.values()], scope).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
  }

  async saveItem(item: StoredAssetItem): Promise<StorageResult<{ id: string }>> {
    const id = item.id || this.nextId("item");
    this.items.set(id, { ...item, id, updatedAt: new Date().toISOString() });
    return ok({ id });
  }

  async getItem(id: string): Promise<StorageResult<StoredAssetItem>> {
    const hit = this.items.get(id);
    return hit ? ok(hit) : err({ code: "not_found", entity: "item", id });
  }

  async deleteItem(id: string): Promise<StorageResult<void>> {
    return this.items.delete(id)
      ? ok(undefined)
      : err({ code: "not_found", entity: "item", id });
  }

  async listScenes(scope?: VisibilityScope): Promise<StorageResult<StoredAssetScene[]>> {
    // 同 `listItems`：SQLite 是 `ORDER BY updated_at DESC`，这里原先给插入序。
    // 两条注释合并读——理由、权威与已知限度都在上面那一条里。
    return ok(
      filterByVisibility([...this.scenes.values()], scope).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
  }

  async saveScene(scene: StoredAssetScene): Promise<StorageResult<{ id: string }>> {
    const id = scene.id || this.nextId("scene");
    this.scenes.set(id, { ...scene, id, updatedAt: new Date().toISOString() });
    return ok({ id });
  }

  async getScene(id: string): Promise<StorageResult<StoredAssetScene>> {
    const hit = this.scenes.get(id);
    return hit ? ok(hit) : err({ code: "not_found", entity: "scene", id });
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
    if (!this.hasProject(projectId)) {
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
    if (!this.hasProject(projectId)) {
      return err({ code: "not_found", entity: "project", id: projectId });
    }
    const row = { ...achievement, id: achievement.id || this.nextId("ach") };
    // 对齐 SQLite 的 `UNIQUE (project_id, akey)`（2026-10-01 复审）。
    // 原先这里只按 id upsert，于是「换一个 id、但 key 相同」的第二条定义照收不误，
    // 实测同一 `key` 连写两次：Memory 两次 ok、读回**两条同 key**（成就面板会显示重复项，
    // 而 `unlockAchievement` 按 key 只解得到其中一条 ⇒ 另一条永远点不亮）；
    // SQLite 第二次 `io`、读回一条。两端语义必须一致，所以按 SQLite 那侧对齐。
    // **同 id 是更新、不算冲突**——`saveAchievement` 的语义是按 id upsert，
    // 而 `updateAchievement`（achievementDefs.ts）会先取回当前定义再合并补丁，key 不变。
    // 分母：面板用 `ach_${Date.now().toString(36)}` 生成 key ⇒ 活路径不产生重复
    // （同一毫秒连点才可能），所以这条是**潜在**的，值在把两端口径钉进契约套件。
    for (const [id, existing] of this.achievements) {
      if (id === row.id) continue;
      if (this.achievementProject.get(id) === projectId && existing.key === row.key) {
        return err({
          code: "io",
          detail: `成就 key 重复：${row.key}（本工程已有另一条定义用它；改用更新那一条）`,
        });
      }
    }
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
}
