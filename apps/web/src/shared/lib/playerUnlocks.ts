/** 鉴赏解锁状态（CG / BGM，v1.4）——按作品存 localStorage */

import type { StoryPackage } from "@axiforge/core";

export interface PlayerUnlocks {
  cgs: string[];
  bgms: string[];
}

const KEY = (projectId: string) => `axiforge:player-unlocks:${projectId}`;

export function loadUnlocks(projectId: string): PlayerUnlocks {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return { cgs: [], bgms: [] };
    const parsed = JSON.parse(raw);
    return {
      cgs: Array.isArray(parsed.cgs) ? parsed.cgs : [],
      bgms: Array.isArray(parsed.bgms) ? parsed.bgms : [],
    };
  } catch {
    return { cgs: [], bgms: [] };
  }
}

export function saveUnlocks(projectId: string, unlocks: PlayerUnlocks): void {
  localStorage.setItem(KEY(projectId), JSON.stringify(unlocks));
}

export function unlockCg(projectId: string, path: string): PlayerUnlocks {
  const u = loadUnlocks(projectId);
  if (!path || u.cgs.includes(path)) return u;
  const next = { ...u, cgs: [...u.cgs, path] };
  saveUnlocks(projectId, next);
  return next;
}

export function unlockBgm(projectId: string, track: string): PlayerUnlocks {
  const u = loadUnlocks(projectId);
  if (!track || u.bgms.includes(track)) return u;
  const next = { ...u, bgms: [...u.bgms, track] };
  saveUnlocks(projectId, next);
  return next;
}

/** 从 IR 扫描全部可鉴赏资产（用于画廊展示锁定/解锁） */
export function collectGalleryAssets(pkg: StoryPackage): {
  cgs: string[];
  bgms: string[];
} {
  const cgs = new Set<string>();
  const bgms = new Set<string>();
  for (const beat of pkg.beats) {
    for (const inst of beat.script) {
      if (inst.op === "bg" && inst.image) cgs.add(inst.image);
      if (inst.op === "bgm" && inst.track) bgms.add(inst.track);
    }
  }
  for (const scene of pkg.scenes) {
    if (scene.backgroundImage) cgs.add(scene.backgroundImage);
  }
  return { cgs: [...cgs], bgms: [...bgms] };
}
