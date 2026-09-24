/**
 * 查询态四态归一（宪章 Q4「加载/空/错误/理想 四态齐全」的可判定形态）。
 *
 * 实测缺陷：桌面离线态角色页同时渲染「加载角色失败」与「你还没有创建角色」——
 * 把「取不到」显示成「你没有」，用户会以为数据丢了。四态若靠各页自己写 `&&`
 * 条件就会反复出现这种碰撞，因此收敛成一个**互斥**的纯判定：一次只可能是一个态。
 */
export type QueryState = "loading" | "error" | "empty" | "ready";

export function resolveQueryState(input: {
  isLoading?: boolean;
  error?: unknown;
  count: number;
}): QueryState {
  if (input.isLoading) return "loading";
  if (input.error) return "error";
  return input.count === 0 ? "empty" : "ready";
}
