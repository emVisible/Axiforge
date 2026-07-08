import type { Instruction } from "@axiforge/core";

/**
 * 舞台状态：由演出指令（show/hide/move/bg/camera/fx/transition/bgm）折叠而来。
 * 纯视觉状态，音频一次性触发（se/voice）在 Player 侧单独处理。
 */
export interface StageSprite {
  expression?: string;
  position: string;
}

export interface CameraState {
  scale: number;
  x: number;
  y: number;
}

export interface FxState {
  effect: string; // "none" 表示无
  seq: number; // 每次触发自增，用于重放一次性动画
  ms: number;
}

export interface Stage {
  background: string | null;
  sprites: Record<string, StageSprite>;
  camera: CameraState;
  shakeSeq: number;
  shakeIntensity: number;
  fx: FxState;
  transitionSeq: number;
  transitionKind: string;
  transitionMs: number;
  bgm: string | null;
}

export const EMPTY_STAGE: Stage = {
  background: null,
  sprites: {},
  camera: { scale: 1, x: 0, y: 0 },
  shakeSeq: 0,
  shakeIntensity: 8,
  fx: { effect: "none", seq: 0, ms: 600 },
  transitionSeq: 0,
  transitionKind: "fade",
  transitionMs: 400,
  bgm: null,
};

export function foldStage(
  prev: Stage,
  directives: Instruction[],
  opts?: { animate?: boolean },
): Stage {
  const animate = opts?.animate !== false;
  let background = prev.background;
  const sprites = { ...prev.sprites };
  let camera = { ...prev.camera };
  let shakeSeq = prev.shakeSeq;
  let shakeIntensity = prev.shakeIntensity;
  let fx = prev.fx;
  let transitionSeq = prev.transitionSeq;
  let transitionKind = prev.transitionKind;
  let transitionMs = prev.transitionMs;
  let bgm = prev.bgm;

  for (const d of directives) {
    switch (d.op) {
      case "bg":
        background = d.image;
        break;
      case "show":
        sprites[d.characterId] = {
          expression: d.expression,
          position: d.position || "center",
        };
        break;
      case "move": {
        const existing = sprites[d.characterId];
        sprites[d.characterId] = {
          expression: existing?.expression,
          position: d.position || "center",
        };
        break;
      }
      case "hide":
        delete sprites[d.characterId];
        break;
      case "camera":
        if (d.action === "reset") camera = { scale: 1, x: 0, y: 0 };
        else if (d.action === "zoom") camera = { ...camera, scale: d.scale ?? 1 };
        else if (d.action === "pan")
          camera = { ...camera, x: d.x ?? 0, y: d.y ?? 0 };
        else if (d.action === "shake") {
          if (animate) {
            shakeSeq += 1;
            shakeIntensity = d.intensity ?? 8;
          } else {
            shakeIntensity = d.intensity ?? 8;
          }
        }
        break;
      case "fx":
        if (animate) {
          fx = { effect: d.effect, seq: fx.seq + 1, ms: d.ms ?? 600 };
        } else {
          fx = { effect: d.effect, seq: fx.seq, ms: d.ms ?? 600 };
        }
        break;
      case "transition":
        if (animate) {
          transitionSeq += 1;
        }
        transitionKind = d.kind;
        transitionMs = d.ms ?? 400;
        break;
      case "bgm":
        bgm = d.track;
        break;
      default:
        break;
    }
  }

  return {
    background,
    sprites,
    camera,
    shakeSeq,
    shakeIntensity,
    fx,
    transitionSeq,
    transitionKind,
    transitionMs,
    bgm,
  };
}

/** 提取一帧中一次性音频触发（se / voice），供 Player 播放 */
export function extractOneShots(
  directives: Instruction[],
): { se: string[]; voice: string | null } {
  const se: string[] = [];
  let voice: string | null = null;
  for (const d of directives) {
    if (d.op === "se") se.push(d.sound);
    else if (d.op === "voice") voice = d.sound;
  }
  return { se, voice };
}
