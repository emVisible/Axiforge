import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import { sceneAssetApi } from "@/shared/api/editor";
import { routes } from "@/shared/lib/routes";
import type { AssetSceneResponse } from "@/shared/types/asset";
import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  EntityCard,
  EntityIcon,
  LoadingSpinner,
  WorkflowGuide,
} from "@/shared/components/ui";
import { DISCOVER_WORKFLOW } from "@/shared/lib/workflowSteps";

const PAGE_SIZE = 12;

interface DiscoverScenesTabProps {
  search: string;
}

export default function DiscoverScenesTab({ search }: DiscoverScenesTabProps) {
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<AssetSceneResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
        const data = await sceneAssetApi.discover({
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

  const hasMore = items.length < total;

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
          title={debouncedSearch ? "没有匹配的场景模板" : "还没有公开场景模板"}
          description={debouncedSearch ? "试试其他关键词" : undefined}
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
          <p className="mb-4 text-xs text-white/30">共 {total} 个场景模板</p>
          <CardGrid stagger>
            {items.map((scene) => (
              <EntityCard
                key={scene.id}
                theme="dark"
                to={routes.scene(scene.id)}
                title={scene.name}
                description={scene.description || scene.world_setting || "暂无描述"}
                leading={
                  <EntityIcon theme="dark">
                    <MapPin className="h-5 w-5" strokeWidth={1.75} />
                  </EntityIcon>
                }
                badges={
                  <>
                    {scene.location && (
                      <Badge variant="default" size="sm" tone="dark">
                        {scene.location}
                      </Badge>
                    )}
                    {scene.atmosphere && (
                      <Badge variant="blue" size="sm" tone="dark">
                        {scene.atmosphere}
                      </Badge>
                    )}
                    {scene.view_count > 0 && (
                      <Badge variant="default" size="sm" tone="dark">
                        {scene.view_count} 浏览
                      </Badge>
                    )}
                  </>
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
            {!hasMore && (
              <p className="text-sm text-white/25">已显示全部 {total} 个场景模板</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
