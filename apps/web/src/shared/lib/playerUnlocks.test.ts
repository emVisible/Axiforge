import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoryPackage } from "@axiforge/core";
import {
  collectGalleryAssets,
  loadUnlocks,
  saveUnlocks,
  unlockBgm,
  unlockCg,
} from "./playerUnlocks";

/**
 * `playerUnlocks` 此前零判据：鉴赏面板的"这件解锁了没有"整块读径没人挡。
 * vitest 的 web 档跑在 `environment: "node"`（没有 localStorage，
 * 见 `shared/storage/axspImport.rollback.test.ts` 的头注），所以这里自带一份可检查的替身——
 * 断言不只读返回值，还读**写进存储的那份原文**：只断返回值会放过"返回对了但没落盘"这一类。
 */
const store = new Map<string, string>();
/**
 * 「不重新写盘」只能靠数写入次数判（2026-10-09 补）：重写同样内容得到的字符串与原来**相等**，
 * 原先那条 `toBe(before)` 挡不住"照常写一遍同样的值"，所以它当时只测到了"内容没变"那一半。
 */
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

const KEY = (projectId: string) => `axiforge:player-unlocks:${projectId}`;
const raw = (projectId: string) => store.get(KEY(projectId));

describe("loadUnlocks", () => {
  it("没存过就是两份空清单（空态与「解锁过又清空」在这里同形，界面靠同一份形状说话）", () => {
    expect(loadUnlocks("p1")).toEqual({ cgs: [], bgms: [] });
  });

  it("存进去的坏 JSON 不抛，退成空清单", () => {
    store.set(KEY("p1"), "{不是 json");
    expect(loadUnlocks("p1")).toEqual({ cgs: [], bgms: [] });
  });

  it("某一族不是数组时归零，另一族照读", () => {
    store.set(KEY("p1"), JSON.stringify({ cgs: "a.png", bgms: ["b.mp3"] }));
    expect(loadUnlocks("p1")).toEqual({ cgs: [], bgms: ["b.mp3"] });
  });
});

describe("unlockCg / unlockBgm", () => {
  it("解锁追加进各自的族并落盘，返回的就是落的那份", () => {
    expect(unlockCg("p1", "a.png").cgs).toEqual(["a.png"]);
    expect(JSON.parse(raw("p1") as string)).toEqual({ cgs: ["a.png"], bgms: [] });
    expect(unlockBgm("p1", "b.mp3").bgms).toEqual(["b.mp3"]);
    expect(JSON.parse(raw("p1") as string)).toEqual({ cgs: ["a.png"], bgms: ["b.mp3"] });
  });

  it("同一路径重复解锁只有一条，且不重新写盘", () => {
    unlockCg("p1", "a.png");
    const before = raw("p1");
    const writesBefore = writes;
    expect(unlockCg("p1", "a.png").cgs).toEqual(["a.png"]);
    expect(writes).toBe(writesBefore);
    expect(raw("p1")).toBe(before);
  });

  it("空路径既不追加也不落盘（否则画廊里会多出一张没有图的解锁）", () => {
    expect(unlockCg("p1", "").cgs).toEqual([]);
    expect(raw("p1")).toBeUndefined();
    expect(unlockBgm("p1", "").bgms).toEqual([]);
    expect(raw("p1")).toBeUndefined();
  });

  it("解锁按作品分开：乙读不到甲的那条", () => {
    unlockCg("甲", "a.png");
    expect(loadUnlocks("乙")).toEqual({ cgs: [], bgms: [] });
    expect(loadUnlocks("甲").cgs).toEqual(["a.png"]);
  });

  it("saveUnlocks 整体覆盖（不清 key、也不追加）", () => {
    unlockCg("p1", "a.png");
    saveUnlocks("p1", { cgs: ["z.png"], bgms: ["y.mp3"] });
    expect(loadUnlocks("p1")).toEqual({ cgs: ["z.png"], bgms: ["y.mp3"] });
  });
});

describe("collectGalleryAssets", () => {
  /**
   * 这个函数只读 `pkg.beats[].script` 与 `pkg.scenes[].backgroundImage`，
   * 所以夹具只桩到这两处；完整的包由 core 的构造负责，不在这里重复校验类型。
   */
  const pkgWith = (beats: unknown[], scenes: unknown[]) =>
    ({ beats, scenes }) as unknown as StoryPackage;

  it("bg 的 image 进 cgs、bgm 的 track 进 bgms，跨拍同名去重", () => {
    const pkg = pkgWith(
      [
        { script: [{ op: "bg", image: "a.png" }, { op: "bgm", track: "b.mp3" }] },
        { script: [{ op: "bg", image: "a.png" }, { op: "bg", image: "c.png" }] },
      ],
      [],
    );
    expect(collectGalleryAssets(pkg)).toEqual({ cgs: ["a.png", "c.png"], bgms: ["b.mp3"] });
  });

  it("场景背景也算可鉴赏的 CG；缺字段的指令不产条目", () => {
    const pkg = pkgWith(
      [{ script: [{ op: "bg" }, { op: "talk" }] }],
      [{ backgroundImage: "s.png" }, {}],
    );
    expect(collectGalleryAssets(pkg)).toEqual({ cgs: ["s.png"], bgms: [] });
  });
});
