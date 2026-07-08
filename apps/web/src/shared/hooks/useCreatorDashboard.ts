import { useQuery } from "@tanstack/react-query";

import { creatorApi } from "@/shared/api/creator";

export function useCreatorDashboard(authorId: string) {
  return useQuery({
    queryKey: ["creator-dashboard", authorId],
    queryFn: () => creatorApi.dashboard(authorId),
    enabled: Boolean(authorId),
  });
}
