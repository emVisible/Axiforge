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

/** 属于角色轨的指令（F2：show/hide/move 按 characterId 分轨） */
export function characterTrackOp(inst: Instruction): string | null {
  if (!inst || typeof inst !== "object") return null;
  const op = (inst as { op?: string }).op;
  if (op !== "show" && op !== "hide" && op !== "move") return null;
  const cid = (inst as { characterId?: string }).characterId;
  return cid ? op : null;
}

/** 角色轨分组：按 characterId 首次出现顺序 */
export function characterTrackGroups(
  script: Instruction[],
): { characterId: string; indices: number[] }[] {
  const order: string[] = [];
  const byChar = new Map<string, number[]>();
  script.forEach((inst, i) => {
    if (!characterTrackOp(inst)) return;
    const cid = (inst as { characterId: string }).characterId;
    if (!byChar.has(cid)) {
      byChar.set(cid, []);
      order.push(cid);
    }
    byChar.get(cid)!.push(i);
  });
  return order.map((characterId) => ({ characterId, indices: byChar.get(characterId)! }));
}

/** 过滤无效条目，避免删除/重排后时间轴读到 undefined */
export function sanitizeScript(script: Instruction[]): Instruction[] {
  return script.filter(
    (inst): inst is Instruction =>
      Boolean(inst && typeof inst === "object" && "op" in inst && inst.op),
  );
}

/**
 * 在指定下标处插入 show 指令（F3：精灵拖入时间轴）。
 * 返回新数组；若 index 越界则追加到末尾。
 */
export function insertShowInstruction(
  script: Instruction[],
  index: number,
  characterId: string,
  expression: string,
): Instruction[] {
  const inst: Instruction = {
    op: "show",
    characterId,
    expression,
    position: "center",
  } as Instruction;
  const i = Math.max(0, Math.min(index, script.length));
  return [...script.slice(0, i), inst, ...script.slice(i)];
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

const RESIZABLE_OPS = new Set(["wait", "move", "transition", "camera", "fx"]);

export function canResizeClipDuration(inst: Instruction | null | undefined): boolean {
  return Boolean(inst && RESIZABLE_OPS.has(inst.op));
}

function durationWidthMs(inst: Instruction, ms: number): number {
  if (inst.op === "wait") {
    return Math.max(40, Math.min(180, ms / 12));
  }
  return Math.max(40, Math.min(240, ms / 8));
}

export function msFromClipWidth(
  inst: Instruction,
  widthPx: number,
  zoom = 1,
): number {
  const innerW = widthPx / Math.max(zoom, 0.01);
  if (inst.op === "wait") {
    return Math.round(Math.max(100, Math.min(2000, innerW * 12)));
  }
  return Math.round(Math.max(50, Math.min(3000, innerW * 8)));
}

export function patchClipDuration(inst: Instruction, ms: number): Instruction {
  if (!canResizeClipDuration(inst)) return inst;
  return { ...inst, ms } as Instruction;
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
      w = durationWidthMs(inst, inst.ms || 500);
      break;
    case "move":
    case "transition":
    case "camera":
    case "fx":
      w = durationWidthMs(inst, inst.ms ?? clipDurationMs(inst));
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

/** 某轨在 script[] 中的全局下标（按执行顺序） */
export function indicesOnTrack(
  script: Instruction[],
  trackId: CutTrackId,
): number[] {
  return script
    .map((inst, i) => ({ inst, i }))
    .filter(({ inst }) => trackForOp(inst.op) === trackId)
    .map(({ i }) => i);
}

/** 按索引集重排：交换同轨片段在 script[] 中的槽位，其它轨不动（角色轨与固定轨共用） */
export function reorderScriptByIndices(
  script: Instruction[],
  indices: number[],
  fromLocal: number,
  toLocal: number,
): Instruction[] {
  if (
    fromLocal === toLocal ||
    fromLocal < 0 ||
    toLocal < 0 ||
    fromLocal >= indices.length ||
    toLocal >= indices.length
  ) {
    return script;
  }
  const trackItems = indices.map((i) => script[i]);
  const [item] = trackItems.splice(fromLocal, 1);
  trackItems.splice(toLocal, 0, item);
  const next = [...script];
  indices.forEach((globalIdx, localIdx) => {
    next[globalIdx] = trackItems[localIdx];
  });
  return next;
}

/** 分轨内重排（固定轨便捷入口） */
export function reorderScriptWithinTrack(
  script: Instruction[],
  trackId: CutTrackId,
  fromLocal: number,
  toLocal: number,
): Instruction[] {
  return reorderScriptByIndices(script, indicesOnTrack(script, trackId), fromLocal, toLocal);
}

/** 分轨内点击/拖拽落点 → 轨内局部下标 */
export function localIndexAtPixel(
  script: Instruction[],
  trackId: CutTrackId,
  pixelX: number,
  zoom: number,
): number {
  return localIndexAtPixelForIndices(indicesOnTrack(script, trackId), script, pixelX, zoom);
}

/** 按索引集的局部下标（角色轨共用） */
export function localIndexAtPixelForIndices(
  indices: number[],
  script: Instruction[],
  pixelX: number,
  zoom: number,
): number {
  if (!indices.length) return 0;
  const positions = clipPositions(script, zoom);
  for (let local = indices.length - 1; local >= 0; local--) {
    if (pixelX >= positions[indices[local]]) return local;
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
