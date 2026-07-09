import type { Node } from "reactflow";
import type { Instruction } from "@axiforge/core";
import {
  clipDurationMs,
  cursorTimeMs,
  sanitizeScript,
  totalDurationMs,
} from "./timelineUtils";

export interface MasterBeatSegment {
  beatId: string;
  title: string;
  script: Instruction[];
  startMs: number;
  durationMs: number;
}

export interface MasterTimeline {
  beats: MasterBeatSegment[];
  totalMs: number;
}

function beatTitle(node: Node): string {
  return (node.data.title as string) || "未命名";
}

function beatScript(node: Node): Instruction[] {
  return sanitizeScript((node.data.script as Instruction[]) || []);
}

/** 按画布纵轴（再横轴）排序，近似叙事阅读顺序 */
export function sortBeatsForMaster(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    const dy = a.position.y - b.position.y;
    if (Math.abs(dy) > 24) return dy;
    return a.position.x - b.position.x;
  });
}

export function buildMasterTimeline(nodes: Node[]): MasterTimeline {
  const ordered = sortBeatsForMaster(nodes);
  let startMs = 0;
  const beats: MasterBeatSegment[] = ordered.map((node) => {
    const script = beatScript(node);
    const durationMs = totalDurationMs(script);
    const segment: MasterBeatSegment = {
      beatId: node.id,
      title: beatTitle(node),
      script,
      startMs,
      durationMs,
    };
    startMs += durationMs;
    return segment;
  });
  return { beats, totalMs: startMs };
}

export function masterGlobalMs(
  master: MasterTimeline,
  beatId: string | null | undefined,
  localClipIndex: number,
): number {
  if (!beatId) return 0;
  const beat = master.beats.find((b) => b.beatId === beatId);
  if (!beat) return 0;
  return beat.startMs + cursorTimeMs(beat.script, localClipIndex);
}

export function locateMasterPosition(
  master: MasterTimeline,
  globalMs: number,
): { beatId: string; localClipIndex: number } {
  const ms = Math.max(0, globalMs);
  if (!master.beats.length) {
    return { beatId: "", localClipIndex: 0 };
  }

  for (const beat of master.beats) {
    const end = beat.startMs + beat.durationMs;
    if (ms < end || beat === master.beats[master.beats.length - 1]) {
      const localMs = Math.max(0, ms - beat.startMs);
      if (!beat.script.length) {
        return { beatId: beat.beatId, localClipIndex: 0 };
      }
      let acc = 0;
      for (let i = 0; i < beat.script.length; i++) {
        acc += clipDurationMs(beat.script[i]);
        if (acc >= localMs) {
          return { beatId: beat.beatId, localClipIndex: i };
        }
      }
      return {
        beatId: beat.beatId,
        localClipIndex: Math.max(0, beat.script.length - 1),
      };
    }
  }

  const last = master.beats[master.beats.length - 1];
  return {
    beatId: last.beatId,
    localClipIndex: Math.max(0, last.script.length - 1),
  };
}

export function nextBeatId(
  master: MasterTimeline,
  beatId: string | null | undefined,
): string | null {
  if (!beatId) return master.beats[0]?.beatId ?? null;
  const idx = master.beats.findIndex((b) => b.beatId === beatId);
  if (idx < 0 || idx >= master.beats.length - 1) return null;
  return master.beats[idx + 1].beatId;
}

export function beatIndexInMaster(
  master: MasterTimeline,
  beatId: string | null | undefined,
): number {
  if (!beatId) return -1;
  return master.beats.findIndex((b) => b.beatId === beatId);
}
