/**
 * 桌面端直连本机模型的客户端（宪章 S13-4）。
 *
 * 走 **webview 自己的 fetch**，不引 tauri-plugin-http——这是已锁定决策。代价如实写在这里：
 * Ollama 默认只接受同源请求，用户要自己把 `OLLAMA_ORIGINS` 设成允许 `tauri://localhost`
 * （或 `*`），否则请求会在 CORS 处失败。失败是可辨的（下面抛 `llm_unavailable`），
 * 文档给出解法，而不是偷偷加一个原生插件把这条约束藏起来。
 *
 * 只有"生成文本"这一件事在这里发生：**把文本读回 IR 一律走本端 `parseAxs`**（ADR-027）。
 * 服务端过去兼任第二个解析器的做法已经废除，这里不再制造一个新的。
 */

import type { LlmSettings } from "@/shared/lib/llmSettings";

export type LlmFailure = "llm_unavailable" | "llm_bad_response" | "llm_empty_output";

export class LlmError extends Error {
  constructor(readonly code: LlmFailure, detail: string) {
    super(`${code}: ${detail}`);
    this.name = "LlmError";
  }
}

/** 本机模型生成一段 AXS 的等待上限：比云端宽，因为 Ollama 首 token 可能要加载模型 */
const LLM_TIMEOUT_MS = 120_000;

interface OllamaGenerateResponse {
  response?: unknown;
  error?: unknown;
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: unknown } }[];
  error?: unknown;
}

function endpoint(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

function describeStatus(body: OllamaGenerateResponse | OpenAiChatResponse, fallback: string): string {
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return fallback;
}

/**
 * 只在"整段被一对代码围栏包住"时剥掉围栏。
 * 模型常在 `只输出 AXS 正文` 的指令下仍然加 ```axs —— 那是传输层噪声，不是内容；
 * 但正文中间的三反引号属于内容，不碰，交给解析器去判。
 */
export function stripCodeFence(raw: string): string {
  const t = raw.trim();
  const m = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(t);
  return m ? m[1]!.trim() : t;
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (cause) {
    // 连不上 / CORS 被挡 / 超时都落在这里——桌面端最常见的原因是没设 OLLAMA_ORIGINS
    throw new LlmError("llm_unavailable", `请求 ${url} 失败：${String((cause as Error)?.message ?? cause)}`);
  }
  if (!res.ok) throw new LlmError("llm_unavailable", `${url} 返回 ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new LlmError("llm_bad_response", `${url} 的响应不是合法 JSON`);
  }
}

/**
 * 让配置的模型把散文写成 canonical AXS 文本。
 * 返回的是**文本**，不是指令数组：调用方要么本地 parse（模型路径），
 * 要么直接用本地规则（未配置/失败回退），本函数不参与那个决定。
 */
export async function generateAxsText(
  settings: LlmSettings,
  system: string,
  user: string,
): Promise<string> {
  let text: unknown;

  if (settings.kind === "ollama") {
    const data = (await postJson(endpoint(settings.baseUrl, "/api/generate"), {
      model: settings.model,
      system,
      prompt: user,
      stream: false,
    })) as OllamaGenerateResponse;
    text = data.response;
    if (typeof text !== "string") {
      throw new LlmError("llm_bad_response", describeStatus(data, "ollama 响应缺 response 字段"));
    }
  } else {
    const data = (await postJson(endpoint(settings.baseUrl, "/chat/completions"), {
      model: settings.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
    })) as OpenAiChatResponse;
    text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new LlmError("llm_bad_response", describeStatus(data, "chat/completions 响应缺 choices"));
    }
  }

  const cleaned = stripCodeFence(text);
  if (!cleaned) throw new LlmError("llm_empty_output", "模型返回空文本");
  return cleaned;
}
