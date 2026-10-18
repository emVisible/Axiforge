import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATOR_ID_KEY, getCreatorId } from "./creatorId";
import { PLAYER_TOKEN_KEY, getPlayerToken } from "./playerToken";

/**
 * `getPlayerToken` 是玩家侧存档的归属键（「存档属于谁」全押在这一个值上），此前零判据。
 * 与 `creatorId.test.ts` 同形：断言既读返回值也读落盘原文，并各带一条探针控制位。
 */
const TOKEN_KEY = "axiforge.playerToken";
const CREATOR_KEY = "axiforge.creatorId";
const store = new Map<string, string>();
const realCrypto = globalThis.crypto;
const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(globalThis, "crypto", {
    get: () => realCrypto,
    configurable: true,
  });
});

describe("getPlayerToken", () => {
  it("第一次调用铸造 token 并落盘，之后再调还是同一个", () => {
    const first = getPlayerToken();
    expect(store.get(TOKEN_KEY)).toBe(first);
    expect(getPlayerToken()).toBe(first);
  });

  it("已有 token 直接沿用（改了铸造逻辑也不该覆盖玩家的既有存档归属）", () => {
    store.set(TOKEN_KEY, "存量-token");
    expect(getPlayerToken()).toBe("存量-token");
    expect(store.get(TOKEN_KEY)).toBe("存量-token");
  });

  it("token 是裸 uuid，不带 `creator-` 前缀；探针控制位先确认能力真在", () => {
    expect("randomUUID" in globalThis.crypto).toBe(true);
    expect(getPlayerToken()).toMatch(UUID_SHAPE);
  });

  it("宿主没有 randomUUID 时退到 `p-` 前缀的一次性形状，仍然落盘", () => {
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
      writable: true,
    });
    expect("randomUUID" in globalThis.crypto).toBe(false);
    const token = getPlayerToken();
    expect(token).toMatch(/^p-\d+-/);
    expect(token).not.toMatch(UUID_SHAPE);
    expect(store.get(TOKEN_KEY)).toBe(token);
  });

  it("存储不可用时退成一次性 token：不落盘、每次调用都换一个（特征化，不是承诺）", () => {
    const boom = () => {
      throw new Error("storage blocked");
    };
    vi.stubGlobal("localStorage", {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
      clear: boom,
    });
    const a = getPlayerToken();
    const b = getPlayerToken();
    expect(a).toMatch(/^ephemeral-/);
    expect(b).not.toBe(a);
    expect(store.size).toBe(0);
  });

  it("创作者身份与玩家 token 各存各的 key，互不覆盖", () => {
    const creator = getCreatorId();
    const token = getPlayerToken();
    expect(creator).not.toBe(token);
    expect(store.get(CREATOR_KEY)).toBe(creator);
    expect(store.get(TOKEN_KEY)).toBe(token);
    // 两个 key 若塌成一份，作品的 author_id 会和玩家存档归属互相改写
    expect(store.size).toBe(2);
  });

  it("两把身份键的值各自钉住：改名等于把机器上的既有身份与存档归属留在原地", () => {
    expect(PLAYER_TOKEN_KEY).toBe(TOKEN_KEY);
    expect(CREATOR_ID_KEY).toBe(CREATOR_KEY);
  });

  it("恢复身份／注销按同一个常量写删，读侧认得（这两处原先也是手抄的字面量）", () => {
    store.set(PLAYER_TOKEN_KEY, "token-从云端恢复的");
    expect(getPlayerToken()).toBe("token-从云端恢复的");
    store.set(CREATOR_ID_KEY, "creator-从云端恢复的");
    expect(getCreatorId()).toBe("creator-从云端恢复的");
  });
});
