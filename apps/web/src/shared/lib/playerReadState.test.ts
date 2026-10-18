import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isLineRead,
  lineKey,
  loadReadLines,
  markLineRead,
} from "./playerReadState";

/**
 * 「跳过已读」的本地读径（`playerReadState.ts`，头注同样承诺「按作品存 localStorage」）。
 * 界面侧只有 E54 那类"看得见台词"的判据，这一份"哪些行算读过"此前零判据。
 * 断言既看 `Set` 也看**落盘的数组原文**：这里存的是数组而不是 Set，顺序就是插入顺序。
 */
const KEY = (projectId: string) => `axiforge:player-read:${projectId}`;
const store = new Map<string, string>();
/** 「不重新写盘」只能靠数写入次数判：重写同样内容得到的字符串与原来**相等**，`toBe` 挡不住。 */
let writes = 0;

beforeEach(() => {
  store.clear();
  writes = 0;
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
      writes += 1;
    },
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

describe("lineKey", () => {
  it("键是 `拍id:游标` 两段", () => {
    expect(lineKey("b1", 0)).toBe("b1:0");
  });

  it("拍 id 为空时用 `?` 哨兵，且它与真 id 共用同一个命名空间（特征化，不是承诺）", () => {
    expect(lineKey(null, 3)).toBe("?:3");
    expect(lineKey(null, 0)).toBe(lineKey("?", 0));
    // 今天 `currentLineKey` 只在引擎停在 say 那行时才生成（PlayerPage 的 useMemo 挡着），
    // 而 say 一定在某个拍里，所以这格撞不到；撞车需要一个恰好为 `?` 的拍 id——我没测标题派生能不能产出它。
    // 这一条钉的是事实本身：一旦哪天有 say 落在拍外，它们的已读标记会共享 `?:n` 而互相跳过。
  });
});

describe("markLineRead / isLineRead / loadReadLines", () => {
  it("没读过就是空集合，`isLineRead` 为假", () => {
    expect([...loadReadLines("p1")]).toEqual([]);
    expect(isLineRead("p1", "b1:0")).toBe(false);
  });

  it("标记后读得回，且落盘的是那份数组原文", () => {
    markLineRead("p1", "b1:0");
    markLineRead("p1", "b1:1");
    expect(isLineRead("p1", "b1:0")).toBe(true);
    expect([...loadReadLines("p1")]).toEqual(["b1:0", "b1:1"]);
    expect(JSON.parse(store.get(KEY("p1")) as string)).toEqual(["b1:0", "b1:1"]);
  });

  it("重复标记不重新写盘（与 `unlockCg` 同律：内容没变就不碰存储）", () => {
    markLineRead("p1", "b1:0");
    const before = store.get(KEY("p1"));
    const writesBefore = writes;
    markLineRead("p1", "b1:0");
    expect(writes).toBe(writesBefore);
    expect(store.get(KEY("p1"))).toBe(before);
    expect([...loadReadLines("p1")]).toEqual(["b1:0"]);
  });

  it("坏 JSON 与非数组都退成空集合，不抛", () => {
    store.set(KEY("p1"), "{不是 json");
    expect(loadReadLines("p1")).toBeInstanceOf(Set);
    expect([...loadReadLines("p1")]).toEqual([]);
    store.set(KEY("p1"), JSON.stringify({ 0: "b1:0" }));
    expect([...loadReadLines("p1")]).toEqual([]);
    expect(isLineRead("p1", "b1:0")).toBe(false);
  });

  it("按作品分开：乙读不到甲读过的行", () => {
    markLineRead("甲", "b1:0");
    expect(isLineRead("乙", "b1:0")).toBe(false);
    expect([...store.keys()]).toEqual([KEY("甲")]);
  });
});
