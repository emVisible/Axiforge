/**
 * v0.8 起新增的记录形态：全局资产池（道具 / 场景）与运行时状态（存档 / 成就）。
 *
 * 从 types.ts 拆出的原因：契约本体（StorageProvider）要一眼读完，
 * 而四个新域的字段表属于「查表型」内容；同文件时契约被推到 400 行开外。
 * 仍由 types.ts 再导出，消费方 import 路径不变。
 */

/**
 * 工程内的舞台（`project_scenes` 行）。
 *
 * 除 id/title 外的字段全部可选，是因为**远端与本地的列集合不同**：
 * 后端还有 parent_scene_id / created_at 等，本地只补齐了导入通路要用的那几个。
 * 可选不等于可以随手丢——读路径能给出就必须给出（见 `storage/index.ts` 的适配器），
 * 否则「从舞台库导入」在桌面上会变成写进去读不回来的静默降级。
 */
export interface StoredScene {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly location?: string | null;
  readonly atmosphere?: string | null;
  /** 指向全局资产池 asset_scenes.id；inline 舞台为 null */
  readonly sceneRefId?: string | null;
  readonly source?: "inline" | "reference" | "locked";
  readonly sortOrder?: number;
}

/** addProjectScene 的入参：id 由实现分配，故不在这里出现 */
export type ProjectSceneInput = Omit<StoredScene, "id"> & { readonly title: string };

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

/**
 * 角色传记（Phase 13 S13-1）。它属于**创作主数据**而非云社交功能，
 * 所以后端退场后必须有本地实现，否则「角色没有传记」＝功能消失。
 * 与 `ProjectMeta` 同一裁决：只保留本地真实存在的字段，
 * 服务端的 `created_at` 不进契约（列表与编辑态都只消费 `updatedAt`），
 * 留空位比多一个无人使用的字段诚实。
 */
export interface StoredStory {
  readonly id: string;
  readonly characterId: string;
  readonly title: string;
  readonly content: string;
  /** 由实现方从 content 计算，不接受调用方传入——避免两份字数互相说谎 */
  readonly wordCount: number;
  readonly sortOrder: number;
  readonly updatedAt: string;
}

/**
 * 字数规则逐字继承 `backend/app/domains/character/story_service.py:15`
 * （换行转空格后按空白切分计数）。它对中文会严重低估——但三个实现各算一套更糟，
 * 要改就连后端一起改。放这里是因为 Memory 与 SQLite 都是它的消费者，
 * 任何一方依赖另一方都会让两个实现之间长出耦合。
 */
export function storyWordCount(content: string): number {
  if (!content) return 0;
  return content.replace(/\n/g, " ").split(/\s+/).filter(Boolean).length;
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