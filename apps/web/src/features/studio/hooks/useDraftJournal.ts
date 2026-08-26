import { useCallback, useRef } from "react";
import {
  apply,
  createDraft,
  emptyJournal,
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
 * 过渡态设计（Phase 1b，宪章「单一写入口落地」第一步）：
 * - Draft 是脚本编辑的**事务校验 + 记序层**，React Flow 的 nodes state 仍是
 *   渲染镜像；二者经 dispatch() 单一入口保持一致。
 * - 未保存节点（new-/copy- 前缀）不在 Draft 中，apply 拒绝时调用方保持
 *   旧路径语义（仅视图更新、不入日志）——零行为变更的绞杀者接缝。
 * - 下一波次：Draft 升级为图的唯一持有者，nodes 降级为 useMemo 投影。
 */
export function useDraftJournal() {
  const draftRef = useRef<Draft>(createDraft({}));
  const journalRef = useRef<Journal>(emptyJournal());

  /** 从服务端工程重建 Draft（装载/保存刷新后的唯一同步点；journal 历史保留） */
  const sync = useCallback((next: Draft) => {
    draftRef.current = next;
  }, []);

  /** 唯一写入口：应用事务并记入日志（I4 原子；失败返回 ok:false，不产生半状态） */
  const dispatch = useCallback((tx: Transaction, origin: Origin): ApplyResult => {
    const before = draftRef.current;
    const result = apply(before, { tx, origin });
    if (result.ok) {
      draftRef.current = result.draft;
      journalRef.current = record(journalRef.current, {
        envelope: { tx, origin },
        rev: before.rev,
        before,
      });
    }
    return result;
  }, []);

  return { sync, dispatch };
}
