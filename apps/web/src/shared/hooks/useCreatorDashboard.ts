import { useQuery } from "@tanstack/react-query";

import { creatorApi } from "@/shared/api/creator";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";

export function useCreatorDashboard(authorId: string) {
  return useQuery({
    queryKey: ["creator-dashboard", authorId],
    queryFn: () => creatorApi.dashboard(authorId),
    // 缺席判断必须在数据层：页面里「先起查询、后 if 缺席直接 return」的写法会让 UI
    // 看起来正确处理了本地态，却仍然打一个必败请求（E14 抓的就是这一类）。
    enabled: Boolean(authorId) && !isLocalOnlyDeployment(),
  });
}
