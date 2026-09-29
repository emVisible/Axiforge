/**
 * 存储态记录形态：全局资产池（道具 / 场景）、运行时状态（存档 / 成就）与工程域字段表。
 *
 * 从 types.ts 拆出的原因：契约本体（StorageProvider）要一眼读完，
 * 而这些字段表属于「查表型」内容；同文件时契约被推到 400 行开外（G1 棘轮）。
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

// ------------------------------------------------------------
// 工程域记录形态（自 types.ts 同轴外提，仍由契约文件再导出）
// ------------------------------------------------------------

// ------------------------------------------------------------
// 记录形态（存储态；与传输态 DTO、使用态 Draft 三者解耦）
// ------------------------------------------------------------

export interface ProjectMeta {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly isPublic: boolean;
  /**
   * 云端本有的工程元数据，v0.8 起本地表同批补齐（宪章 Phase 7）。
   * 一律必填：缺失≠空串/空数组，五义在契约一处定死。
   */
  readonly description: string;
  readonly coverImage: string | null;
  readonly themeTags: readonly string[];
  readonly mechanism: string | null;
  readonly genre: string | null;
  readonly isMeta: boolean;
  /**
   * 世界观与规则正文：云端本有列，且 `world_setting` 会进编译器、
   * 在玩家页设定面板显示——缺席它，桌面态那一栏就是永久空白。
   */
  readonly worldSetting: string | null;
  readonly rules: string | null;
}

export interface StoredNode {
  readonly id: string;
  readonly stageId: string | null;
  readonly editorData: Record<string, unknown>; // 含 position
  readonly narrativeData: Record<string, unknown>; // 含 script: Instruction[]（JSON 列）
  readonly sortOrder: number;
}

export interface StoredEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label: string | null;
}

export interface StoredRole {
  readonly id: string;
  readonly characterRefId: string;
}

/**
 * 工程内的资产引用（目前只有道具）。它只记"引用了什么"，不复制资产数据——
 * 与后端 `project_asset_refs` 同构：删资产不会把引用一起带走，所以读侧要能容忍悬空。
 */
export interface StoredAssetRef {
  readonly id: string;
  readonly projectId: string;
  readonly assetType: "item";
  readonly assetId: string;
}

/** 新增引用的入参：id 由实现分配并回传，调用方不得自己猜 */
export interface AssetRefInput {
  readonly assetType: "item";
  readonly assetId: string;
}

export interface ProjectBundle {
  readonly meta: ProjectMeta;
  readonly axsSource: string | null;
  readonly nodes: readonly StoredNode[];
  readonly edges: readonly StoredEdge[];
  readonly scenes: readonly StoredScene[];
  readonly roles: readonly StoredRole[];
  readonly assetRefs: readonly StoredAssetRef[];
}

/** 一次原子叙事保存（nodes/edges/axs_source 同批提交，对应后端 sync 语义） */
export interface NarrativePayload {
  readonly axsSource: string | null;
  readonly nodes: readonly StoredNode[];
  readonly edges: readonly StoredEdge[];
}

export interface StoredCharacter {
  readonly id: string;
  readonly name: string;
  readonly characterData: Record<string, unknown>; // 六层模型 JSON（ADR-001）
  readonly imagePath: string | null;
  /** 显式字段而非可选：缺失≠false，五义在此一处定死 */
  readonly isPublic: boolean;
  readonly authorId: string | null;
}

/**
 * 全局资产池三兄弟（角色 / 道具 / 场景）的共同形状：
 * filterByVisibility 只依赖这四个字段，故一处约束而非三处复制。
 */
export interface VisibleRecord {
  readonly id: string;
  readonly name: string;
  readonly isPublic: boolean;
  readonly authorId: string | null;
}

/**
 * 可见范围。语义 = 「我的（给 authorId 时）∪ 公开（includePublic 时）」，
 * 两者都不给 = 全部公开（协作服务的默认对外视角）。
 * 角色 / 道具 / 场景共用此一处定义：同一语义不得有两套词汇。
 */
export interface VisibilityScope {
  readonly authorId?: string | null;
  readonly includePublic?: boolean;
  readonly search?: string;
}

/**
 * 工程尚无元数据时的取值，一处定义。
 * 六个空值若在多处各写一遍，「本地新建」与「导入」两条路径就会漂移。
 */
export const emptyProjectMetadata = (): Omit<
  ProjectMeta,
  "id" | "title" | "updatedAt" | "isPublic"
> => ({
  description: "",
  coverImage: null,
  themeTags: [],
  mechanism: null,
  genre: null,
  isMeta: false,
  worldSetting: null,
  rules: null,
});

export interface CreateProjectInput {  readonly title: string;
  readonly isPublic?: boolean;
}

export interface ProjectMetaPatch {
  readonly title?: string;
  readonly axsSource?: string | null;
  readonly description?: string;
  readonly coverImage?: string | null;
  readonly themeTags?: readonly string[];
  readonly mechanism?: string | null;
  readonly genre?: string | null;
  readonly isMeta?: boolean;
  readonly worldSetting?: string | null;
  readonly rules?: string | null;
}
