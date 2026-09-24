/**
 * 四态互斥的单一裁决点（宪章 Q4「加载/空/错误/理想 四态齐全」）。
 *
 * 实测缺陷：桌面离线态角色页曾同时渲染「加载角色失败」与「你还没有创建角色」——
 * 把「取不到」显示成「你没有」，用户会以为数据丢了。四态若靠各页自己写 `&&`
 * 条件就会反复出现这种碰撞，所以这里只允许**一次命中一个态**。
 *
 * 选择逻辑刻意做成与渲染无关的纯函数：不引入 DOM/测试装置也能断言「只命中一个槽」，
 * 组件本身因此薄到没有可出错的分支。
 */

export type QueryState = "loading" | "error" | "empty" | "ready";

export interface QuerySlots<T> {
  loading: T;
  error: T;
  empty: T;
  ready: T;
}

/** 穷尽 switch：新增 QueryState 成员时编译器会强制这里一起补，杜绝「某态无人渲染」 */
export function pickQuerySlot<T>(
  state: QueryState,
  slots: QuerySlots<T>,
): T {
  switch (state) {
    case "loading":
      return slots.loading;
    case "error":
      return slots.error;
    case "empty":
      return slots.empty;
    case "ready":
      return slots.ready;
  }
}

/** 未知错误对象的兜底文案——不得把 undefined 渲染成空白 */
export function queryErrorMessage(error: unknown, fallback = "加载失败"): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
