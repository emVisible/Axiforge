import type {
  AtomCondition,
  ComparisonOperator,
  Condition,
  Effect,
  EffectType,
  GroupCondition,
  Instruction,
} from "@axiforge/core";
import type {
  AxsBeat,
  AxsDiagnostic,
  AxsDocument,
  AxsEdge,
  ParseOptions,
} from "./types";

const OP_MAP: Record<string, ComparisonOperator> = {
  "==": "eq",
  "!=": "ne",
  ">": "gt",
  "<": "lt",
};

const EFFECT_TYPE_MAP: Record<string, EffectType> = {
  flag: "flag",
  memory: "memory",
  state: "character_state",
  codex: "codex_write",
  relation: "relationship",
  relationship: "relationship",
};

/** 将标题转为 beat id（slug） */
export function slugifyTitle(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
  return s || "beat";
}

/** 解析字面量：数字、布尔、引号字符串、裸词 */
export function parseLiteral(raw: string): unknown {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

/** 字面量 → AXS 文本 */
export function printLiteral(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (/^[a-zA-Z_\u4e00-\u9fff][\w\u4e00-\u9fff.-]*$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

const COND_OP_RE = /(==|!=|>=|<=|>|<|contains)\s+/;

/** 解析条件表达式（支持 `&&` 组合为 all 组） */
export function parseCondition(expr: string): Condition | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s*&&\s*/).filter(Boolean);
  const atoms: AtomCondition[] = parts.map(parseAtomCondition).filter(Boolean) as AtomCondition[];

  if (atoms.length === 0) return null;
  if (atoms.length === 1) return atoms[0]!;
  return { type: "all", conditions: atoms } satisfies GroupCondition;
}

function parseAtomCondition(part: string): AtomCondition | null {
  const m = part.match(COND_OP_RE);
  if (!m) return null;
  const opStr = m[1]!;
  const operator = OP_MAP[opStr] ?? (opStr === "contains" ? "contains" : "eq");
  const left = part.slice(0, m.index).trim();
  const right = part.slice(m.index! + opStr.length).trim();
  const value = parseLiteral(right);

  if (left.startsWith("flag.")) {
    return { type: "flag", key: left.slice(5), operator, value };
  }
  if (left.startsWith("memory.")) {
    return { type: "memory", key: left.slice(7), operator, value };
  }
  if (left.startsWith("codex.")) {
    return { type: "codex", key: left.slice(6), operator, value };
  }
  if (left.startsWith("state.")) {
    return { type: "character_state", key: left.slice(6), operator, value };
  }
  if (left.startsWith("relation.")) {
    return { type: "relationship", key: left.slice(9), operator, value };
  }
  if (left.startsWith("relationship.")) {
    return { type: "relationship", key: left.slice(13), operator, value };
  }
  return null;
}

function resolveRole(name: string, roles?: Record<string, string>): string {
  return roles?.[name] ?? name;
}

function parseHeadingLine(
  raw: string,
  lineNo: number,
  diagnostics: AxsDiagnostic[],
): Pick<
  AxsBeat,
  "title" | "stage" | "key" | "isEnding" | "endingLabel" | "trigger"
> | null {
  const m = raw.match(/^(#{1,2})\s+(.+)$/);
  if (!m) return null;

  let rest = m[2]!.trim();
  let stage: string | null = null;
  let key: string | null = null;
  let endingLabel: string | null = null;
  let trigger: Condition | null = null;
  let isEnding = false;

  const stageM = rest.match(/@stage\(([^)]*)\)/);
  if (stageM) {
    stage = stageM[1]!.trim() || null;
    rest = rest.replace(stageM[0], " ").trim();
  }

  const bracketRe = /\[([^\]]+)\]/g;
  let bm: RegExpExecArray | null;
  while ((bm = bracketRe.exec(rest)) !== null) {
    const inner = bm[1]!.trim();
    if (inner.startsWith("key:")) {
      key = inner.slice(4).trim() || null;
    } else if (inner === "key") {
      key = key ?? "key";
    } else if (inner.startsWith("ending:")) {
      endingLabel = inner.slice(7).trim() || null;
      isEnding = true;
    } else if (inner.startsWith("if:")) {
      trigger = parseCondition(inner.slice(3).trim());
      if (!trigger) {
        diagnostics.push({
          line: lineNo,
          message: `无法解析条件: ${inner.slice(3).trim()}`,
          severity: "warning",
        });
      }
    } else if (inner.startsWith("ending")) {
      const label = inner.replace(/^ending:?\s*/, "").trim();
      endingLabel = label || inner;
      isEnding = true;
    }
  }
  rest = rest.replace(bracketRe, "").trim();
  bracketRe.lastIndex = 0;

  const title = rest.replace(/\s+/g, " ").trim();
  if (!title) {
    diagnostics.push({ line: lineNo, message: "Beat 标题为空", severity: "error" });
    return null;
  }

  return { title, stage, key, isEnding, endingLabel, trigger };
}

function parseEffectDirective(
  cmd: string,
  args: string,
  lineNo: number,
  diagnostics: AxsDiagnostic[],
): Effect | null {
  const effectType = EFFECT_TYPE_MAP[cmd];
  if (!effectType) return null;

  const eq = args.match(/^(.+?)\s*=\s*(.+)$/);
  if (!eq) {
    diagnostics.push({
      line: lineNo,
      message: `效果指令格式应为 key = value: @${cmd}`,
      severity: "warning",
    });
    return null;
  }

  let key = eq[1]!.trim();
  const value = parseLiteral(eq[2]!);

  if (cmd === "state" || cmd === "codex") {
    // already character.key form
  } else {
    key = key;
  }

  return { type: effectType, key, value };
}

function parseDirectiveLine(
  line: string,
  lineNo: number,
  roles: Record<string, string> | undefined,
  diagnostics: AxsDiagnostic[],
): { instruction?: Instruction; effect?: Effect; passthrough?: string } {
  const trimmed = line.trim();
  if (!trimmed.startsWith("@")) return {};

  const body = trimmed.slice(1).trim();
  const space = body.search(/\s/);
  const cmd = (space < 0 ? body : body.slice(0, space)).toLowerCase();
  const args = space < 0 ? "" : body.slice(space).trim();

  const effect = parseEffectDirective(cmd, args, lineNo, diagnostics);
  if (effect) return { effect };

  switch (cmd) {
    case "bg": {
      const [image, ...rest] = args.split(/\s+/);
      return {
        instruction: {
          op: "bg",
          image: image ?? "",
          transition: rest.length ? rest.join(" ") : null,
        },
      };
    }
    case "bgm": {
      const tokens = args.split(/\s+/).filter(Boolean);
      const loop = tokens.includes("loop");
      const track = tokens.find((t) => t !== "loop") ?? null;
      return { instruction: { op: "bgm", track, loop } };
    }
    case "se":
      return { instruction: { op: "se", sound: args.trim() } };
    case "voice":
      return {
        instruction: { op: "voice", sound: args.trim() || null },
      };
    case "wait": {
      const ms = Number.parseInt(args.trim(), 10);
      return { instruction: { op: "wait", ms: Number.isNaN(ms) ? 0 : ms } };
    }
    case "transition": {
      const [kind, msStr] = args.split(/\s+/);
      const ms = msStr ? Number.parseInt(msStr, 10) : undefined;
      return {
        instruction: {
          op: "transition",
          kind: (kind ?? "fade") as "fade",
          ms: ms && !Number.isNaN(ms) ? ms : undefined,
        },
      };
    }
    case "fx": {
      const [effect, msStr] = args.split(/\s+/);
      const ms = msStr ? Number.parseInt(msStr, 10) : undefined;
      return {
        instruction: {
          op: "fx",
          effect: (effect ?? "none") as "rain",
          ms: ms && !Number.isNaN(ms) ? ms : undefined,
        },
      };
    }
    case "camera": {
      const tokens = args.split(/\s+/);
      const action = (tokens[0] ?? "reset") as "zoom";
      const instr: Instruction = { op: "camera", action };
      if (action === "zoom" && tokens[1]) {
        (instr as { scale?: number }).scale = Number.parseFloat(tokens[1]);
      }
      return { instruction: instr };
    }
    case "show": {
      const tokens = args.split(/\s+/).filter(Boolean);
      const name = tokens[0] ?? "";
      return {
        instruction: {
          op: "show",
          characterId: resolveRole(name, roles),
          expression: tokens[1],
          position: tokens[2],
        },
      };
    }
    case "hide":
      return {
        instruction: {
          op: "hide",
          characterId: resolveRole(args.trim(), roles),
        },
      };
    case "move": {
      const tokens = args.split(/\s+/).filter(Boolean);
      return {
        instruction: {
          op: "move",
          characterId: resolveRole(tokens[0] ?? "", roles),
          position: tokens[1] ?? "center",
        },
      };
    }
    default:
      diagnostics.push({
        line: lineNo,
        message: `未知指令 @${cmd}`,
        severity: "warning",
      });
      return { passthrough: line };
  }
}

function parseDialogueLine(
  line: string,
  roles?: Record<string, string>,
): Instruction[] | null {
  const m = line.match(/^([^:(]+)(\([^)]*\))?\s*:\s*(.+)$/);
  if (!m) return null;

  const name = m[1]!.trim();
  const exprM = m[2];
  const text = m[3]!.trim();
  const expression = exprM ? exprM.slice(1, -1).trim() : undefined;
  const characterId = resolveRole(name, roles);

  if (expression) {
    return [
      {
        op: "show",
        characterId,
        expression,
      },
      {
        op: "say",
        characterId,
        speaker: name,
        text,
      },
    ];
  }

  return [
    {
      op: "say",
      characterId,
      speaker: name,
      text,
    },
  ];
}

function parseChoiceLine(line: string): { label: string; to: string | null } | null {
  const m = line.match(/^>\s*(.+?)(?:\s*->\s*(.+))?$/);
  if (!m) return null;
  return {
    label: m[1]!.trim(),
    to: m[2]?.trim() ?? null,
  };
}

function parseJumpLine(line: string): string | null {
  const m = line.match(/^->\s*(.+)$/);
  return m ? m[1]!.trim() : null;
}

function assignBeatIds(beats: AxsBeat[]): void {
  const seen = new Map<string, number>();
  for (const beat of beats) {
    const base = slugifyTitle(beat.title);
    const n = seen.get(beat.title) ?? 0;
    seen.set(beat.title, n + 1);
    beat.id = n === 0 ? base : `${base}-${n + 1}`;
  }
}

function titleToId(title: string, beats: AxsBeat[]): string | null {
  const matches = beats.filter((b) => b.title === title);
  if (matches.length === 1) return matches[0]!.id;
  if (matches.length > 1) {
    return matches[0]!.id;
  }
  const byId = beats.find((b) => b.id === slugifyTitle(title));
  return byId?.id ?? null;
}

function buildEdges(beats: AxsBeat[], diagnostics: AxsDiagnostic[]): AxsEdge[] {
  const edges: AxsEdge[] = [];

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!;
    const choiceInstr = beat.script.find((s) => s.op === "choice");
    const hasJumps = (beat.jumps?.length ?? 0) > 0;

    if (hasJumps) {
      for (const targetTitle of beat.jumps ?? []) {
        const to = titleToId(targetTitle, beats);
        if (!to) {
          diagnostics.push({
            line: beat.line,
            message: `跳转目标未找到: ${targetTitle}`,
            severity: "warning",
          });
          continue;
        }
        edges.push({ from: beat.id, to });
      }
      continue;
    }

    if (choiceInstr && choiceInstr.op === "choice") {
      for (const opt of choiceInstr.options) {
        const targetTitle = opt.to;
        let to: string | null = null;
        if (targetTitle) {
          to = titleToId(targetTitle, beats);
          if (!to) {
            diagnostics.push({
              line: beat.line,
              message: `选项目标未找到: ${targetTitle}`,
              severity: "warning",
            });
          }
        } else if (i + 1 < beats.length) {
          to = beats[i + 1]!.id;
        }
        if (to) {
          edges.push({ from: beat.id, to, label: opt.label });
        }
      }
      continue;
    }

    if (i + 1 < beats.length) {
      edges.push({ from: beat.id, to: beats[i + 1]!.id });
    }
  }

  return edges;
}

/** 解析 AXS 源文本 */
export function parseAxs(source: string, options: ParseOptions = {}): AxsDocument {
  const diagnostics: AxsDiagnostic[] = [];
  const beats: AxsBeat[] = [];
  const roles = options.roles;

  const lines = source.split(/\r?\n/);
  let current: AxsBeat | null = null;
  let pendingChoices: { label: string; to: string | null }[] = [];

  const flushChoices = () => {
    if (!current || pendingChoices.length === 0) return;
    current.script.push({
      op: "choice",
      options: pendingChoices.map((c) => ({
        label: c.label,
        to: c.to,
      })),
    } as Instruction);
    // choice 行号：取最后一条 choice 选项的行号
    const lastChoiceLine = pendingChoices.length > 0
      ? (pendingChoices[pendingChoices.length - 1] as any)._line ?? 0
      : 0;
    current.lineMap!.push(lastChoiceLine);
    pendingChoices = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//")) continue;

    const heading = parseHeadingLine(trimmed, lineNo, diagnostics);
    if (heading) {
      flushChoices();
      if (current) beats.push(current);
      current = {
        id: "",
        title: heading.title,
        line: lineNo,
        stage: heading.stage,
        key: heading.key,
        isEnding: heading.isEnding,
        endingLabel: heading.endingLabel,
        trigger: heading.trigger,
        script: [],
        lineMap: [],
        effects: [],
        jumps: [],
        passthrough: [],
      };
      continue;
    }

    if (!current) {
      if (trimmed) {
        diagnostics.push({
          line: lineNo,
          message: "Beat 内容出现在标题之前",
          severity: "warning",
        });
      }
      continue;
    }

    const jump = parseJumpLine(trimmed);
    if (jump) {
      flushChoices();
      current.jumps!.push(jump);
      continue;
    }

    const choice = parseChoiceLine(trimmed);
    if (choice) {
      pendingChoices.push({ ...choice, _line: lineNo } as any);
      continue;
    }

    flushChoices();

    if (trimmed.startsWith("@")) {
      const parsed = parseDirectiveLine(trimmed, lineNo, roles, diagnostics);
      if (parsed.instruction) {
        current.script.push(parsed.instruction);
        current.lineMap!.push(lineNo);
      }
      if (parsed.effect) {
        current.effects!.push(parsed.effect);
      }
      if (parsed.passthrough) current.passthrough!.push(parsed.passthrough);
      continue;
    }

    if (trimmed.startsWith("\\")) {
      current.script.push({ op: "narration", text: trimmed.slice(1) });
      current.lineMap!.push(lineNo);
      continue;
    }

    const dialogue = parseDialogueLine(trimmed, roles);
    if (dialogue) {
      for (const d of dialogue) {
        current.script.push(d);
        current.lineMap!.push(lineNo);
      }
      continue;
    }

    current.script.push({ op: "narration", text: trimmed });
    current.lineMap!.push(lineNo);
  }

  flushChoices();
  if (current) beats.push(current);

  assignBeatIds(beats);

  for (const beat of beats) {
    if (beat.effects?.length === 0) delete beat.effects;
    if (beat.jumps?.length === 0) delete beat.jumps;
    if (beat.passthrough?.length === 0) delete beat.passthrough;
  }

  const edges = buildEdges(beats, diagnostics);

  return { beats, edges, diagnostics };
}
