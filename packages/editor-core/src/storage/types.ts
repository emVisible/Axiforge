/**
 * L4 存取契约（KERNEL_DESIGN §2.5）——失败语义显式的存储抽象。
 *
 * 设计裁决：
 * - 一切方法返回 StorageResult 判别联合，禁止异常穿越内核边界
 * - 空值五义显式区分（axiom 第三部 1.4）：不存在=not_found；解析失败=corrupted；
 *   磁盘/网络故障=io；字段缺失=领域内 null；空集合=合法空数组
 * - 重试/提示是调用方（L5）的策略；Provider 只如实报告失败
 * - 契约测试套件（storage/contract.test.ts）是一切实现的验收标准：
 *   Memory / HTTP / SQLite 实现都必须全绿
 */

import type { Instruction, Condition, Effect } from "@axiforge/core";

// ------------------------------------------------------------
// 结果与错误
// ------------------------------------------------------------

export type StorageError =
  | { code: "not_found"; entity: string; id: string }
  | { code: "corrupted"; entity: string; id?: string; detail: string; cause?: unknown }
  | { code: "io"; detail: string; cause?: unknown };

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StorageError };

export const ok = <T>(data: T): StorageResult<T> => ({ ok: true, data });
export const err = <T>(error: StorageError): StorageResult<T> => ({
  ok: false,
  error,
});


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

export interface StoredScene {
  readonly id: string;
  readonly title: string;
}

export interface StoredRole {
  readonly id: string;
  readonly characterRefId: string;
}

export interface ProjectBundle {
  readonly meta: ProjectMeta;
  readonly axsSource: string | null;
  readonly nodes: readonly StoredNode[];
  readonly edges: readonly StoredEdge[];
  readonly scenes: readonly StoredScene[];
  readonly roles: readonly StoredRole[];
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

/**
 * 素材字节与落位结果（ADR-024 决策 3：素材是本地文件，DB 只存引用）。
 * ref 形态由实现决定（桌面 `assets/<摘要>.<ext>` / 服务端 `/uploads/...`），
 * 契约只保证：同一内容 → 同一 ref；ref 可 readAsset 回等价字节。
 */
export interface AssetInput {
  readonly name: string;
  readonly mime: string;
  readonly bytes: Uint8Array;
}

export interface StoredAsset {
  readonly ref: string;
  readonly mime: string;
  readonly size: number;
}

/**
 * 素材字节存储端口——由 L5 注入（桌面=Tauri fs，测试=内存 stub）。
 * 存在的原因：摘要算法与文件系统都是平台能力，内核不得持有；
 * 与 SqlBackend 端口同构，不是新的抽象层。
 */
export interface AssetStore {
  write(input: AssetInput): Promise<StorageResult<StoredAsset>>;
  read(ref: string): Promise<StorageResult<Uint8Array>>;
}

import type {
  LocalSaveSlot,
  SaveSlotInput,
  StoredAchievement,
  StoredAssetItem,
  StoredAssetScene,
  StoredStory,
  UnlockedAchievement,
} from "./records";

export * from "./records";

// ------------------------------------------------------------
// 契约
// ------------------------------------------------------------

export interface StorageProvider {
  /** 工程清单（无工程=空数组，非错误） */
  listProjects(): Promise<StorageResult<ProjectMeta[]>>;

  /** 新建工程（引导默认舞台/节点由实现决定，等价于现行 create 语义） */
  createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>>;

  /**
   * 失败语义：不存在→not_found；存储损坏→corrupted；底层故障→io。
   * 成功返回完整 ProjectBundle（含 nodes/edges/scenes/roles）。
   */
  loadProject(id: string): Promise<StorageResult<ProjectBundle>>;

  /** 不存在→not_found */
  deleteProject(id: string): Promise<StorageResult<void>>;

  /** 元信息补丁（标题/axs_source 投影快照） */
  updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>>;

  /** 原子覆写叙事图（Writer 轨保存与剪辑台 saveAll 共用） */
  saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>>;

  /** 重复 characterRefId→duplicate 语义由实现以 io/detail 报告（v0 不单列错误码） */
  addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>>;

  removeRole(
    id: string,
    roleId: string,
  ): Promise<StorageResult<void>>;

  /** 角色清单（范围语义见 VisibilityScope；无匹配=空数组，非错误） */
  listCharacters(scope?: VisibilityScope): Promise<StorageResult<StoredCharacter[]>>;

  getCharacter(id: string): Promise<StorageResult<StoredCharacter>>;

  /**
   * upsert：id 命中既有角色则更新；否则创建并返回服务端分配的 id
   * （HTTP 后端不支持客户端指定 id——契约以返回值为准，调用方不得假设入参 id 生效）
   */
  saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>>;

  /**
   * 写入素材字节并返回可引用 ref（同内容幂等：重复写返回同一 ref）。
   * 失败语义：空字节→io；平台写盘/上传故障→io；mime 不支持由实现以 io/detail 报告。
   * 调用方（L5）负责呈现失败并允许重试——Provider 不弹提示。
   */
  saveAsset(input: AssetInput): Promise<StorageResult<StoredAsset>>;

  /**
   * 按 ref 读回字节（`.axsp` 导出打包与桌面重解析素材用）。
   * 失败语义：ref 非法/含越界→not_found；文件缺失→not_found；读取故障→io。
   */
  readAsset(ref: string): Promise<StorageResult<Uint8Array>>;

  // ---------- 道具（全局资产池，范围语义同角色） ----------

  listItems(scope?: VisibilityScope): Promise<StorageResult<StoredAssetItem[]>>;

  /** upsert，返回权威 id（客户端不得假设入参 id 生效） */
  saveItem(item: StoredAssetItem): Promise<StorageResult<{ id: string }>>;

  /** 不存在→not_found */
  /** 单条读取（不存在→not_found）。有清单读口不等于有单条读口：
   *  缺它时调用方只能「拉全表再 find」，随库增长线性变慢且绕过了 not_found 语义 */
  getItem(id: string): Promise<StorageResult<StoredAssetItem>>;

  deleteItem(id: string): Promise<StorageResult<void>>;

  // ---------- 场景（全局资产池） ----------

  listScenes(scope?: VisibilityScope): Promise<StorageResult<StoredAssetScene[]>>;

  saveScene(scene: StoredAssetScene): Promise<StorageResult<{ id: string }>>;

  getScene(id: string): Promise<StorageResult<StoredAssetScene>>;

  deleteScene(id: string): Promise<StorageResult<void>>;

  // ---------- 角色传记（创作主数据，Phase 13 S13-1） ----------

  /** 按 sortOrder 升序返回该角色的全部传记；角色不存在时返回空清单而非 not_found */
  listStories(characterId: string): Promise<StorageResult<StoredStory[]>>;

  /** upsert，返回权威 id；wordCount 由实现方从 content 重算，入参值不采信 */
  saveStory(story: StoredStory): Promise<StorageResult<{ id: string }>>;

  /** 归属即隔离：跨角色拿别人的传记 id 读，按 not_found 处理，不做「知道 id 就能读」 */
  getStory(characterId: string, id: string): Promise<StorageResult<StoredStory>>;

  /** 不存在→not_found。返回值 void，不静默吞删除失败 */
  deleteStory(characterId: string, id: string): Promise<StorageResult<void>>;

  // ---------- 运行时存档（per project × playerToken × slot） ----------

  listSaves(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<LocalSaveSlot[]>>;

  /** 该槽从未写过→not_found（区别于「内容为空」） */
  getSave(
    projectId: string,
    playerToken: string,
    slot?: number,
  ): Promise<StorageResult<LocalSaveSlot>>;

  /** 覆写式 upsert：同一 (project, token, slot) 后写覆盖前写 */
  writeSave(
    projectId: string,
    playerToken: string,
    input: SaveSlotInput,
  ): Promise<StorageResult<LocalSaveSlot>>;

  /** 删不存在的槽→not_found */
  clearSave(
    projectId: string,
    playerToken: string,
    slot?: number,
  ): Promise<StorageResult<void>>;

  // ---------- 成就（定义 per project；解锁记录 per playerToken） ----------

  listAchievements(projectId: string): Promise<StorageResult<StoredAchievement[]>>;

  saveAchievement(
    projectId: string,
    achievement: StoredAchievement,
  ): Promise<StorageResult<StoredAchievement>>;

  deleteAchievement(
    projectId: string,
    id: string,
  ): Promise<StorageResult<void>>;

  /** 幂等：重复解锁不产生第二条记录、不改变 unlockedAt */
  unlockAchievement(
    projectId: string,
    playerToken: string,
    key: string,
  ): Promise<StorageResult<void>>;

  listUnlocked(
    projectId: string,
    playerToken: string,
  ): Promise<StorageResult<UnlockedAchievement[]>>;
}

// ------------------------------------------------------------
// 便捷守卫（L5 消费用）
// ------------------------------------------------------------

export const isStorageFailure = <T>(
  r: StorageResult<T>,
): r is { ok: false; error: StorageError } => !r.ok;

/** IR 相关类型再导出：存储态 narrativeData 内的 script 元素形状 */
export type { Instruction, Condition, Effect };
