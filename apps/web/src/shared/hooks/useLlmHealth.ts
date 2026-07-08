import { useQuery } from "@tanstack/react-query";

import { llmApi } from "@/shared/api/llm";

export function useLlmHealth() {
  return useQuery({
    queryKey: ["llm-health"],
    queryFn: () => llmApi.health(),
    staleTime: 60_000,
  });
}
