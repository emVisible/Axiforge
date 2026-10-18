/**
 * 桌面端本机模型端点（宪章 S13-4）。
 *
 * 存 localStorage 而不是进 L4 契约：这份配置**不属于任何一部作品**，
 * 它是"这台机器上的渲染器该去哪儿找模型"，跨工程、跨导出都应跟着用户走；
 * 而 `.axsp` 是把作品交给别人，绝不应当带上端点和模型名（那是用户机器上的环境，不是创作内容）。
 *
 * 未配置 = 不启用模型，走本地规则引擎。这是有意的默认：桌面离线必须能用（已锁定决策），
 * 不能因为"配置功能上线了"就变成没装 Ollama 就打不开草稿。
 */

export type LocalLlmKind = "ollama" | "openai";

export interface LlmSettings {
  kind: LocalLlmKind;
  /** 形如 http://localhost:11434 或 http://127.0.0.1:8000/v1，不带尾部斜杠 */
  baseUrl: string;
  model: string;
}

const KEY = "axiforge:llm-endpoint";

export function loadLlmSettings(): LlmSettings | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LlmSettings>;
    if ((parsed.kind !== "ollama" && parsed.kind !== "openai") || !parsed.baseUrl || !parsed.model) {
      return null;
    }
    return { kind: parsed.kind, baseUrl: parsed.baseUrl.replace(/\/+$/, ""), model: parsed.model };
  } catch {
    // localStorage 不可用（隐私模式）或内容坏了：当作没配置，而不是抛给创建流程
    return null;
  }
}

export function saveLlmSettings(settings: LlmSettings | null): void {
  if (!settings) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(settings));
}
