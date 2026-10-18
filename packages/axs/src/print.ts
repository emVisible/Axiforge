import type {
  AtomCondition,
  ComparisonOperator,
  Condition,
  Effect,
  GroupCondition,
  Instruction,
} from "@axiforge/core";
import type { AxsBeat, AxsDiagnostic, AxsDocument, AxsEdge } from "./types";
import { slugifyTitle } from "./parse";
import { printLiteral } from "./condition";

const OP_PRINT: Record<ComparisonOperator, string> = {
  eq: "==",
  ne: "!=",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
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

function printChoiceOptions(
  options: Extract<Instruction, { op: "choice" }>["options"],
  beats: AxsBeat[],
): string[] {
  return options.map((option) => {
    const target = option.to ? idToBeatRef(option.to, beats) : null;
    return target ? `> ${option.label} -> ${target}` : `> ${option.label}`;
  });
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

/** 旁白行的转义，唯一一份：开头会被误认成指令的行加 `\`（`parse.ts` 的 `\` 分支认这个） */
function printNarrationLine(text: string): string[] {
  return [text.includes("\n") || /^[@>#\\]/.test(text) ? `\\${text}` : text];
}

function printInstruction(
  instr: Instruction,
  roles: Record<string, string> | undefined,
  beats: AxsBeat[],
): string[] {
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
      const name = (instr.speaker ?? reverseRole(instr.characterId ?? "", roles)).trim();
      // 说话人解不出来时不能印成 `: 台词`：那一行回读会被 `parseDialogueLine` 的 `[^:(]+` 拒掉，
      // 整行降级成旁白，而**冒号会留在玩家看到的文本里**（编排台「+ 台词」造的正是这种节点）。
      // 运行端本来就不显示空说话人的名字（`engine.ts::resolveSpeaker` 返回 null、`BacklogPanel` 的 `entry.speaker &&`），
      // `ir.ts:90` 也写着「缺省为旁白」——所以按旁白那一支印出去才是同一语义，而不是同一形状的坏数据。
      if (!name) return printNarrationLine(instr.text);
      return [`${name}: ${instr.text}`];
    }
    case "narration":
      return printNarrationLine(instr.text);
    case "choice":
      return printChoiceOptions(instr.options, beats);
    default:
      return [];
  }
}

/**
 * 把一个 beat id 转成**可寻址**的文本引用。
 * 标题唯一时用标题（人读得懂）；**同名 Beat 时标题不可寻址**——解析侧按「标题唯一才匹配」的序号规则
 * 生成 id（第一个 `开场`、第二个 `开场-2`），所以这里必须输出同一个序号规则，
 * 否则指向第二个「开场」的分支回读后会静默落到第一个。
 */
function idToBeatRef(id: string, beats: AxsBeat[]): string {
  const beat = beats.find((b) => b.id === id);
  if (!beat) return id;
  const sameTitle = beats.filter((b) => b.title === beat.title);
  if (sameTitle.length <= 1) return beat.title;
  const ordinal = sameTitle.indexOf(beat);
  const base = slugifyTitle(beat.title);
  return ordinal === 0 ? base : `${base}-${ordinal + 1}`;
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
  jumpEdges?: AxsEdge[],
  emit?: (d: AxsDiagnostic) => void,
  startLine?: number,
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
    out.push(...printInstruction(instr, roles, beats));
  }

  for (const effect of beat.effects ?? []) {
    out.push(printEffect(effect));
  }

  const choiceGroups = beat.script.filter((s) => s.op === "choice") as Extract<
    Instruction,
    { op: "choice" }
  >[];
  const choice = choiceGroups[0];
  if (choice) {
    out.push(...printChoiceOptions(choice.options, beats));
  }
  /*
   * 一拍只印得出**一组**选项（语法里没有第二组的容身之处），所以第二组及其以后的选项在发射时消失，
   * 于是 `parse(print(beats)) ≡ beats`（ADR-016 的在册契约）被静默违反：作者看到文本里有三组，
   * 导出后只剩一组，界面上没有任何一句解释。**语义这一刀不由发射器做**（合并成一组＝改叙事语义、
   * 扩语法＝动语法冻结面，两条都在待决清单里等人定档），本处只把已经发生的丢失**说出口**：
   * 文本一字不变，只多一条 warning。判据成对钉住这两件事（有 warning / 文本不变）。
   */
  if (choiceGroups.length > 1 && emit) {
    const dropped = choiceGroups.slice(1);
    const optionCount = dropped.reduce((n, g) => n + g.options.length, 0);
    emit({
      line: startLine ?? 1,
      severity: "warning",
      message:
        `第「${beat.title}」拍有 ${choiceGroups.length} 组分支，发射时只印得出第一组：` +
        `丢掉的后 ${dropped.length} 组共 ${optionCount} 个选项在导出文本里读不回来。` +
        `要么把这些选项并进第一组，要么把这一拍拆成多拍。`,
    });
  }

  if (beat.jumps?.length) {
    for (const targetTitle of beat.jumps) {
      out.push(`-> ${targetTitle}`);
    }
  } else {
    // 无显式 `->` 行时，从边表补出跳转。边由 printAxs 就地取好作参数传进来，
    // 不再写成 beat 上的私字段（判据：`doc-examples.test.ts` 的"打印是纯函数"那条）。
    // 这里也会把"指向下一拍的顺序边"打印成显式 `->`：两面失效模式已登记为待决项（见工单"打印物化顺序边"）。
    if (jumpEdges?.length) {
      for (const e of jumpEdges) {
        if (!e.label) out.push(`-> ${idToBeatRef(e.to, beats)}`);
      }
    }
  }

  return out;
}

/** 将 AXS 文档打印为源文本 */
export function printAxs(
  doc: AxsDocument,
  options?: { roles?: Record<string, string>; diagnostics?: AxsDiagnostic[] },
): string {
  const beats = doc.beats;
  const edgeMap = new Map<string, AxsEdge[]>();
  for (const e of doc.edges) {
    const list = edgeMap.get(e.from) ?? [];
    list.push(e);
    edgeMap.set(e.from, list);
  }

  /**
   * 发射侧的告警通道（可选出参）：**文本输出与之前逐字相同**，只是把已经发生的丢失登记下来。
   * 行号按"这块文本的第几行"累计，所以编辑界面能把它钉在正确那一拍上。
   */
  const emit = options?.diagnostics
    ? (d: AxsDiagnostic) => options.diagnostics?.push(d)
    : undefined;
  const blocks: string[] = [];
  let lineCursor = 1;
  const pushLine = (text: string) => {
    blocks.push(text);
    lineCursor += 1 + (text.match(/\n/g)?.length ?? 0);
  };
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!;
    if (i > 0) pushLine("");
    const startLine = lineCursor;
    pushLine(printBeatHeading(beat));
    for (const line of printBeatBody(
      beat,
      beats,
      options?.roles,
      edgeMap.get(beat.id),
      emit,
      startLine,
    )) {
      pushLine(line);
    }
  }

  return blocks.join("\n").trimEnd() + (blocks.length ? "\n" : "");
}
