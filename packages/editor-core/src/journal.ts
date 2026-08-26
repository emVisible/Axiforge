/**
 * L2 Journal：有界事务日志（KERNEL_DESIGN §2.3）。
 *
 * 一份日志买四样东西：undo/redo、ADR-025 dirty 记序、崩溃恢复、测试回放。
 * 不变量 I7：有界（默认 200），FIFO 淘汰，无静默无限增长。
 */

import type { ApplyResult, Draft, Envelope } from "./types";

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

export type UndoRedoResult =
  | { ok: true; draft: Draft; journal: Journal }
  | { ok: false };

export function journalUndo(current: Draft, journal: Journal): UndoRedoResult {
  const last = journal.past[journal.past.length - 1];
  if (!last) return { ok: false };
  return {
    ok: true,
    draft: last.before,
    journal: {
      past: journal.past.slice(0, -1),
      future: [
        ...journal.future,
        { envelope: last.envelope, rev: last.rev, before: current },
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
  if (!result.ok) return { ok: false };
  return {
    ok: true,
    draft: result.draft,
    journal: {
      past: [...journal.past, next],
      future: journal.future.slice(0, -1),
    },
  };
}
