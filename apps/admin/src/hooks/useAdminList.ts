import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UseAdminListOptions<T> {
  fetcher: () => Promise<T>;
  /** @deprecated 使用 queryKey */
  deps?: unknown[];
  queryKey?: readonly unknown[];
  enabled?: boolean;
}

interface UseAdminListResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  reload: () => void;
  invalidate: () => void;
}

/** Admin 列表/详情数据加载（React Query）。 */
export function useAdminList<T>({
  fetcher,
  deps = [],
  queryKey,
  enabled = true,
}: UseAdminListOptions<T>): UseAdminListResult<T> {
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();
  const resolvedKey = queryKey ?? ["admin", ...deps];

  const query = useQuery({
    queryKey: resolvedKey,
    queryFn: fetcher,
    enabled,
  });

  const reload = useCallback(() => {
    setActionError("");
    void query.refetch();
  }, [query]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: resolvedKey });
  }, [queryClient, resolvedKey]);

  const fetchError =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "加载失败"
        : "";

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: actionError || fetchError,
    setError: setActionError,
    reload,
    invalidate,
  };
}

export function useAdminInvalidation() {
  const queryClient = useQueryClient();
  return {
    invalidateStats: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
    invalidateReports: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
    invalidateModeration: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] }),
    invalidateAll: () => void queryClient.invalidateQueries({ queryKey: ["admin"] }),
  };
}
