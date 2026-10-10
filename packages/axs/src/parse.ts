import type {
  Condition,
  Effect,
  EffectType,
  Instruction,
} from "@axiforge/core";
import type {
  AxsBeat,
  AxsDiagnostic,
  AxsDocument,
  ParseOptions,
} from "./types";
import { assignBeatIds, buildEdges, parseChoiceLine, parseJumpLine } from "./edges";
import { parseCondition, parseLiteral } from "./condition";
import { parseStageInstruction, resolveRole } from "./instructions";

// 目标解析与边物化在 ./edges（G1 行数预算下按域外提）。
// slugifyTitle 从那里转出，`print.ts` 与 `index.ts` 的既有 import 路径因此不必改。
export { slugifyTitle } from "./edges";

// 条件表达式与字面量在 ./condition（同一条 G1 预算下的第二刀）。
// 与 ./edges 不同，这里不做转出：条件不是 parse 的对外 API，消费方（./print、./index、测试）直接指过去。

const EFFECT_TYPE_MAP: Record<string, EffectType> = {
  flag: "flag",
  memory: "memory",
  state: "character_state",
  codex: "codex_write",
  relation: "relationship",
  relationship: "relationship",
};

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
    } else {
      // #79：认不出的方括号此前**静默跳过**——作者以为标了关键拍，实际什么都没发生，也不报错。
      // 与同名裸引用那条同形（ADR-016 补记），所以这里同样只加提示、不改语义。
      // 最常见的踩法是照 ADR 的占位写法把键名直接写进方括号（`[intro]`），故文案给出正确形式。
      diagnostics.push({
        line: lineNo,
        message: `未识别的 Beat 标记「[${inner}]」：可用形式是 [key: 名称]、[ending: 名称]、[if: 条件]`,
        severity: "warning",
      });
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

  const stage = parseStageInstruction(cmd, args, roles, lineNo, diagnostics);
  if (stage) return stage;

  diagnostics.push({
    line: lineNo,
    message: `未知指令 @${cmd}`,
    severity: "warning",
  });
  return { passthrough: line };
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
