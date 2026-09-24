/**
 * v0.8 起新增的记录形态：全局资产池（道具 / 场景）与运行时状态（存档 / 成就）。
 *
 * 从 types.ts 拆出的原因：契约本体（StorageProvider）要一眼读完，
 * 而四个新域的字段表属于「查表型」内容；同文件时契约被推到 400 行开外。
 * 仍由 types.ts 再导出，消费方 import 路径不变。
 */

/**
 * 全局资产池三兄弟（角色 / 道具 / 场景）的共同形状：
 * filterByVisibility 只依赖这四个字段，故一处约束而非三处复制。
 */

export interface StoredAssetItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly rarity: string;
  readonly mechanismTags: readonly string[];
  readonly effects: readonly string[];
  readonly imagePath: string | null;
  readonly isPublic: boolean;
  readonly authorId: string | null;
  readonly updatedAt: string;
}

export interface StoredAssetScene {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly location: string | null;
  readonly atmosphere: string | null;
  readonly era: string | null;
  readonly worldSetting: string | null;
  readonly rules: string | null;
  readonly tags: readonly string[];
  readonly nodeTemplates: readonly Record<string, unknown>[];
  readonly imagePath: string | null;
  readonly isPublic: boolean;
  readonly authorId: string | null;
  readonly updatedAt: string;
}

/** 玩家身份：匿名 token，跨重启稳定（不是账号） */
export interface LocalSaveSlot {
  readonly slot: number;
  readonly state: Record<string, unknown>;
  readonly summary: string | null;
  readonly beatId: string | null;
  /** 本地素材 ref，交给 resolveAssetUrl 显示；非后端 thumb_path */
  readonly thumbRef: string | null;
  readonly updatedAt: string;
}

export interface SaveSlotInput {
  readonly slot?: number;
  readonly state: Record<string, unknown>;
  readonly summary?: string | null;
  readonly beatId?: string | null;
  readonly thumbRef?: string | null;
}

/** 成就定义：per project（backend ginkgo/models.py） */
export interface StoredAchievement {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly condition: Record<string, unknown>;
}

/** 已解锁记录按 key 关联，不按 id：重导入工程会产生新 id，key 才是稳定语义 */
export interface UnlockedAchievement {
  readonly key: string;
  readonly unlockedAt: string;
}