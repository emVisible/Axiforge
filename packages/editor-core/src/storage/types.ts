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
  AssetRefInput,
  CreateProjectInput,
  LocalSaveSlot,
  NarrativePayload,
  ProjectBundle,
  ProjectMeta,
  ProjectMetaPatch,
  ProjectSceneInput,
  SaveSlotInput,
  StoredAchievement,
  StoredAssetItem,
  StoredAssetScene,
  StoredCharacter,
  StoredStory,
  UnlockedAchievement,
  VisibilityScope,
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

  /**
   * 工程内舞台的新增（剪辑台「+ 新舞台」「从舞台库导入」）。
   * id 由实现分配并回传——调用方拿它去挂节点，不让客户端猜。
   * 除 title 外的字段都为可选：本地列集合与远端一致地补齐了导入要用的那几个，
   * 但 parent_scene_id / created_at 这类仍只在远端存在。
   */
  addProjectScene(
    id: string,
    scene: ProjectSceneInput,
  ): Promise<StorageResult<{ id: string }>>;

  /** 删舞台不删节点：节点只是不再归属任何舞台（对齐 PG `stage_id ON DELETE SET NULL`） */
  removeProjectScene(
    id: string,
    sceneId: string,
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

  /**
   * 工程内新增道具引用（剪辑台侧栏「加入道具」）。
   * 与 addRole 不同：**不做去重**——后端 `add_asset_ref` 就是一次裸 INSERT，
   * 同一件道具加两次会真的留下两条引用。契约在这里跟着后端，而不是替它做"更聪明"的判断，
   * 否则两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项却没人解释为什么。
   */
  addAssetRef(
    id: string,
    ref: AssetRefInput,
  ): Promise<StorageResult<{ id: string }>>;

  /**
   * 移除引用。后端对不存在的 ref 返回 404，所以这里也是 `not_found`，不做幂等吞掉——
   * 吞掉会把"点错了行"报成"已经删好了"，而它其实什么都没删。
   * 一处刻意的差别：后端 `remove_asset_ref` 只按 ref_id 删、不校验它属于哪个工程；
   * 本地实现按 (project_id, ref_id) 删。跨工程删别人的引用在任何一端都不该是可用能力。
   */
  removeAssetRef(
    id: string,
    refId: string,
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
