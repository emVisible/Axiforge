import { useCallback, useEffect, useState } from "react";

interface UseAdminListOptions<T> {
  fetcher: () => Promise<T>;
  deps?: unknown[];
}

interface UseAdminListResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  reload: () => void;
}

/** 消除各 Admin 页面重复的 fetch + loading/error state 样板。 */
export function useAdminList<T>({
  fetcher,
  deps = [],
}: UseAdminListOptions<T>): UseAdminListResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    fetcher()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, setError, reload };
}
