import { useCallback, useRef, useState } from "react";
import {
  apply,
  createDraft,
  emptyJournal,
  journalUndo,
  record,
  type ApplyResult,
  type Draft,
  type Journal,
  type Origin,
  type Transaction,
} from "@axiforge/editor-core";

/**
 * L5 适配器：editor-core Draft/Journal 在 React 侧的持有者。
 *
 * Draft 是图的唯一持有者（useState 驱动重渲染）；React Flow 节点/边
 * 均为投影。拖拽过程的高频位置写入走组件侧临时层，dragStop 经
 * dispatch(node.move) 提交（KERNEL_DESIGN §2.2 单一写入口）。
 */
export function useDraftJournal() {
  const [draft, setDraft] = useState<Draft>(createDraft({}));
  const draftRef = useRef<Draft>(draft);
  const journalRef = useRef<Journal>(emptyJournal());

  /** 从服务端工程重建 Draft（装载/保存刷新后的唯一同步点；journal 历史保留） */
  const sync = useCallback((next: Draft) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  /** 唯一写入口：应用事务并记入日志（I4 原子；失败返回 ok:false，不产生半状态） */
  const dispatch = useCallback((tx: Transaction, origin: Origin): ApplyResult => {
    const before = draftRef.current;
    const result = apply(before, { tx, origin });
    if (result.ok) {
      draftRef.current = result.draft;
      setDraft(result.draft);
      journalRef.current = record(journalRef.current, {
        envelope: { tx, origin },
        rev: before.rev,
        before,
      });
    }
    return result;
  }, []);

  /** 撤销：Journal 指针回退（数据事务粒度；拖拽未提交前不可撤销属预期） */
  const undo = useCallback((): boolean => {
    const result = journalUndo(draftRef.current, journalRef.current);
    if (!result.ok) return false;
    draftRef.current = result.draft;
    setDraft(result.draft);
    journalRef.current = result.journal;
    return true;
  }, []);

  return { draft, sync, dispatch, undo };
}
