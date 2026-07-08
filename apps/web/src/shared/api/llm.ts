import { apiClient } from "./client";

export interface LlmHealth {
  active_provider: string;
  mode: string;
  providers: Array<{ name: string; healthy: boolean }>;
}

export const llmApi = {
  health: () => apiClient.get<LlmHealth>("/llm/health"),
};
