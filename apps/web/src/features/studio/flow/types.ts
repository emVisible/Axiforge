import { cn, inputCompact } from "@/shared/components/ui";
import { tokens } from "@axiforge/ui";

export interface ProjectRoleOption {
  roleId: string;
  characterRefId: string;
  name: string;
  imagePath?: string | null;
  spriteKeys?: string[];
  sprites?: Record<string, string>;
}

export interface ConditionItem {
  type: "memory" | "flag" | "character_state" | "node_completed" | "codex";
  key: string;
  operator: "eq" | "ne" | "gt" | "lt" | "contains";
  value: string;
}

export interface EffectItem {
  type: "memory" | "flag" | "character_state" | "codex_write";
  key: string;
  value: string;
}

export interface NodeFormState {
  title: string;
  description: string;
  is_anchor: boolean;
  is_ending: boolean;
  ending_label: string;
  speaker: string;
  dialogue: string;
  narration: string;
}

export function parseCharStateKey(key: string): { charId: string; field: string } {
  const parts = key ? key.split(".") : [];
  if (parts.length !== 2) return { charId: "", field: "" };
  if (parts[0] === "char_id") return { charId: "", field: parts[1] };
  return { charId: parts[0], field: parts[1] };
}

export const flowSelectClass = cn(inputCompact, "bg-surface");
export const flowEdgeStroke = tokens.brand;
export const flowEdgeStrokeHover = tokens.brandHover;

export const EDGE_LABELS = [
  "",
  "接受",
  "拒绝",
  "继续",
  "离开",
  "追问",
  "沉默",
  "拥抱",
  "逃跑",
  "分支A",
  "分支B",
  "分支C",
];

export const CHARACTER_STATE_PRESETS = [
  {
    key: "mood",
    label: "情绪",
    values: [
      "neutral",
      "happy",
      "sad",
      "angry",
      "scared",
      "thoughtful",
      "determined",
    ],
  },
  {
    key: "affection",
    label: "好感度",
    values: ["-100", "-50", "-25", "0", "25", "50", "100"],
  },
  { key: "health", label: "健康", values: ["healthy", "injured", "critical"] },
  {
    key: "trust",
    label: "信任",
    values: ["none", "low", "medium", "high", "absolute"],
  },
  { key: "location", label: "位置", values: [] },
];

export const CONDITION_TYPES = [
  {
    value: "memory" as const,
    label: "记忆",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    value: "flag" as const,
    label: "标志",
    color: "bg-red-50 border-red-200 text-red-700",
  },
  {
    value: "character_state" as const,
    label: "角色状态",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    value: "node_completed" as const,
    label: "前置节点",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    value: "codex" as const,
    label: "跨作品记忆",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    value: "relationship" as const,
    label: "关系",
    color: "bg-pink-50 border-pink-200 text-pink-700",
  },
];

export const EFFECT_TYPES = [
  {
    value: "memory" as const,
    label: "写入记忆",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    value: "flag" as const,
    label: "设置标志",
    color: "bg-red-50 border-red-200 text-red-700",
  },
  {
    value: "character_state" as const,
    label: "改变状态",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    value: "codex_write" as const,
    label: "写入跨作品记忆",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    value: "relationship" as const,
    label: "关系变化",
    color: "bg-pink-50 border-pink-200 text-pink-700",
  },
];

export const OPERATORS = [
  { value: "eq" as const, label: "=" },
  { value: "ne" as const, label: "≠" },
  { value: "gt" as const, label: ">" },
  { value: "lt" as const, label: "<" },
  { value: "contains" as const, label: "包含" },
];
