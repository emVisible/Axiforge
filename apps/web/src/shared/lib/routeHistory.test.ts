import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadRouteHistory,
  recordChoice,
  recordEnding,
  saveRouteHistory,
} from "./routeHistory";

/**
 * 分支回想（`routeHistory.ts`，头注同样写着「按作品存 localStorage」）。
 * 界面侧 E54 只管"回顾里看得见台词"，这一份"走过哪些分支、到过哪些结尾"此前零判据。
 * 这里最值得钉的是**两个 record 的律不一样**：`recordChoice` 不去重（一次通关的选择是序列），
 * `recordEnding` 去重（结尾是集合）。只测一个的话，另一个被顺手改成同律也看不见。
 */
const KEY = (projectId: string) => `axiforge:route-history:${projectId}`;
const store = new Map<string, string>();
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

afterEach(() => {
  vi.useRealTimers();
});

const raw = (projectId: string) => JSON.parse(store.get(KEY(projectId)) as string);

describe("recordChoice", () => {
  it("同拍同选项记两次就是两条：选择是序列，不是集合", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
    const h = recordChoice("p1", "b2", "推开左边的门");
    expect(recordChoice("p1", "b2", "推开左边的门").choices).toHaveLength(2);
    expect(h.choices[0]).toEqual({
      beatId: "b2",
      label: "推开左边的门",
      at: "2026-01-02T03:04:05.000Z",
    });
  });

  it("按顺序追加，且落盘的原文就是那份结构", () => {
    recordChoice("p1", "b1", "一");
    const h = recordChoice("p1", "b2", "二");
    expect(h.choices.map((c) => c.beatId)).toEqual(["b1", "b2"]);
    expect(raw("p1").choices.map((c: { label: string }) => c.label)).toEqual([
      "一",
      "二",
    ]);
  });
});

describe("recordEnding", () => {
  it("同一个结尾去过几次都只有一条（与 recordChoice 刻意不同律）", () => {
    recordEnding("p1", "和解结局");
    const h = recordEnding("p1", "和解结局");
    expect(h.endings).toEqual(["和解结局"]);
    recordEnding("p1", "分离结局");
    expect(loadRouteHistory("p1").endings).toEqual(["和解结局", "分离结局"]);
  });

  it("但重复记 ending 仍会重写一遍存储（不像 unlockCg 那样跳过写）", () => {
    recordEnding("p1", "和解结局");
    const before = writes;
    recordEnding("p1", "和解结局");
    expect(writes).toBe(before + 1);
    expect(raw("p1").endings).toEqual(["和解结局"]);
  });
});

describe("loadRouteHistory / saveRouteHistory", () => {
  it("没记过是两份空清单；某一族不是数组时只归零那一族", () => {
    expect(loadRouteHistory("p1")).toEqual({ choices: [], endings: [] });
    store.set(KEY("p1"), JSON.stringify({ choices: "不是数组", endings: ["乙"] }));
    expect(loadRouteHistory("p1")).toEqual({ choices: [], endings: ["乙"] });
  });

  it("坏 JSON 退成空清单，不抛", () => {
    store.set(KEY("p1"), "{不是 json");
    expect(loadRouteHistory("p1")).toEqual({ choices: [], endings: [] });
  });

  it("save 是整体覆盖，且按作品分开", () => {
    recordChoice("甲", "b1", "一");
    saveRouteHistory("甲", { choices: [], endings: ["重来"] });
    expect(loadRouteHistory("甲")).toEqual({ choices: [], endings: ["重来"] });
    expect(loadRouteHistory("乙")).toEqual({ choices: [], endings: [] });
    expect([...store.keys()]).toEqual([KEY("甲")]);
  });
});
