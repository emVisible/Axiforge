/**
 * Renderer-agnostic 叙事运行时引擎（桥1 脊椎）
 *
 * 引擎是一个纯状态机：给定 StoryPackage 与当前 RuntimeState，"推进到下一个暂停点"，
 * 期间累积演出指令（show/hide/bg/bgm/se），在 say / choice / wait / end 处暂停并交给渲染器。
 *
 * 不依赖 DOM、网络或数据库——可 100% 单测，可被 Lite Player / 未来 Unity 等任意渲染器复用。
 */

import {
  cloneVariables,
  applyEffects,
  applyCodexWrites,
  evaluateCondition,
} from "./conditions";
import {
  cloneCodex,
  emptyCodex,
  emptyVariables,
  type Beat,
  type ChoiceOption,
  type CodexLedger,
  type Instruction,
  type RuntimeVariables,
  type StoryPackage,
} from "./ir";

// ============================================================
// 运行时状态（可序列化，v1.2 存档直接持久化本结构）
// ============================================================

export interface RuntimeState {
  currentBeatId: string | null;
  /** 当前 Beat 脚本内的游标 */
  cursor: number;
  vars: RuntimeVariables;
  /** 跨作品 IP 账本运行时快照（v1.6）；不落存档槽，由 Player 独立同步 */
  codex: CodexLedger;
  completedBeats: string[];
  status: "active" | "ended";
  /** 上次选择的标签（用于按 label 匹配转场） */
  pendingChoiceLabel: string | null;
  /** 上次选择的显式目标 Beat（ChoiceOption.to） */
  pendingChoiceTarget: string | null;
}

// ============================================================
// 视图（每次暂停交给渲染器的一帧）
// ============================================================

export interface DialogueLine {
  characterId?: string | null;
  speaker?: string | null;
  text: string;
  voice?: string | null;
  /** 富文本/ruby 解析开关（v1.3） */
  rich?: boolean;
}

export interface ViewChoice {
  index: number;
  label: string;
  to?: string | null;
  disabled: boolean;
  disabledReason?: string | null;
}

export type WaitingKind = "say" | "choice" | "wait" | "end";

export interface StoryView {
  beatId: string | null;
  /** 自上个暂停点以来累积的演出指令，渲染器需按序应用 */
  directives: Instruction[];
  waiting: WaitingKind;
  line?: DialogueLine;
  choices?: ViewChoice[];
  waitMs?: number;
  isEnding: boolean;
}

// ============================================================
// 内部工具
// ============================================================

function getBeat(pkg: StoryPackage, id: string | null): Beat | undefined {
  if (!id) return undefined;
  return pkg.beats.find((b) => b.id === id);
}

function completedSet(state: RuntimeState): Set<string> {
  return new Set(state.completedBeats);
}

/** 选取起始 Beat：优先 startBeatId，否则无入边且无 trigger 的节点，最后取第一个 */
function pickStartBeat(pkg: StoryPackage): string | null {
  if (pkg.startBeatId && getBeat(pkg, pkg.startBeatId)) return pkg.startBeatId;
  if (pkg.beats.length === 0) return null;

  const hasIncoming = new Set(pkg.transitions.map((t) => t.to));
  const entries = pkg.beats.filter(
    (b) => !hasIncoming.has(b.id) && !b.trigger,
  );
  if (entries.length > 0) {
    // 偏好含 say 的非空脚本
    const scored = [...entries].sort(
      (a, b) => scoreEntry(b) - scoreEntry(a),
    );
    return scored[0].id;
  }
  return pkg.beats[0].id;
}

function scoreEntry(beat: Beat): number {
  let s = 0;
  if (beat.script.some((i) => i.op === "say")) s += 10;
  if (!beat.isEnding) s += 5;
  return s;
}

/** Beat 完成后解析下一个 Beat id */
function resolveNextBeat(
  pkg: StoryPackage,
  state: RuntimeState,
  fromBeatId: string,
): string | null {
  if (state.pendingChoiceTarget) return state.pendingChoiceTarget;

  const outgoing = pkg.transitions.filter((t) => t.from === fromBeatId);
  let candidates = outgoing;
  if (state.pendingChoiceLabel) {
    const matched = outgoing.filter(
      (t) => t.label === state.pendingChoiceLabel,
    );
    if (matched.length > 0) candidates = matched;
  }

  const completed = completedSet(state);
  for (const t of candidates) {
    if (completed.has(t.to)) continue;
    const target = getBeat(pkg, t.to);
    if (!target) continue;
    if (evaluateCondition(target.trigger, state.vars, completed, state.codex)) {
      return t.to;
    }
  }
  return null;
}

function resolveSpeaker(
  pkg: StoryPackage,
  characterId?: string | null,
  override?: string | null,
): string | null {
  if (override) return override;
  if (characterId) {
    const ref = pkg.characters.find((c) => c.id === characterId);
    if (ref) return ref.name;
  }
  return null;
}

function buildChoices(
  state: RuntimeState,
  options: ChoiceOption[],
): ViewChoice[] {
  const completed = completedSet(state);
  return options.map((opt, index) => {
    const ok = evaluateCondition(opt.condition, state.vars, completed, state.codex);
    return {
      index,
      label: opt.label,
      to: opt.to ?? null,
      disabled: !ok,
      disabledReason: ok ? null : "条件未满足",
    };
  });
}

// ============================================================
// 核心：推进到下一个暂停点
// ============================================================

const PRESENTATION_OPS = new Set<Instruction["op"]>([
  "show",
  "hide",
  "move",
  "bg",
  "bgm",
  "se",
  "voice",
  "camera",
  "transition",
  "fx",
]);

/**
 * 从当前 state 推进到下一个暂停点，返回新的 state 与视图。
 * 纯函数：不修改入参 state。
 */
export function resume(
  pkg: StoryPackage,
  input: RuntimeState,
): { state: RuntimeState; view: StoryView } {
  const state: RuntimeState = {
    ...input,
    vars: cloneVariables(input.vars),
    codex: cloneCodex(input.codex ?? {}),
    completedBeats: [...input.completedBeats],
  };
  const directives: Instruction[] = [];

  // 防御性上限，避免作者构造的死循环卡死渲染器
  let guard = 0;
  const maxSteps = pkg.beats.reduce((n, b) => n + b.script.length, 0) + pkg.beats.length + 16;

  while (guard++ < maxSteps + 1) {
    const beat = getBeat(pkg, state.currentBeatId);
    if (!beat) {
      state.status = "ended";
      return {
        state,
        view: { beatId: null, directives, waiting: "end", isEnding: true },
      };
    }

    // Beat 脚本走完 → 完成本 Beat，应用效果，解析转场
    if (state.cursor >= beat.script.length) {
      if (!state.completedBeats.includes(beat.id)) {
        state.completedBeats.push(beat.id);
      }
      state.vars = applyEffects(state.vars, beat.effects);
      state.codex = applyCodexWrites(state.codex, beat.effects);

      const next = resolveNextBeat(pkg, state, beat.id);
      state.pendingChoiceLabel = null;
      state.pendingChoiceTarget = null;

      if (!next) {
        state.status = "ended";
        return {
          state,
          view: {
            beatId: beat.id,
            directives,
            waiting: "end",
            isEnding: beat.isEnding ?? true,
          },
        };
      }
      state.currentBeatId = next;
      state.cursor = 0;
      continue;
    }

    const inst = beat.script[state.cursor];

    if (PRESENTATION_OPS.has(inst.op)) {
      directives.push(inst);
      state.cursor += 1;
      continue;
    }

    if (inst.op === "wait") {
      return {
        state,
        view: {
          beatId: beat.id,
          directives,
          waiting: "wait",
          waitMs: inst.ms,
          isEnding: false,
        },
      };
    }

    if (inst.op === "say") {
      return {
        state,
        view: {
          beatId: beat.id,
          directives,
          waiting: "say",
          line: {
            characterId: inst.characterId ?? null,
            speaker: resolveSpeaker(pkg, inst.characterId, inst.speaker),
            text: inst.text,
            voice: inst.voice ?? null,
            rich: inst.rich ?? false,
          },
          isEnding: false,
        },
      };
    }

    if (inst.op === "narration") {
      return {
        state,
        view: {
          beatId: beat.id,
          directives,
          waiting: "say",
          line: {
            characterId: null,
            speaker: null,
            text: inst.text,
            voice: inst.voice ?? null,
            rich: inst.rich ?? false,
          },
          isEnding: false,
        },
      };
    }

    if (inst.op === "choice") {
      return {
        state,
        view: {
          beatId: beat.id,
          directives,
          waiting: "choice",
          choices: buildChoices(state, inst.options),
          isEnding: false,
        },
      };
    }

    // 未知指令：跳过（向后兼容新指令）
    state.cursor += 1;
  }

  // 触发防御上限
  state.status = "ended";
  return {
    state,
    view: { beatId: state.currentBeatId, directives, waiting: "end", isEnding: true },
  };
}

// ============================================================
// 对外 API
// ============================================================

export interface StartOptions {
  /** 载入已有存档变量（v1.2 存档记忆） */
  vars?: RuntimeVariables;
  /** 跨作品 IP 账本（v1.6） */
  codex?: CodexLedger;
}

/** 创建初始状态并推进到第一个暂停点 */
export function start(
  pkg: StoryPackage,
  opts: StartOptions = {},
): { state: RuntimeState; view: StoryView } {
  const state: RuntimeState = {
    currentBeatId: pickStartBeat(pkg),
    cursor: 0,
    vars: opts.vars ? cloneVariables(opts.vars) : emptyVariables(),
    codex: opts.codex ? cloneCodex(opts.codex) : emptyCodex(),
    completedBeats: [],
    status: "active",
    pendingChoiceLabel: null,
    pendingChoiceTarget: null,
  };
  return resume(pkg, state);
}

/**
 * 从存档恢复（v1.2 存档记忆）：给定持久化的 RuntimeState，重建当前视图。
 *
 * 存档在暂停点写入，故 saved.cursor 指向当前 say/choice；resume 会原地返回同一帧。
 * 为恢复画面，额外回放当前 Beat 游标之前的演出指令（bg/show/hide）。
 * 若存档已结束或起点失效，则携带既有变量从头开始（"角色仍记得你"）。
 */
export function restore(
  pkg: StoryPackage,
  saved: RuntimeState,
): { state: RuntimeState; view: StoryView } {
  const normalized: RuntimeState = {
    ...saved,
    codex: saved.codex ? cloneCodex(saved.codex) : emptyCodex(),
  };
  if (normalized.status === "ended" || !getBeat(pkg, normalized.currentBeatId)) {
    return start(pkg, { vars: normalized.vars, codex: normalized.codex });
  }
  const { state, view } = resume(pkg, normalized);
  const beat = getBeat(pkg, normalized.currentBeatId);
  if (beat) {
    const pre = beat.script
      .slice(0, normalized.cursor)
      .filter((i) => PRESENTATION_OPS.has(i.op));
    if (pre.length) view.directives = [...pre, ...view.directives];
  }
  return { state, view };
}

/** 玩家点击"继续"：越过当前 say / wait，推进到下一个暂停点 */
export function proceed(
  pkg: StoryPackage,
  input: RuntimeState,
): { state: RuntimeState; view: StoryView } {
  if (input.status === "ended") {
    return {
      state: input,
      view: { beatId: input.currentBeatId, directives: [], waiting: "end", isEnding: true },
    };
  }
  const state = { ...input, cursor: input.cursor + 1 };
  return resume(pkg, state);
}

/** 玩家选择一个分支选项 */
export function choose(
  pkg: StoryPackage,
  input: RuntimeState,
  optionIndex: number,
): { state: RuntimeState; view: StoryView } {
  const beat = getBeat(pkg, input.currentBeatId);
  if (!beat) return proceed(pkg, input);
  const inst = beat.script[input.cursor];
  if (!inst || inst.op !== "choice") {
    // 当前不在 choice 暂停点，退化为继续
    return proceed(pkg, input);
  }
  const option = inst.options[optionIndex];
  if (!option) return proceed(pkg, input);

  const state: RuntimeState = {
    ...input,
    cursor: input.cursor + 1,
    pendingChoiceLabel: option.label,
    pendingChoiceTarget: option.to ?? null,
  };
  return resume(pkg, state);
}

// ============================================================
// 便捷类封装（供 React 等有状态渲染器使用）
// ============================================================

export class StoryRuntime {
  private pkg: StoryPackage;
  private _state: RuntimeState;
  private _view: StoryView;

  constructor(pkg: StoryPackage, opts: StartOptions = {}) {
    this.pkg = pkg;
    const { state, view } = start(pkg, opts);
    this._state = state;
    this._view = view;
  }

  get state(): RuntimeState {
    return this._state;
  }

  get view(): StoryView {
    return this._view;
  }

  get ended(): boolean {
    return this._state.status === "ended";
  }

  proceed(): StoryView {
    const { state, view } = proceed(this.pkg, this._state);
    this._state = state;
    this._view = view;
    return view;
  }

  choose(optionIndex: number): StoryView {
    const { state, view } = choose(this.pkg, this._state, optionIndex);
    this._state = state;
    this._view = view;
    return view;
  }
}
