/**
 * 匿名玩家标识（ADR-006 可迁移匿名身份）
 *
 * 客户端生成一个持久 token 存于 localStorage，作为存档归属。
 * v1.5 起可在登录时把该 token 下的存档迁移到账号。
 */
/** 与 `CREATOR_ID_KEY` 同理：这个键名是玩家存档归属的位置，改名等于丢档，故只此一处。 */
export const PLAYER_TOKEN_KEY = "axiforge.playerToken";

export function getPlayerToken(): string {
  try {
    let token = localStorage.getItem(PLAYER_TOKEN_KEY);
    if (!token) {
      token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(PLAYER_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // localStorage 不可用（隐私模式等）：退化为进程内一次性 token
    return `ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}
