import { useState, useEffect } from "react";

import { useUserCharacters } from "@/hooks/useCharacters";
import { CharacterGrid } from "@/modules/character";
import {
  Button,
  EmptyState,
  ErrorDisplay,
  FilterToolbar,
  LoadingSpinner,
  PageHeader,
} from "@/components/ui";
import { routes } from "@/lib/routes";
import { getCreatorId } from "@/lib/creatorId";

const PAGE_SIZE = 12;

export default function MyCharactersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: allCharacters,
    isLoading,
    error,
  } = useUserCharacters(getCreatorId());

  const filtered =
    allCharacters?.filter((c) => {
      if (!debouncedSearch) return true;
      const term = debouncedSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.character_data?.anchor?.essence?.toLowerCase().includes(term) ||
        c.character_data?.anchor?.summary?.toLowerCase().includes(term) ||
        c.tags.some((t) => t.name.toLowerCase().includes(term))
      );
    }) || [];

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="我的角色"
        description={
          allCharacters
            ? `${filtered.length} 个角色`
            : "管理和编辑你创建的角色"
        }
        action={
          <Button as="link" to={routes.characters.create} size="sm">
            创建新角色
          </Button>
        }
      />

      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索我的角色..."
        className="mb-6"
      />

      {search && (
        <p className="-mt-2 mb-4 text-xs text-ink-muted">
          找到 {filtered.length} 个匹配角色
        </p>
      )}

      {isLoading && <LoadingSpinner />}
      {error && (
        <ErrorDisplay
          message="加载角色失败"
          onRetry={() => window.location.reload()}
        />
      )}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title={search ? "没有匹配的角色" : "你还没有创建角色"}
          description={search ? "试试其他关键词" : "开始创建你的第一个角色吧"}
          action={
            search ? undefined : { label: "创建角色", to: routes.characters.create }
          }
        />
      )}

      {visible.length > 0 && (
        <>
          <CharacterGrid characters={visible} showStatus />
          <div className="mt-8 text-center">
            {hasMore && (
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                加载更多（{filtered.length - visibleCount} 个剩余）
              </Button>
            )}
            {!hasMore && filtered.length > PAGE_SIZE && (
              <p className="text-sm text-ink-muted/50">
                已显示全部 {filtered.length} 个角色
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
