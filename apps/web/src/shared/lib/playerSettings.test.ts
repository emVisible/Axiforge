import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLAYER_SETTINGS,
  loadPlayerSettings,
  savePlayerSettings,
} from "./playerSettings";

/**
 * `playerSettings.ts` 的第一行注释承诺「按作品存 localStorage」。点击层有 E55 看着界面上
 * 的滑条存得住，但模块本身的三条语义此前零判据：默认值补齐、读侧兜坏数据、返回的是不是副本。
 * 断言既读返回值也读落盘原文（web 档 vitest 是 `environment: "node"`，localStorage 靠替身）。
 */
const KEY = (projectId: string) => `axiforge:player-settings:${projectId}`;
const store = new Map<string, string>();
const raw = (projectId: string) => store.get(KEY(projectId));

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

describe("loadPlayerSettings", () => {
  it("没存过就是默认值，且给的是副本（改它不许污染模块级默认）", () => {
    const first = loadPlayerSettings("p1");
    expect(first).toEqual(DEFAULT_PLAYER_SETTINGS);
    first.bgmVolume = 0.11;
    expect(DEFAULT_PLAYER_SETTINGS.bgmVolume).toBe(0.5);
    expect(loadPlayerSettings("p1").bgmVolume).toBe(0.5);
  });

  it("存过一半字段时，缺的那些按默认补齐，字段清单不增不减", () => {
    store.set(KEY("p1"), JSON.stringify({ bgmVolume: 0.2 }));
    const merged = loadPlayerSettings("p1");
    expect(merged.bgmVolume).toBe(0.2);
    expect(merged.textSpeedMs).toBe(DEFAULT_PLAYER_SETTINGS.textSpeedMs);
    expect(Object.keys(merged).sort()).toEqual(
      Object.keys(DEFAULT_PLAYER_SETTINGS).sort(),
    );
  });

  it("坏 JSON 不抛，退成默认值", () => {
    store.set(KEY("p1"), "{不是 json");
    expect(loadPlayerSettings("p1")).toEqual(DEFAULT_PLAYER_SETTINGS);
  });

  it("合并不校验类型：存进去什么形状就带出什么形状（特征化，不是承诺）", () => {
    store.set(KEY("p1"), JSON.stringify({ bgmVolume: null, textSpeedMs: "35" }));
    const leaked = loadPlayerSettings("p1") as unknown as Record<string, unknown>;
    expect(leaked.bgmVolume).toBeNull();
    expect(leaked.textSpeedMs).toBe("35");
    // 今天唯一的写入口是有类型的 savePlayerSettings，界面走不到这一格；
    // 若将来出现迁移/导入往这个 key 写东西，这条就是「值会直通到滑条与音量」的在册证据。
  });

  it("空 projectId 读不到东西，但模块自己不挡写（闸门在调用方的 if (projectId)）", () => {
    expect(loadPlayerSettings("")).toEqual(DEFAULT_PLAYER_SETTINGS);
    savePlayerSettings("", { ...DEFAULT_PLAYER_SETTINGS, skipRead: true });
    expect(store.has(KEY(""))).toBe(true);
  });
});

describe("savePlayerSettings", () => {
  it("落盘的就是那一份完整设置，读回来一字不差", () => {
    const next = { ...DEFAULT_PLAYER_SETTINGS, skipRead: true, seVolume: 0.1 };
    savePlayerSettings("p1", next);
    expect(JSON.parse(raw("p1") as string)).toEqual(next);
    expect(loadPlayerSettings("p1")).toEqual(next);
  });

  it("按作品分开：乙读不到甲的那份，也不替甲占 key", () => {
    savePlayerSettings("甲", { ...DEFAULT_PLAYER_SETTINGS, bgmVolume: 0 });
    expect(loadPlayerSettings("甲").bgmVolume).toBe(0);
    expect(loadPlayerSettings("乙")).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(store.has(KEY("乙"))).toBe(false);
  });

  it("存储不可用时写侧直接抛（与读侧的 catch 不同义；这条红了说明有人把失败改成了静默）", () => {
    const boom = () => {
      throw new Error("storage blocked");
    };
    vi.stubGlobal("localStorage", {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
      clear: boom,
    });
    expect(() =>
      savePlayerSettings("p1", { ...DEFAULT_PLAYER_SETTINGS, skipRead: true }),
    ).toThrow();
    expect(loadPlayerSettings("p1")).toEqual(DEFAULT_PLAYER_SETTINGS);
  });
});
