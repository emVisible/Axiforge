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
  LoadingSpinner,
  WorkflowGuide,
  cardTheme,
} from "@/shared/components/ui";
import { DISCOVER_WORKFLOW } from "@/shared/lib/workflowSteps";

const PAGE_SIZE = 12;

interface DiscoverProjectsTabProps {
  search: string;
}

export default function DiscoverProjectsTab({ search }: DiscoverProjectsTabProps) {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ProjectResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
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
        setTotal(data.total);
        setItems((prev) => (page === 0 ? data.items : [...prev, ...data.items]));
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
  }, [page, debouncedSearch]);

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
  const t = cardTheme.dark;

  return (
    <div>
      {loading && page === 0 && (
        <div className="flex justify-center py-20">
          <LoadingSpinner variant="dark" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          theme="dark"
          framed
          title={debouncedSearch ? "没有匹配的作品" : "还没有公开作品"}
          description={
            debouncedSearch ? "试试其他关键词" : "去创作第一部作品吧"
          }
        >
          {!debouncedSearch && (
            <WorkflowGuide
              steps={DISCOVER_WORKFLOW}
              theme="dark"
              compact
              className="max-w-2xl text-left"
            />
          )}
        </EmptyState>
      )}

      {items.length > 0 && (
        <>
          <p className="mb-4 text-xs text-white/30">共 {total} 部作品</p>
          <CardGrid stagger>
            {items.map((p) => (
              <CoverCard
                key={p.id}
                theme="dark"
                title={p.title}
                description={p.description || "暂无描述"}
                onClick={() => openProject(p.id)}
                menu={
                  <CardOverflowMenu
                    theme="dark"
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
                  <div className={`flex items-center gap-3 text-[11px] ${t.meta}`}>
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
          <div className="mt-8 text-center">
            {loadingMore && <LoadingSpinner variant="dark" />}
            {hasMore && !loadingMore && (
              <Button tone="dark" variant="secondary" onClick={() => setPage((p) => p + 1)}>
                加载更多（{total - items.length} 个剩余）
              </Button>
            )}
            {!hasMore && items.length > 0 && (
              <p className="text-sm text-white/25">已显示全部 {total} 部作品</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
