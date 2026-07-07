/**
 * 匿名创作者标识（ADR-006）
 *
 * 与 playerToken 对称：客户端持久化，v1.5 起作为 author_id 写入作品。
 * 后续可迁移到邮箱账号。
 */
const KEY = "axiforge.creatorId";

export function getCreatorId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `creator-${crypto.randomUUID()}`
          : `creator-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `creator-ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}
