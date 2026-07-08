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
  }, [page, debouncedSearch, category]);

  const hasMore = items.length < total;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {["", ...ITEM_CATEGORIES].map((c) => (
          <FilterChip
            variant="dark"
            key={c || "all"}
            label={c || "全部"}
            active={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {loading && page === 0 && (
        <div className="flex justify-center py-20">
          <LoadingSpinner variant="dark" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          theme="dark"
          framed
          title={debouncedSearch || category ? "没有匹配的道具" : "还没有公开道具"}
          description={
            debouncedSearch || category ? "试试其他关键词或分类" : undefined
          }
        >
          {!debouncedSearch && !category && (
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
          <p className="mb-4 text-xs text-white/30">共 {total} 个道具</p>
          <CardGrid stagger>
            {items.map((item) => (
              <EntityCard
                key={item.id}
                theme="dark"
                to={routes.item(item.id)}
                title={item.name}
                description={item.description || "暂无描述"}
                leading={
                  <EntityIcon theme="dark">
                    <Package className="h-5 w-5" strokeWidth={1.75} />
                  </EntityIcon>
                }
                badges={
                  <>
                    <Badge variant="default" size="sm" tone="dark">
                      {item.category}
                    </Badge>
                    <Badge variant={rarityVariant(item.rarity)} size="sm" tone="dark">
                      {item.rarity}
                    </Badge>
                    {item.view_count > 0 && (
                      <Badge variant="default" size="sm" tone="dark">
                        {item.view_count} 浏览
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
              <p className="text-sm text-white/25">已显示全部 {total} 个道具</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
