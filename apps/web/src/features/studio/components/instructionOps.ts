/**
 * 演出指令的元数据与默认值——从 ScriptEditor 外提（G1 棘轮：文件只准变短，
 * 越线时要按域外提成协作模块，而不是在组件里继续堆常量）。
 */
import type { Instruction, InstructionOp } from "@axiforge/core";

export const OP_META: { op: InstructionOp; label: string }[] = [
  { op: "say", label: "台词" },
  { op: "narration", label: "旁白" },
  { op: "show", label: "立绘进场" },
  { op: "move", label: "立绘移动" },
  { op: "hide", label: "立绘退场" },
  { op: "bg", label: "背景" },
  { op: "transition", label: "转场" },
  { op: "camera", label: "镜头" },
  { op: "fx", label: "特效" },
  { op: "bgm", label: "音乐" },
  { op: "se", label: "音效" },
  { op: "voice", label: "语音" },
  { op: "wait", label: "等待" },
  { op: "choice", label: "分支" },
];

export const OP_LABEL: Record<string, string> = Object.fromEntries(
  OP_META.map((m) => [m.op, m.label]),
);

export const POSITIONS = ["left", "center", "right"];

export function defaultInstruction(op: InstructionOp): Instruction {
  switch (op) {
    case "say":
      return { op: "say", characterId: null, text: "" };
    case "narration":
      return { op: "narration", text: "" };
    case "show":
      return { op: "show", characterId: "", expression: "", position: "center" };
    case "move":
      return { op: "move", characterId: "", position: "center", ms: 300 };
    case "hide":
      return { op: "hide", characterId: "" };
    case "bg":
      return { op: "bg", image: "" };
    case "transition":
      return { op: "transition", kind: "fade", ms: 400 };
    case "camera":
      return { op: "camera", action: "zoom", scale: 1.2, ms: 300 };
    case "fx":
      return { op: "fx", effect: "flash", ms: 600 };
    case "bgm":
      return { op: "bgm", track: "", loop: true };
    case "se":
      return { op: "se", sound: "" };
    case "voice":
      return { op: "voice", sound: "" };
    case "wait":
      return { op: "wait", ms: 500 };
    case "choice":
      return { op: "choice", options: [{ label: "" }] };
  }
}
