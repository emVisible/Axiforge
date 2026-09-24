import type { ReactNode } from "react";

import ErrorDisplay from "./ErrorDisplay";
import LoadingSpinner from "./LoadingSpinner";
import { pickQuerySlot, queryErrorMessage, type QueryState } from "../queryState";

interface QueryStatePanelProps {
  /** 由 resolveQueryState 一类的单点判定给出；本组件不再自行推断状态 */
  state: QueryState;
  empty: ReactNode;
  children: ReactNode;
  loading?: ReactNode;
  errorTitle?: string;
  error?: unknown;
  onRetry?: () => void;
}

/**
 * 四态互斥渲染壳：一次只可能渲染一个分支。
 *
 * 页面只负责提供「这一态长什么样」，不再各写四个 `{state === "x" && ...}`——
 * 那种写法的失败方式是「ready 用另一个条件表达」，于是空态与理想态可能同时不渲染，
 * 屏幕留白而无人报错。
 */
export default function QueryStatePanel({
  state,
  empty,
  children,
  loading,
  errorTitle = "加载失败",
  error,
  onRetry,
}: QueryStatePanelProps) {
  return (
    <>
      {pickQuerySlot(state, {
        loading: loading ?? <LoadingSpinner />,
        error: (
          <ErrorDisplay
            message={queryErrorMessage(error, errorTitle)}
            onRetry={onRetry}
          />
        ),
        empty,
        ready: children,
      })}
    </>
  );
}
