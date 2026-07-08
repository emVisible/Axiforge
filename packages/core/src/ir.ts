/**
 * Narrative IR — 与渲染端无关的叙事中间表示（ADR-008 / ADR-009）
 *
 * 一个项目编译为一份可移植的 StoryPackage：
 *   StoryPackage → Beat（桥段，Flow 层）→ Instruction[]（演出脚本，Script 层）
 *
 * 该文件是 IR 的唯一 TS 真相源；后端编译器产出的 JSON 必须与之一致。
 */

// ============================================================
// 条件 / 效果（语义详见 conditions.ts）
// ============================================================

export type ConditionSourceType =
  | "memory"
  | "flag"
  | "character_state"
  | "node_completed"
  | "codex";

export type ComparisonOperator = "eq" | "ne" | "gt" | "lt" | "contains";

/** 跨作品 IP 账本（桥4 第三层）：characterRefId → { key: value } */
export type CodexLedger = Record<string, Record<string, unknown>>;

export function emptyCodex(): CodexLedger {
  return {};
}

export function cloneCodex(codex: CodexLedger): CodexLedger {
  return Object.fromEntries(
    Object.entries(codex).map(([charId, entries]) => [
      charId,
      { ...entries },
    ]),
  );
}

/** 单条原子条件 */
export interface AtomCondition {
  type: ConditionSourceType;
  key?: string;
  operator?: ComparisonOperator;
  value?: unknown;
}

export type ConditionGroupType = "all" | "any" | "none";

/** 条件组：{ type: all|any|none, conditions: [...] } */
export interface GroupCondition {
  type: ConditionGroupType;
  conditions: AtomCondition[];
}

/** 条件既可以是单条原子，也可以是一组（兼容 v1.0 两种格式） */
export type Condition = AtomCondition | GroupCondition;

export type EffectType = "memory" | "flag" | "character_state" | "codex_write";

/** 完成一个 Beat 时应用的效果 */
export interface Effect {
  type: EffectType;
  key: string;
  value: unknown;
}

// ============================================================
// 演出指令集 v0（8 条，ADR-009）
// ============================================================

export type Position = "left" | "center" | "right" | string;

/** 说话 / 旁白——暂停点，等玩家继续 */
export interface SayInstruction {
  op: "say";
  /** 说话角色 id（引用 StoryPackage.characters）；缺省为旁白 */
  characterId?: string | null;
  /** 覆盖显示名（缺省用角色名） */
  speaker?: string | null;
  text: string;
  /** 语音资产 id（v1.3 起启用） */
  voice?: string | null;
  /** 是否按富文本/ruby 语法解析（v1.3） */
  rich?: boolean;
}

/** 旁白——暂停点。语义等同无角色的 say，但独立 op 便于分轨与富文本（v1.3） */
export interface NarrationInstruction {
  op: "narration";
  text: string;
  voice?: string | null;
  rich?: boolean;
}

/** 立绘进场 */
export interface ShowInstruction {
  op: "show";
  characterId: string;
  expression?: string;
  position?: Position;
  /** 进场转场（v1.3 扩展；v0 可空） */
  transition?: string | null;
}

/** 立绘退场 */
export interface HideInstruction {
  op: "hide";
  characterId: string;
  transition?: string | null;
}

/** 立绘移动——把已在场的立绘平移到新位置（v1.3） */
export interface MoveInstruction {
  op: "move";
  characterId: string;
  position: Position;
  /** 动画时长（ms），0/缺省为瞬移 */
  ms?: number;
}

/** 镜头运动（v1.3）：缩放 / 平移 / 震屏 / 复位 */
export type CameraAction = "zoom" | "pan" | "shake" | "reset";
export interface CameraInstruction {
  op: "camera";
  action: CameraAction;
  /** zoom：缩放倍数（1 = 原始） */
  scale?: number;
  /** pan：目标偏移，单位为舞台百分比（-100..100） */
  x?: number;
  y?: number;
  /** shake：震动强度（像素） */
  intensity?: number;
  ms?: number;
}

/** 画面转场特效（v1.3） */
export type TransitionKind = "fade" | "dissolve" | "wipe" | "cut";
export interface TransitionInstruction {
  op: "transition";
  kind: TransitionKind;
  ms?: number;
}

/** 全屏氛围特效（v1.3） */
export type FxKind = "flash" | "rain" | "snow" | "sakura" | "none";
export interface FxInstruction {
  op: "fx";
  effect: FxKind;
  ms?: number;
}

/** 语音播放（独立语音通道，v1.3） */
export interface VoiceInstruction {
  op: "voice";
  /** 语音资产 id 或 URL；null 表示停止当前语音 */
  sound: string | null;
}

/** 切换背景 */
export interface BgInstruction {
  op: "bg";
  /** 背景资产 id 或 URL */
  image: string;
  transition?: string | null;
}

/** 背景音乐 */
export interface BgmInstruction {
  op: "bgm";
  /** 音轨资产 id 或 URL；null 表示停止 */
  track: string | null;
  fadeMs?: number;
  loop?: boolean;
}

/** 音效 */
export interface SeInstruction {
  op: "se";
  sound: string;
}

/** 定时等待——渲染器等待后自动 proceed */
export interface WaitInstruction {
  op: "wait";
  ms: number;
}

/** 分支选项——暂停点，等玩家选择 */
export interface ChoiceOption {
  label: string;
  /** 目标 Beat id；缺省表示沿默认转场 */
  to?: string | null;
  /** 选项可见/可选条件；不满足则禁用 */
  condition?: Condition | null;
}

export interface ChoiceInstruction {
  op: "choice";
  options: ChoiceOption[];
}

export type Instruction =
  | SayInstruction
  | NarrationInstruction
  | ShowInstruction
  | HideInstruction
  | MoveInstruction
  | BgInstruction
  | BgmInstruction
  | SeInstruction
  | VoiceInstruction
  | CameraInstruction
  | TransitionInstruction
  | FxInstruction
  | WaitInstruction
  | ChoiceInstruction;

export type InstructionOp = Instruction["op"];

/** 暂停点指令：需要等待外部输入或计时 */
export const PAUSE_OPS: ReadonlySet<InstructionOp> = new Set<InstructionOp>([
  "say",
  "narration",
  "choice",
  "wait",
]);

// ============================================================
// Flow 层：Beat + Transition
// ============================================================

/** Beat 之间的转场（对应 v1.0 的 project_edges） */
export interface Transition {
  from: string;
  to: string;
  /** 分支标签；与 ChoiceOption.label / 边 label 对应 */
  label?: string | null;
}

/** 桥段：Flow 图的一个节点，内含演出脚本（Beat = 关键帧 = 回合，ADR-017） */
export interface Beat {
  id: string;
  /** 舞台 id（原 scene；场景降级为舞台演出属性） */
  sceneId?: string | null;
  sceneTitle?: string | null;
  stage?: string | null;
  /** 本回合参与角色（characterRefId 列表） */
  actors?: string[];
  /** 本回合道具引用 */
  props?: string[];
  /** 进入该 Beat 的触发条件（沿转场推进时评估） */
  trigger?: Condition | null;
  /** 演出脚本序列 */
  script: Instruction[];
  /** 完成时应用的效果 */
  effects?: Effect[];
  /** 结局标记 */
  isEnding?: boolean;
  /** 结局名称（如「真结局」「Bad End」） */
  endingLabel?: string | null;
}

// ============================================================
// 资产引用清单（桥5 逐步填充；v0 允许为空）
// ============================================================

export interface CharacterRef {
  id: string;
  name: string;
  imagePath?: string | null;
  /** 表情 → 资产路径（v1.3 资产管线填充） */
  expressions?: Record<string, string>;
}

/** 术语库条目（SG 式名词解释，v1.4） */
export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
}

/** 角色图鉴档案（方舟式，摘自六层数据，v1.4） */
export interface CharacterProfile {
  id: string;
  name: string;
  imagePath?: string | null;
  summary?: string | null;
  essence?: string | null;
  identity?: string | null;
  appearance?: string | null;
  tags?: string[];
}

export interface SceneRef {
  id: string;
  title: string;
  location?: string | null;
  atmosphere?: string | null;
  backgroundImage?: string | null;
}

export interface ItemRef {
  id: string;
  name: string;
  category?: string | null;
  imagePath?: string | null;
}

// ============================================================
// StoryPackage — 编译产物
// ============================================================

export interface StoryPackage {
  /** IR schema 版本，用于向后兼容 */
  irVersion: 1;
  projectId: string;
  title: string;
  /** 起始 Beat id */
  startBeatId: string | null;
  beats: Beat[];
  transitions: Transition[];
  characters: CharacterRef[];
  scenes: SceneRef[];
  /** 项目引用的道具清单 */
  items?: ItemRef[];
  /** 世界观概述（v1.4） */
  worldSetting?: string | null;
  /** 术语库（v1.4） */
  glossary?: GlossaryEntry[];
  /** 角色图鉴（v1.4） */
  characterProfiles?: CharacterProfile[];
  /** 参与跨作品 Codex 的角色 ref id 列表（v1.6） */
  codexScope?: string[];
}

/** 初始运行时变量（存档记忆在 v1.2 接入） */
export interface RuntimeVariables {
  memory: Record<string, unknown>;
  flags: Record<string, unknown>;
  /** characterId → { field: value }（mood/affection/relationship_tags 等逻辑状态） */
  characters: Record<string, Record<string, unknown>>;
}

export function emptyVariables(): RuntimeVariables {
  return { memory: {}, flags: {}, characters: {} };
}
