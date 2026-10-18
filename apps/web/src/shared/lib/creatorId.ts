/**
 * 匿名创作者标识（ADR-006）
 *
 * 与 playerToken 对称：客户端持久化，v1.5 起作为 author_id 写入作品。
 * 后续可迁移到邮箱账号。
 */
/**
 * 键名是"用户机器上那份既有身份在哪儿"的位置，改名等于全员丢身份（本地作品库按 `author_id` 归主）。
 * 登录/恢复身份/注销的通路（`UserContext`、`identityLink`）都 import 这一个常量，不再各自抄字面量。
 */
export const CREATOR_ID_KEY = "axiforge.creatorId";

export function getCreatorId(): string {
  try {
    let id = localStorage.getItem(CREATOR_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `creator-${crypto.randomUUID()}`
          : `creator-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CREATOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `creator-ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}
