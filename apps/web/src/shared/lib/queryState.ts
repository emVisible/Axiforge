/**
 * 从 TanStack Query 的原始信号折成一个互斥态。
 *
 * 状态词表与选择逻辑在 @axiforge/ui 的 queryState（那里还挂着 QueryStatePanel），
 * 本文件只保留「怎么从 isLoading/error/count 判定」这一件事——
 * 词表若在两处各写一遍，就会有第三处开始各说各话。
 */
import type { QueryState } from "@axiforge/ui";

export type { QueryState };

export function resolveQueryState(input: {
  isLoading?: boolean;
  error?: unknown;
  count: number;
}): QueryState {
  if (input.isLoading) return "loading";
  if (input.error) return "error";
  return input.count === 0 ? "empty" : "ready";
}
