import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Play } from "lucide-react";

import { projectApi } from "@/shared/api/editor";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { routes } from "@/shared/lib/routes";
import { reportContent } from "@/shared/lib/identityLink";
import type { ProjectResponse } from "@/shared/types/project";
import {
  Button,
  CardGrid,
  CardOverflowMenu,
  CoverCard,
  EmptyState,
  ErrorDisplay,
  LoadingSpinner,
  WorkflowGuide,
  useCardTheme,
} from "@/shared/components/ui";
import { DISCOVER_WORKFLOW } from "@/shared/lib/workflowSteps";

const PAGE_SIZE = 12;

interface DiscoverProjectsTabProps {
  search: string;
}

export default function DiscoverProjectsTab({ search }: DiscoverProjectsTabProps) {
  const navigate = useNavigate();
  const t = useCardTheme();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ProjectResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  /** 请求失败必须与「库里确实没有内容」区分开：原先只有 try/finally 无 catch，
   *  失败时 items 停在 []，页面照样渲染空态——公开发现页上的真实缺陷 */
  const [error, setError] = useState<unknown>(null);
  /** 重试要真的重新发请求：把 tick 放进 effect 依赖，否则按钮是死的 */
  const [reloadTick, setReloadTick] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await projectApi.discover({
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        if (cancelled) return;
        setError(null);
        setTotal(data.total);
        setItems((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, reloadTick]);

  const openProject = (projectId: string) => {
    navigate(routes.discoverProject(projectId));
  };

  const handleReport = async (projectId: string) => {
    const reason = window.prompt("举报原因（简要说明）");
    if (!reason?.trim()) return;
    setReportingId(projectId);
    try {
      await reportContent("project", projectId, reason.trim());
      window.alert("已收到举报，感谢反馈");
    } catch {
      window.alert("举报提交失败");
    } finally {
      setReportingId(null);
    }
  };

  const hasMore = items.length < total;

  return (
    <div>
      {loading && page === 0 && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {!loading && !!error && (
        <ErrorDisplay message="剧本清单加载失败" onRetry={() => setReloadTick((t) => t + 1)} />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          framed
          title={debouncedSearch ? "没有匹配的作品" : "还没有公开作品"}
          description={
            debouncedSearch ? "试试其他关键词" : "去创作第一部作品吧"
          }
        >
          {!debouncedSearch && (
            <WorkflowGuide
              steps={DISCOVER_WORKFLOW}
              compact
              className="max-w-2xl text-left"
            />
          )}
        </EmptyState>
      )}

      {items.length > 0 && (
        <>
          <p className="mb-3 text-xs text-ink-faint">共 {total} 部作品</p>
          <CardGrid stagger density="compact">
            {items.map((p) => (
              <CoverCard
                key={p.id}
                density="compact"
                title={p.title}
                description={p.description || "暂无描述"}
                onClick={() => openProject(p.id)}
                menu={
                  <CardOverflowMenu
                    items={[
                      {
                        label: reportingId === p.id ? "提交中..." : "举报",
                        destructive: true,
                        onClick: () => {
                          if (reportingId !== p.id) void handleReport(p.id);
                        },
                      },
                    ]}
                  />
                }
                cover={
                  p.cover_image ? (
                    <img
                      src={getImageUrl(p.cover_image) || ""}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center ${t.coverPlaceholder}`}
                    >
                      <Play className="h-8 w-8 opacity-40" strokeWidth={1.5} />
                    </div>
                  )
                }
                footer={
                  <div className={`flex items-center gap-3 text-2xs ${t.meta}`}>
                    {p.genre && <span>{p.genre}</span>}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" strokeWidth={1.75} />
                      {p.view_count}
                    </span>
                    {(p.play_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" strokeWidth={1.75} />
                        {p.play_count}
                      </span>
                    )}
                  </div>
                }
              />
            ))}
          </CardGrid>
          <div className="mt-6 text-center">
            {loadingMore && <LoadingSpinner />}
            {hasMore && !loadingMore && (
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                加载更多（{total - items.length} 个剩余）
              </Button>
            )}
            {!hasMore && items.length > 0 && (
              <p className="text-sm text-ink-faint">已显示全部 {total} 部作品</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
