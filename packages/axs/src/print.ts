import type {
  AtomCondition,
  ComparisonOperator,
  Condition,
  Effect,
  GroupCondition,
  Instruction,
} from "@axiforge/core";
import type { AxsBeat, AxsDocument, AxsEdge } from "./types";
import { printLiteral } from "./parse";

const OP_PRINT: Record<ComparisonOperator, string> = {
  eq: "==",
  ne: "!=",
  gt: ">",
  lt: "<",
  contains: "contains",
};

/** 条件 → AXS 文本 */
export function printCondition(cond: Condition): string {
  if (isGroup(cond)) {
    return cond.conditions.map(printAtom).join(" && ");
  }
  return printAtom(cond as AtomCondition);
}

function isGroup(c: Condition): c is GroupCondition {
  return (
    "conditions" in c &&
    Array.isArray((c as GroupCondition).conditions) &&
    ((c as GroupCondition).type === "all" ||
      (c as GroupCondition).type === "any" ||
      (c as GroupCondition).type === "none")
  );
}

function printAtom(cond: AtomCondition): string {
  const op = OP_PRINT[cond.operator ?? "eq"];
  const val = printLiteral(cond.value);
  switch (cond.type) {
    case "flag":
      return `flag.${cond.key} ${op} ${val}`;
    case "memory":
      return `memory.${cond.key} ${op} ${val}`;
    case "codex":
      return `codex.${cond.key} ${op} ${val}`;
    case "character_state":
      return `state.${cond.key} ${op} ${val}`;
    case "relationship":
      return `relation.${cond.key} ${op} ${val}`;
    default:
      return `${cond.type}.${cond.key ?? ""} ${op} ${val}`;
  }
}

function reverseRole(characterId: string, roles?: Record<string, string>): string {
  if (!roles) return characterId;
  for (const [name, id] of Object.entries(roles)) {
    if (id === characterId) return name;
  }
  return characterId;
}

function printEffect(effect: Effect): string {
  const val = printLiteral(effect.value);
  switch (effect.type) {
    case "flag":
      return `@flag ${effect.key} = ${val}`;
    case "memory":
      return `@memory ${effect.key} = ${val}`;
    case "character_state":
      return `@state ${effect.key} = ${val}`;
    case "codex_write":
      return `@codex ${effect.key} = ${val}`;
    case "relationship":
      return `@relation ${effect.key} = ${val}`;
    default:
      return `@${effect.type} ${effect.key} = ${val}`;
  }
}

function printInstruction(instr: Instruction, roles?: Record<string, string>): string[] {
  switch (instr.op) {
    case "bg":
      return [`@bg ${instr.image}${instr.transition ? ` ${instr.transition}` : ""}`];
    case "bgm":
      return [
        `@bgm ${instr.track ?? ""}${instr.loop ? " loop" : ""}`.trim(),
      ];
    case "se":
      return [`@se ${instr.sound}`];
    case "voice":
      return [`@voice ${instr.sound ?? ""}`.trim()];
    case "wait":
      return [`@wait ${instr.ms}`];
    case "transition":
      return [
        `@transition ${instr.kind}${instr.ms != null ? ` ${instr.ms}` : ""}`,
      ];
    case "fx":
      return [`@fx ${instr.effect}${instr.ms != null ? ` ${instr.ms}` : ""}`];
    case "camera": {
      const parts = ["@camera", instr.action];
      if (instr.action === "zoom" && instr.scale != null) parts.push(String(instr.scale));
      return [parts.join(" ")];
    }
    case "show": {
      const name = reverseRole(instr.characterId, roles);
      const tokens = [`@show ${name}`];
      if (instr.expression) tokens.push(instr.expression);
      if (instr.position) tokens.push(instr.position);
      return [tokens.join(" ")];
    }
    case "hide":
      return [`@hide ${reverseRole(instr.characterId, roles)}`];
    case "move":
      return [
        `@move ${reverseRole(instr.characterId, roles)} ${instr.position}`,
      ];
    case "say": {
      const name = instr.speaker ?? reverseRole(instr.characterId ?? "", roles);
      return [`${name}: ${instr.text}`];
    }
    case "narration":
      return [instr.text.includes("\n") || /^[@>#\\]/.test(instr.text) ? `\\${instr.text}` : instr.text];
    case "choice":
      return instr.options.map((o) =>
        o.to ? `> ${o.label} -> ${o.to}` : `> ${o.label}`,
      );
    default:
      return [];
  }
}

function idToTitle(id: string, beats: AxsBeat[]): string {
  const beat = beats.find((b) => b.id === id);
  return beat?.title ?? id;
}

function printBeatHeading(beat: AxsBeat): string {
  const parts: string[] = [`# ${beat.title}`];
  if (beat.stage) parts.push(`@stage(${beat.stage})`);
  if (beat.key) parts.push(`[key: ${beat.key}]`);
  if (beat.isEnding || beat.endingLabel) {
    parts.push(`[ending: ${beat.endingLabel ?? "结局"}]`);
  }
  if (beat.trigger) {
    parts.push(`[if: ${printCondition(beat.trigger)}]`);
  }
  return parts.join(" ");
}

function printBeatBody(
  beat: AxsBeat,
  beats: AxsBeat[],
  roles?: Record<string, string>,
): string[] {
  const out: string[] = [];

  for (const line of beat.passthrough ?? []) {
    out.push(line);
  }

  const script = beat.script.filter((s) => s.op !== "choice");
  for (let i = 0; i < script.length; i++) {
    const instr = script[i]!;
    if (
      instr.op === "show" &&
      script[i + 1]?.op === "say" &&
      instr.expression
    ) {
      const say = script[i + 1] as Extract<Instruction, { op: "say" }>;
      const name = say.speaker ?? reverseRole(instr.characterId, roles);
      out.push(`${name}(${instr.expression}): ${say.text}`);
      i++;
      continue;
    }
    out.push(...printInstruction(instr, roles));
  }

  for (const effect of beat.effects ?? []) {
    out.push(printEffect(effect));
  }

  const choice = beat.script.find((s) => s.op === "choice");
  if (choice && choice.op === "choice") {
    for (const opt of choice.options) {
      out.push(opt.to ? `> ${opt.label} -> ${opt.to}` : `> ${opt.label}`);
    }
  }

  if (beat.jumps?.length) {
    for (const targetTitle of beat.jumps) {
      out.push(`-> ${targetTitle}`);
    }
  } else {
    const jumpEdges = (beat as AxsBeat & { _edges?: AxsEdge[] })._edges;
    if (jumpEdges?.length) {
      for (const e of jumpEdges) {
        if (!e.label) out.push(`-> ${idToTitle(e.to, beats)}`);
      }
    }
  }

  return out;
}

/** 将 AXS 文档打印为源文本 */
export function printAxs(
  doc: AxsDocument,
  options?: { roles?: Record<string, string> },
): string {
  const beats = doc.beats;
  const edgeMap = new Map<string, AxsEdge[]>();
  for (const e of doc.edges) {
    const list = edgeMap.get(e.from) ?? [];
    list.push(e);
    edgeMap.set(e.from, list);
  }

  const blocks: string[] = [];
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!;
    const beatWithEdges = beat as AxsBeat & { _edges?: AxsEdge[] };
    beatWithEdges._edges = edgeMap.get(beat.id);

    if (i > 0) blocks.push("");
    blocks.push(printBeatHeading(beat));
    blocks.push(...printBeatBody(beat, beats, options?.roles));
  }

  return blocks.join("\n").trimEnd() + (blocks.length ? "\n" : "");
}
