import { useState, useEffect, useCallback } from "react";
import { usePublicCharacters } from "@/hooks/useCharacters";
import { useTags } from "@/hooks/useTags";
import { CharacterGrid } from "@/modules/character";
import {
  Button,
  EmptyState,
  ErrorDisplay,
  FilterChip,
  FilterToolbar,
  LoadingSpinner,
  PageHeader,
  SegmentedControl,
} from "@/components/ui";
import { routes } from "@/lib/routes";

const PAGE_SIZE = 12;
const MAX_VISIBLE_TAGS = 15;

export default function HallPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [page, setPage] = useState(0);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
    setAllCharacters([]);
  }, [debouncedSearch, selectedTags, sort]);

  const skip = page * PAGE_SIZE;

  const {
    data: result,
    isLoading,
    error,
  } = usePublicCharacters({
    search: debouncedSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
    sort,
    skip,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    if (result) {
      if (page === 0) {
        setAllCharacters(result.items);
      } else {
        setAllCharacters((prev) => [...prev, ...result.items]);
      }
    }
  }, [result, page]);

  const { data: allTags } = useTags("usage");

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  }, []);

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setSort("recent");
  };

  const hasFilters = search || selectedTags.length > 0;
  const hasMore = result ? skip + PAGE_SIZE < result.total : false;
  const visibleTags = allTags || [];
  const displayTags = showAllTags
    ? visibleTags
    : visibleTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = visibleTags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="角色大厅"
        description={
          result ? `共 ${result.total} 个公开角色` : "浏览社区分享的角色"
        }
        action={
          <Button as="link" to={routes.characters.create} size="sm">
            创建角色
          </Button>
        }
      />

      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索角色名称或概括..."
      >
        <SegmentedControl
          value={sort}
          onChange={setSort}
          options={[
            { value: "recent", label: "最新" },
            { value: "popular", label: "最热" },
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={clearFilters}
          >
            清除筛选
          </Button>
        )}
      </FilterToolbar>

      {visibleTags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <FilterChip
                key={tag.id}
                label={tag.name}
                color={tag.color}
                count={tag.usage_count}
                active={selectedTags.includes(tag.name)}
                onClick={() => toggleTag(tag.name)}
              />
            ))}
            {hiddenCount > 0 && !showAllTags && (
              <button
                type="button"
                onClick={() => setShowAllTags(true)}
                className="px-3 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
              >
                +{hiddenCount} 更多
              </button>
            )}
            {showAllTags && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllTags(false)}
                className="px-3 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
              >
                收起
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && page === 0 && <LoadingSpinner />}
      {error && (
        <ErrorDisplay
          message="加载角色失败"
          onRetry={() => window.location.reload()}
        />
      )}
      {result && allCharacters.length === 0 && (
        <EmptyState
          title={hasFilters ? "没有匹配的角色" : "大厅空空如也"}
          description={
            hasFilters
              ? "试试其他关键词或标签"
              : "还没有公开的角色，成为第一个分享的人吧！"
          }
          action={
            hasFilters
              ? undefined
              : { label: "创建角色", to: routes.characters.create }
          }
        />
      )}

      {allCharacters.length > 0 && (
        <>
          <CharacterGrid characters={allCharacters} />
          <div className="mt-8 text-center">
            {isLoading && page > 0 && <LoadingSpinner />}
            {hasMore && !isLoading && (
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                加载更多（{result!.total - (skip + PAGE_SIZE)} 个剩余）
              </Button>
            )}
            {!hasMore && allCharacters.length > 0 && (
              <p className="text-sm text-ink-muted/50">
                已显示全部 {result?.total} 个角色
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
