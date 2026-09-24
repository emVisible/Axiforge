import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { itemApi } from "@/shared/api/editor";
import { routes } from "@/shared/lib/routes";
import type { AssetItemResponse } from "@/shared/types/asset";
import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  ErrorDisplay,
  EntityCard,
  EntityIcon,
  FilterChip,
  LoadingSpinner,
  WorkflowGuide,
} from "@/shared/components/ui";
import { DISCOVER_WORKFLOW } from "@/shared/lib/workflowSteps";

const PAGE_SIZE = 12;
const ITEM_CATEGORIES = ["日常", "魔幻", "科技", "关键道具"];

const rarityVariant = (r: string) => {
  if (r === "传说") return "amber" as const;
  if (r === "稀有") return "blue" as const;
  return "default" as const;
};

interface DiscoverItemsTabProps {
  search: string;
}

export default function DiscoverItemsTab({ search }: DiscoverItemsTabProps) {
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<AssetItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  /** 请求失败必须与「库里确实没有内容」区分开：原先只有 try/finally 无 catch，
   *  失败时 items 停在 []，页面照样渲染空态——公开发现页上的真实缺陷 */
  const [error, setError] = useState<unknown>(null);
  /** 重试要真的重新发请求：把 tick 放进 effect 依赖，否则按钮是死的 */
  const [reloadTick, setReloadTick] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [debouncedSearch, category]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await itemApi.discover({
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          category: category || undefined,
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
  }, [page, debouncedSearch, category, reloadTick]);

  const hasMore = items.length < total;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...ITEM_CATEGORIES].map((c) => (
          <FilterChip
            key={c || "all"}
            label={c || "全部"}
            active={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {loading && page === 0 && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {!loading && !!error && (
        <ErrorDisplay message="道具清单加载失败" onRetry={() => setReloadTick((t) => t + 1)} />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          framed
          title={debouncedSearch || category ? "没有匹配的道具" : "还没有公开道具"}
          description={
            debouncedSearch || category ? "试试其他关键词或分类" : undefined
          }
        >
          {!debouncedSearch && !category && (
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
          <p className="mb-3 text-xs text-ink-faint">共 {total} 个道具</p>
          <CardGrid stagger density="compact">
            {items.map((item) => (
              <EntityCard
                key={item.id}
                to={routes.discoverItem(item.id)}
                title={item.name}
                description={item.description || "暂无描述"}
                leading={
                  <EntityIcon>
                    <Package className="h-5 w-5" strokeWidth={1.75} />
                  </EntityIcon>
                }
                badges={
                  <>
                    <Badge variant="default" size="sm">
                      {item.category}
                    </Badge>
                    <Badge variant={rarityVariant(item.rarity)} size="sm">
                      {item.rarity}
                    </Badge>
                    {item.view_count > 0 && (
                      <Badge variant="default" size="sm">
                        {item.view_count} 浏览
                      </Badge>
                    )}
                  </>
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
            {!hasMore && (
              <p className="text-sm text-ink-faint">已显示全部 {total} 个道具</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
