/**
 * L2 Journal：有界事务日志（KERNEL_DESIGN §2.3）。
 *
 * 一份日志买四样东西：undo/redo、ADR-025 dirty 记序、崩溃恢复、测试回放。
 * 不变量 I7：有界（默认 200），FIFO 淘汰，无静默无限增长。
 */

import type { ApplyError, ApplyResult, Draft, Envelope } from "./types";

export const MAX_JOURNAL = 200;

export interface JournalEntry {
  readonly envelope: Envelope;
  /** 应用前该事务所在 rev（= before.rev） */
  readonly rev: number;
  /** 应用前的 Draft 快照（结构共享，撤销即指针回退） */
  readonly before: Draft;
}

export interface Journal {
  readonly past: readonly JournalEntry[];
  readonly future: readonly JournalEntry[];
}

export function emptyJournal(): Journal {
  return { past: [], future: [] };
}

/** 成功应用后记录：push past、清空 future、FIFO 淘汰超限项。 */
export function record(
  journal: Journal,
  entry: JournalEntry,
  max: number = MAX_JOURNAL,
): Journal {
  const past = [...journal.past, entry];
  const evicted = past.length > max ? past.slice(past.length - max) : past;
  return { past: evicted, future: [] };
}

/**
 * 撤销/重做的结果。
 *
 * **`error` 用的是"空值五义"那套约定**（2026-10-01 复审补的）：
 * - `error` **缺席** = 没有可撤销/重做的内容（栈空）。**这不是失败**，不该被当成失败呈现。
 * - `error` **在场** = 那条事务真的应用失败了，带回它自己的 `ApplyError`
 *   （`node_not_found` / `index_out_of_range` / `edge_dangling` / `duplicate_node` …）。
 *
 * 原先失败分支是裸 `{ ok: false }`，`redo` 把 `applyFn` 的失败直接吞掉，
 * 于是**"事务应用失败"与"没有可重做的"不可区分**——而本文件 `redo` 上方那句
 * 「I5 确定性保证结果一致」指的正是这件事：确定性只能靠"失败时为什么失败"才谈得上。
 * 加字段是**加法**（旧调用方 `if (!r.ok)` 照旧工作），不是改语义。
 */
export type UndoRedoResult =
  | { ok: true; draft: Draft; journal: Journal }
  | { ok: false; error?: ApplyError };

/**
 * `current` 保留在签名里但**不再被读取**（2026-10-01 复审）：修掉那处静默空操作后，
 * 返回的快照来自 `last.before`、写进 future 的也来自 `last.before`，`current` 就没有用处了。
 * 保留它是为了让 `undo(current, j)` / `redo(current, j, applyFn)` 在调用点读起来是一对
 * ——"你正从哪个状态撤销"本身是这次操作的意思。**别再把 `current` 写回 future**：
 * 那正是"第二次 undo 是空操作却报成功"的成因（见下面那行注释）。
 */
export function journalUndo(_current: Draft, journal: Journal): UndoRedoResult {
  const last = journal.past[journal.past.length - 1];
  if (!last) return { ok: false };
  return {
    ok: true,
    draft: last.before,
    journal: {
      past: journal.past.slice(0, -1),
      future: [
        ...journal.future,
        // future 条目会被 `redo` 原样提升进 past（`past: [...past, next]`），
        // 所以它此刻就必须是一**条合法的 past 条目**：`before` 必须是「这条事务被应用到哪个状态上」，
        // 也就是 `last.before`，**不是** `current`（那是事务应用**之后**的状态）。
        // 2026-10-01 复审修掉的静默缺陷：原写 `before: current` ⇒ apply→undo→redo 之后
        // `past[0].before` 是 rev=1，于是第二次 undo 原样返回 rev=1 ——**空操作却报 ok:true**，
        // 而 UI 会显示「已撤销」。顺带修好了本文件第 15 行那条不变量
        // （`rev` = `before.rev`）：写 `current` 时 `current.rev === last.rev + 1`，自相矛盾。
        { envelope: last.envelope, rev: last.rev, before: last.before },
      ],
    },
  };
}

/** redo：把未来栈顶的事务重新应用到当前 Draft（I5 确定性保证结果一致）。 */
export function redo(
  current: Draft,
  journal: Journal,
  applyFn: (draft: Draft, envelope: Envelope) => ApplyResult,
): UndoRedoResult {
  const next = journal.future[journal.future.length - 1];
  if (!next) return { ok: false };
  const result = applyFn(current, next.envelope);
  // 失败要把原因带出去（见 UndoRedoResult 的约定）：原先裸 `{ ok: false }`
  // 让"这条事务应用失败"和"没有可重做的"在调用方眼里完全一样。
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    draft: result.draft,
    journal: {
      past: [...journal.past, next],
      future: journal.future.slice(0, -1),
    },
  };
}
