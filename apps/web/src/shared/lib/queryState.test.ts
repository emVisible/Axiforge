import { describe, expect, it } from "vitest";
import { resolveQueryState } from "./queryState";

/** 四态互斥：一次判定只能落在一个态，错误永远压过空态（桌面离线实测缺陷的回归） */
describe("resolveQueryState", () => {
  it("加载中优先于一切（含 error 与 count）", () => {
    expect(resolveQueryState({ isLoading: true, count: 0 })).toBe("loading");
    expect(resolveQueryState({ isLoading: true, error: new Error("x"), count: 5 })).toBe(
      "loading",
    );
  });

  it("有错误时判 error，即使数据为空——不得显示「你还没有」", () => {
    expect(resolveQueryState({ error: new Error("io"), count: 0 })).toBe("error");
    expect(resolveQueryState({ error: "truthy string", count: 3 })).toBe("error");
  });

  it("无错无载且零条 = empty；有条目 = ready", () => {
    expect(resolveQueryState({ count: 0 })).toBe("empty");
    expect(resolveQueryState({ count: 1 })).toBe("ready");
    expect(resolveQueryState({ error: null, isLoading: false, count: 2 })).toBe("ready");
  });

  it("四态互斥：任意输入组合只产出唯一一态", () => {
    const seen = new Set<string>();
    for (const isLoading of [true, false, undefined]) {
      for (const error of [null, undefined, new Error("e")]) {
        for (const count of [0, 7]) {
          seen.add(resolveQueryState({ isLoading, error, count }));
        }
      }
    }
    expect([...seen].sort()).toEqual(["empty", "error", "loading", "ready"]);
  });
});
