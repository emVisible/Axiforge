/**
 * 成就定义的运行环境分派口（v0.8 · 宪章 Phase 7 成就域收尾）。
 *
 * 剪辑台的成就面板原先直连 `ginkgoApi`，桌面离线态整块不可用。
 * 与玩家侧存档同一裁决：分派收在一处，页面不写 if，失败一律抛出而非降级成空清单。
 * 本地没有 created_at / 计数列，返回传输态时如实缺席（面板不读这些字段）。
 */

import { ginkgoApi, type AchievementDef } from "@/shared/api/ginkgo";
import { getStorageProvider } from "@/shared/storage";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";
import type { StorageProvider, StoredAchievement } from "@axiforge/editor-core";

/** 注入点：让本地支在 node 测试环境下可达（同 playerSaves 的理由） */
export const achievementDeps: {
  isLocal: () => boolean;
  provider: () => Promise<StorageProvider>;
} = {
  isLocal: isTauriEnvironment,
  provider: getStorageProvider,
};

export interface AchievementDraft {
  key: string;
  title: string;
  description: string;
  icon: string;
  condition: Record<string, unknown>;
}

const toDef = (a: StoredAchievement, projectId: string): AchievementDef => ({
  id: a.id,
  project_id: projectId,
  key: a.key,
  title: a.title,
  description: a.description,
  icon: a.icon,
  condition: a.condition,
  is_public: false,
  created_at: "",
  updated_at: "",
});

const toStored = (d: AchievementDraft): StoredAchievement => ({
  id: "",
  key: d.key,
  title: d.title,
  description: d.description,
  icon: d.icon,
  condition: d.condition,
});

export async function listAchievements(projectId: string): Promise<AchievementDef[]> {
  if (!achievementDeps.isLocal()) return (await ginkgoApi.list(projectId)).items ?? [];
  const r = await achievementDeps.provider().then((p) => p.listAchievements(projectId));
  if (!r.ok) throw new Error(`成就清单读取失败：${r.error.code}`);
  return r.data.map((a) => toDef(a, projectId));
}

export async function createAchievement(
  projectId: string,
  draft: AchievementDraft,
): Promise<void> {
  if (!achievementDeps.isLocal()) {
    await ginkgoApi.create(projectId, {
      key: draft.key,
      title: draft.title,
      description: draft.description,
      icon: draft.icon,
      condition: draft.condition,
    });
    return;
  }
  const p = await achievementDeps.provider();
  const r = await p.saveAchievement(projectId, toStored(draft));
  if (!r.ok) throw new Error(`成就创建失败：${r.error.code}`);
}

/** 本地 upsert 需要整条记录，故先取回当前定义再合补丁 */
export async function updateAchievement(
  projectId: string,
  item: AchievementDef,
  patch: Partial<AchievementDef>,
): Promise<void> {
  if (!achievementDeps.isLocal()) {
    await ginkgoApi.update(item.id, patch);
    return;
  }
  const p = await achievementDeps.provider();
  const r = await p.saveAchievement(projectId, {
    id: item.id,
    key: patch.key ?? item.key,
    title: patch.title ?? item.title,
    description: patch.description ?? item.description,
    icon: patch.icon ?? item.icon,
    condition: patch.condition ?? item.condition,
  });
  if (!r.ok) throw new Error(`成就保存失败：${r.error.code}`);
}

export async function deleteAchievement(
  projectId: string,
  id: string,
): Promise<void> {
  if (!achievementDeps.isLocal()) {
    await ginkgoApi.remove(id);
    return;
  }
  const p = await achievementDeps.provider();
  const r = await p.deleteAchievement(projectId, id);
  if (!r.ok) throw new Error(`成就删除失败：${r.error.code}`);
}
