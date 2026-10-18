import { useQuery } from "@tanstack/react-query";

import { llmApi } from "@/shared/api/llm";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

export function useLlmHealth() {
  return useQuery({
    queryKey: ["llm-health"],
    queryFn: () => llmApi.health(),
    staleTime: 60_000,
    // 桌面壳连不上后端：这个请求必然失败，而失败会让徽章把「没问到」显示成「坏了」。
    // 缺席判断放在数据层，与 useCreatorDashboard 同一处置。
    enabled: !isLocalOnlyDeployment(),
  });
}
