import type { Instruction } from "@axiforge/core";

export const TIMELINE_PAD = 16;

const OP_LABELS: Record<string, string> = {
  say: "台词",
  narration: "旁白",
  show: "立绘",
  hide: "退场",
  move: "移动",
  bg: "背景",
  bgm: "音乐",
  se: "音效",
  voice: "语音",
  wait: "等待",
  choice: "分支",
  transition: "转场",
  camera: "镜头",
  fx: "特效",
};

export type CutTrackId = "dialogue" | "visual" | "audio" | "timing";

export const CUT_TRACKS: { id: CutTrackId; label: string; short: string }[] = [
  { id: "dialogue", label: "台词轨 V1", short: "V1" },
  { id: "visual", label: "画面轨 V2", short: "V2" },
  { id: "audio", label: "音频轨 A1", short: "A1" },
  { id: "timing", label: "节奏轨 FX", short: "FX" },
];

export function trackForOp(op: string): CutTrackId {
  switch (op) {
    case "say":
    case "narration":
    case "choice":
      return "dialogue";
    case "show":
    case "hide":
    case "move":
    case "bg":
    case "transition":
    case "camera":
    case "fx":
      return "visual";
    case "bgm":
    case "se":
    case "voice":
      return "audio";
    default:
      return "timing";
  }
}

export function clipLabel(inst: Instruction | null | undefined): string {
  if (!inst) return "—";
  switch (inst.op) {
    case "say":
      return inst.text?.slice(0, 32) || "台词";
    case "narration":
      return inst.text?.slice(0, 32) || "旁白";
    case "choice":
      return inst.options?.map((o) => o.label).join(" / ") || "分支";
    case "bg":
      return inst.image || "背景";
    case "bgm":
      return inst.track || "音乐";
    case "se":
    case "voice":
      return inst.sound || OP_LABELS[inst.op] || inst.op;
    case "show":
    case "hide":
    case "move":
      return inst.characterId || OP_LABELS[inst.op] || inst.op;
    case "wait":
      return `${inst.ms ?? 500}ms`;
    default:
      return OP_LABELS[inst.op] || inst.op;
  }
}

export function clipDurationMs(inst: Instruction | null | undefined): number {
  if (!inst) return 0;
  switch (inst.op) {
    case "wait":
      return inst.ms ?? 500;
    case "say":
    case "narration":
      return Math.min(8000, 1000 + (inst.text?.length || 0) * 70);
    case "move":
    case "transition":
    case "camera":
      return inst.ms ?? 400;
    case "fx":
      return inst.ms ?? 600;
    case "choice":
      return 1200;
    default:
      return 500;
  }
}

export function clipWidth(inst: Instruction | null | undefined, zoom = 1): number {
  if (!inst) return Math.round(48 * zoom);
  const base = 48;
  let w: number;
  switch (inst.op) {
    case "say":
    case "narration":
      w = Math.min(240, base + (inst.text?.length || 0) * 3.2);
      break;
    case "wait":
      w = Math.max(40, Math.min(180, (inst.ms || 500) / 12));
      break;
    case "choice":
      w = 64 + (inst.options?.length || 1) * 32;
      break;
    default:
      w = 80;
  }
  return Math.round(w * zoom);
}

export function clipColor(inst: Instruction | null | undefined): string {
  if (!inst) return "bg-panel-raised border-border text-ink-muted";
  switch (inst.op) {
    case "say":
    case "narration":
      return "bg-brand/40 border-brand/50 text-ink";
    case "show":
    case "hide":
    case "move":
      return "bg-accent-soft/25 border-accent-soft/50 text-ink";
    case "bg":
    case "transition":
      return "bg-emerald-900/40 border-emerald-500/40 text-ink";
    case "bgm":
    case "se":
    case "voice":
      return "bg-accent/25 border-accent/50 text-ink";
    case "choice":
      return "bg-rose-900/40 border-rose-400/40 text-ink";
    case "wait":
      return "bg-border-strong border-border text-ink-muted";
    default:
      return "bg-panel-raised border-border text-ink-muted";
  }
}

export function clipPositions(script: Instruction[], zoom = 1): number[] {
  const positions: number[] = [];
  let x = 0;
  for (const inst of script) {
    positions.push(x);
    x += clipWidth(inst, zoom) + 2;
  }
  return positions;
}

export function totalTimelineWidth(script: Instruction[], zoom = 1): number {
  if (!script.length) return 320;
  const positions = clipPositions(script, zoom);
  const last = script[script.length - 1];
  return positions[positions.length - 1] + clipWidth(last, zoom) + 48;
}

export function totalDurationMs(script: Instruction[]): number {
  return script.reduce((sum, inst) => sum + clipDurationMs(inst), 0);
}

export function formatNarrativeTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** @deprecated 使用 formatNarrativeTime */
export const formatTimecode = formatNarrativeTime;

export function cursorTimeMs(script: Instruction[], cursorIndex: number): number {
  let ms = 0;
  for (let i = 0; i < cursorIndex && i < script.length; i++) {
    ms += clipDurationMs(script[i]);
  }
  return ms;
}

export function indexAtPixel(
  script: Instruction[],
  pixelX: number,
  zoom: number,
): number {
  if (!script.length) return 0;
  const positions = clipPositions(script, zoom);
  for (let i = script.length - 1; i >= 0; i--) {
    if (pixelX >= positions[i]) return i;
  }
  return 0;
}

/** 单 Beat 内重排 script[]，from/to 均为原数组下标 */
export function reorderScript(
  script: Instruction[],
  from: number,
  to: number,
): Instruction[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= script.length ||
    to >= script.length
  ) {
    return script;
  }
  const next = [...script];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function clipLeft(script: Instruction[], index: number, zoom = 1): number {
  const positions = clipPositions(script, zoom);
  return TIMELINE_PAD + (positions[index] ?? 0);
}
