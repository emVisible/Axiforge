import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAxsText, LlmError, stripCodeFence } from "./localLlm";
import type { LlmSettings } from "@/shared/lib/llmSettings";

const OLLAMA: LlmSettings = { kind: "ollama", baseUrl: "http://localhost:11434", model: "qwen2.5" };
const OPENAI: LlmSettings = { kind: "openai", baseUrl: "http://127.0.0.1:8000/v1", model: "deepseek" };

const fetchMock = vi.fn();
const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const posted = () => JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

describe("ollama 通路", () => {
  it("打 /api/generate，body 是 {model, system, prompt, stream:false}，取 response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ response: "# 拍\n甲: 你好\n" }));
    const out = await generateAxsText(OLLAMA, "SYS", "USER");

    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost:11434/api/generate");
    expect(posted()).toEqual({ model: "qwen2.5", system: "SYS", prompt: "USER", stream: false });
    expect(out).toBe("# 拍\n甲: 你好");
  });

  it("尾斜杠不重复拼，也不留双斜杠", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ response: "x" }));
    await generateAxsText({ ...OLLAMA, baseUrl: "http://localhost:11434/" }, "s", "u");
    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost:11434/api/generate");
  });

  it("缺 response 字段报 bad_response，而不是返回 undefined 让上层拿到空草稿", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "model not found" }));
    await expect(generateAxsText(OLLAMA, "s", "u")).rejects.toThrow(/model not found/);
  });
});

describe("openai 兼容通路", () => {
  it("打 /chat/completions，走 messages 数组，取 choices[0].message.content", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "# 拍\n甲: 你好\n" } }] }),
    );
    const out = await generateAxsText(OPENAI, "SYS", "USER");

    expect(fetchMock.mock.calls[0]![0]).toBe("http://127.0.0.1:8000/v1/chat/completions");
    expect(posted().messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "USER" },
    ]);
    expect(out).toBe("# 拍\n甲: 你好");
  });
});

describe("失败语义（桌面最常见的两种）", () => {
  it("fetch 本身抛错（连不上 / CORS 被挡）归为 llm_unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(generateAxsText(OLLAMA, "s", "u")).rejects.toMatchObject({ code: "llm_unavailable" });
  });

  it("HTTP 非 2xx 也归为 llm_unavailable，并把状态码带进原因", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));
    await expect(generateAxsText(OLLAMA, "s", "u")).rejects.toThrow(/返回 500/);
  });

  it("响应不是 JSON 时报错，不把异常甩成 unhandled", async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    })) as unknown as typeof fetch;
    await expect(generateAxsText(OLLAMA, "s", "u")).rejects.toMatchObject({
      code: "llm_bad_response",
    });
  });

  it("模型只回了围栏和空白 = 空产物，按失败处理", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ response: "```axs\n   \n```" }));
    await expect(generateAxsText(OLLAMA, "s", "u")).rejects.toMatchObject({ code: "llm_empty_output" });
  });

  it("错误对象带 code，调用方据此决定退回规则而不是猜字符串", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    const err = await generateAxsText(OLLAMA, "s", "u").catch((e) => e);
    expect(err).toBeInstanceOf(LlmError);
    expect(err.code).toBe("llm_unavailable");
  });
});

describe("stripCodeFence", () => {
  it("只剥包住整段的一对围栏", () => {
    expect(stripCodeFence("```axs\n# 拍\n甲: 你好\n```")).toBe("# 拍\n甲: 你好");
    expect(stripCodeFence("# 拍\n甲: 你好")).toBe("# 拍\n甲: 你好");
  });

  it("正文中间的围栏是内容，不动", () => {
    const inner = "# 拍\n```\n引用\n```\n甲: 你好";
    expect(stripCodeFence(inner)).toBe(inner);
  });
});
