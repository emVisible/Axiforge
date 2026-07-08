import { useCallback, useEffect, useState } from "react";

import { CharacterGrid } from "@/features/character";
import { usePublicCharacters } from "@/shared/hooks/useCharacters";
import { useTags } from "@/shared/hooks/useTags";
import { routes } from "@/shared/lib/routes";
import {
  Button,
  EmptyState,
  ErrorDisplay,
  FilterChip,
  LoadingSpinner,
  SegmentedControl,
  WorkflowGuide,
} from "@/shared/components/ui";
import { DISCOVER_WORKFLOW } from "@/shared/lib/workflowSteps";

const PAGE_SIZE = 12;
const MAX_VISIBLE_TAGS = 15;

interface DiscoverCharactersTabProps {
  search: string;
}

export default function DiscoverCharactersTab({ search }: DiscoverCharactersTabProps) {
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
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  }, []);

  const clearFilters = () => {
    setSelectedTags([]);
    setSort("recent");
  };

  const hasFilters = search || selectedTags.length > 0;
  const hasMore = result ? skip + PAGE_SIZE < result.total : false;
  const visibleTags = allTags || [];
  const displayTags = showAllTags ? visibleTags : visibleTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = visibleTags.length - MAX_VISIBLE_TAGS;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SegmentedControl
          value={sort}
          onChange={setSort}
          variant="dark"
          options={[
            { value: "recent", label: "最新" },
            { value: "popular", label: "最热" },
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            tone="dark"
            className="text-red-400 hover:text-red-300"
            onClick={clearFilters}
          >
            清除筛选
          </Button>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <FilterChip
                key={tag.id}
                variant="dark"
                label={tag.name}
                color={tag.color}
                count={tag.usage_count}
                active={selectedTags.includes(tag.name)}
                onClick={() => toggleTag(tag.name)}
              />
            ))}
            {hiddenCount > 0 && !showAllTags && (
              <Button
                variant="ghost"
                size="sm"
                tone="dark"
                onClick={() => setShowAllTags(true)}
              >
                +{hiddenCount} 更多
              </Button>
            )}
            {showAllTags && hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                tone="dark"
                onClick={() => setShowAllTags(false)}
              >
                收起
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (
        <p className="mb-4 text-xs text-white/30">共 {result.total} 个公开角色</p>
      )}

      {isLoading && page === 0 && (
        <div className="flex justify-center py-20">
          <LoadingSpinner variant="dark" />
        </div>
      )}
      {error && (
        <ErrorDisplay
          theme="dark"
          message="加载角色失败"
          onRetry={() => window.location.reload()}
        />
      )}
      {result && allCharacters.length === 0 && (
        <EmptyState
          theme="dark"
          framed
          title={hasFilters ? "没有匹配的角色" : "还没有公开角色"}
          description={
            hasFilters
              ? "试试其他关键词或标签"
              : "还没有公开的角色，成为第一个分享的人吧！"
          }
          action={
            hasFilters ? undefined : { label: "创建角色", to: routes.characters.create }
          }
        >
          {!hasFilters && (
            <WorkflowGuide
              steps={DISCOVER_WORKFLOW}
              theme="dark"
              compact
              className="max-w-2xl text-left"
            />
          )}
        </EmptyState>
      )}

      {allCharacters.length > 0 && (
        <>
          <CharacterGrid characters={allCharacters} theme="dark" />
          <div className="mt-8 text-center">
            {isLoading && page > 0 && <LoadingSpinner variant="dark" />}
            {hasMore && !isLoading && (
              <Button tone="dark" variant="secondary" onClick={() => setPage((p) => p + 1)}>
                加载更多（{result!.total - (skip + PAGE_SIZE)} 个剩余）
              </Button>
            )}
            {!hasMore && allCharacters.length > 0 && (
              <p className="text-sm text-white/25">已显示全部 {result?.total} 个角色</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
