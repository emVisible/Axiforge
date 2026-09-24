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
