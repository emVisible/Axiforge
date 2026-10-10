import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadLlmSettings, saveLlmSettings } from "./llmSettings";

/**
 * 桌面端本机模型端点（宪章 S13-4）。头注里两条承诺此前零判据：
 * ①「未配置 = 不启用模型，走本地规则引擎」——它是 `null` 而不是空对象，
 *   因为下游 `draftDispatch` 用「有没有配置」决定走不走模型；
 * ② 这份配置**不属于任何一部作品**，所以 key 里没有 projectId（跨工程跟着用户走）。
 * 读侧的校验是 fail-closed 的（认不出的 kind 就整份当没配），这一族正是本仓反复踩过的
 * `?? 默认值` 静默兜底的反面，值得单独钉住，别被"顺手加个默认"改回去。
 */
const KEY = "axiforge:llm-endpoint";
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
});

describe("loadLlmSettings", () => {
  it("没配过是 null（不是空对象、也不是默认端点）", () => {
    expect(loadLlmSettings()).toBeNull();
  });

  it("kind 认不出白名单时整份当作没配（fail-closed，不降级成 ollama）", () => {
    store.set(
      KEY,
      JSON.stringify({ kind: "lmstudio", baseUrl: "http://x:1234", model: "m" }),
    );
    expect(loadLlmSettings()).toBeNull();
  });

  it("缺 baseUrl 或缺 model 都是没配，空串也算缺", () => {
    store.set(KEY, JSON.stringify({ kind: "ollama", model: "m" }));
    expect(loadLlmSettings()).toBeNull();
    store.set(KEY, JSON.stringify({ kind: "ollama", baseUrl: "http://x:11434" }));
    expect(loadLlmSettings()).toBeNull();
    store.set(KEY, JSON.stringify({ kind: "ollama", baseUrl: "", model: "m" }));
    expect(loadLlmSettings()).toBeNull();
  });

  it("坏 JSON 不抛，退成没配", () => {
    store.set(KEY, "{不是 json");
    expect(loadLlmSettings()).toBeNull();
  });

  it("尾部斜杠在**读侧**归一，中间不动；写侧原样落盘", () => {
    store.set(
      KEY,
      JSON.stringify({ kind: "openai", baseUrl: "http://x:8000/v1///", model: "m" }),
    );
    expect(loadLlmSettings()?.baseUrl).toBe("http://x:8000/v1");
    saveLlmSettings({ kind: "openai", baseUrl: "http://x:8000/v1/", model: "m" });
    expect(JSON.parse(store.get(KEY) as string).baseUrl).toBe("http://x:8000/v1/");
    expect(loadLlmSettings()?.baseUrl).toBe("http://x:8000/v1");
  });

  it("往返保真，且这是一份跨工程配置（key 里没有 projectId 那一段）", () => {
    saveLlmSettings({ kind: "ollama", baseUrl: "http://x:11434", model: "qwen3" });
    expect(store.size).toBe(1);
    expect([...store.keys()]).toEqual([KEY]);
    expect(loadLlmSettings()).toEqual({
      kind: "ollama",
      baseUrl: "http://x:11434",
      model: "qwen3",
    });
  });
});

describe("saveLlmSettings", () => {
  it("传 null 是删掉那把 key，不是往里写 \"null\"", () => {
    saveLlmSettings({ kind: "ollama", baseUrl: "http://x:11434", model: "m" });
    saveLlmSettings(null);
    expect(store.has(KEY)).toBe(false);
    expect(loadLlmSettings()).toBeNull();
  });
});
