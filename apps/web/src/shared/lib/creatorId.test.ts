import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATOR_ID_KEY, getCreatorId } from "./creatorId";

/**
 * `getCreatorId` 是本地持久层的身份源（二十余处 import 它的文件都拿它当 `author_id`），
 * 此前零判据。断言一律同时读**写进存储的原文**：身份「这次返回对了但没落盘」
 * 在下一次启动就变成两个人，而只断返回值恰好看不见这一类。
 * web 档 vitest 跑在 `environment: "node"`（无 localStorage），故自带一份可检查的替身。
 */
const KEY = "axiforge.creatorId";
const store = new Map<string, string>();
const realCrypto = globalThis.crypto;
const UUID_SHAPE =
  /^creator-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

describe("getCreatorId", () => {
  it("第一次调用铸造身份并落盘，之后再调还是同一个", () => {
    const first = getCreatorId();
    expect(first.startsWith("creator-")).toBe(true);
    expect(store.get(KEY)).toBe(first);
    expect(getCreatorId()).toBe(first);
  });

  it("已有身份直接沿用，不重新铸造、不改写", () => {
    store.set(KEY, "creator-存量身份");
    expect(getCreatorId()).toBe("creator-存量身份");
    expect(store.get(KEY)).toBe("creator-存量身份");
  });

  it("存成空串时重铸，并把新值写回（否则每次启动都是新身份）", () => {
    store.set(KEY, "");
    const id = getCreatorId();
    expect(id.startsWith("creator-")).toBe(true);
    expect(store.get(KEY)).toBe(id);
  });

  it("宿主有 randomUUID 时是 uuid 形状；探针控制位先确认这个能力真在", () => {
    expect("randomUUID" in globalThis.crypto).toBe(true);
    expect(getCreatorId()).toMatch(UUID_SHAPE);
  });

  it("宿主没有 randomUUID 时退到时间戳+随机串，仍然落盘、仍然带前缀", () => {
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
      writable: true,
    });
    expect("randomUUID" in globalThis.crypto).toBe(false);
    const id = getCreatorId();
    expect(id).toMatch(/^creator-\d+-/);
    expect(id).not.toMatch(UUID_SHAPE);
    expect(store.get(KEY)).toBe(id);
  });

  it("存储不可用时退成一次性身份：不落盘、且每次调用都换一个（特征化，不是承诺）", () => {
    const boom = () => {
      throw new Error("storage blocked");
    };
    vi.stubGlobal("localStorage", {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
      clear: boom,
    });
    const a = getCreatorId();
    const b = getCreatorId();
    expect(a).toMatch(/^creator-ephemeral-/);
    expect(b).not.toBe(a);
    expect(store.size).toBe(0);
  });

  it("键名的值本身钉住：它是用户机器上既有身份的位置，改名等于全员丢身份", () => {
    expect(CREATOR_ID_KEY).toBe(KEY);
  });

  it("登录／恢复身份那几条通路按同一个常量写，读侧就认得（原先有四处手抄同一串）", () => {
    store.set(CREATOR_ID_KEY, "creator-从云端恢复的");
    expect(getCreatorId()).toBe("creator-从云端恢复的");
    expect(store.get(KEY)).toBe("creator-从云端恢复的");
  });
});
