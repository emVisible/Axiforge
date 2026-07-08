import { useState, useEffect, useRef } from "react";

import { characterApi } from "@/shared/api/characters";
import { SearchInput } from "@/shared/components/ui";
import type { Character } from "@/shared/types/character";
import { getCreatorId } from "@/shared/lib/creatorId";

interface CharacterSearchSelectProps {
  value?: string;
  onChange: (characterId: string, characterName: string) => void;
  placeholder?: string;
  excludeId?: string;
  /** 选中后是否保持搜索框（用于连续添加） */
  resetOnSelect?: boolean;
}

function mergeCharacters(
  publicItems: Character[],
  userItems: Character[],
  query: string,
  excludeId?: string,
): Character[] {
  const seen = new Set<string>();
  const merged: Character[] = [];
  const q = query.trim().toLowerCase();

  for (const c of [...userItems, ...publicItems]) {
    if (seen.has(c.id) || c.id === excludeId) continue;
    if (q && !c.name.toLowerCase().includes(q)) continue;
    seen.add(c.id);
    merged.push(c);
  }

  return merged.slice(0, 8);
}

export default function CharacterSearchSelect({
  value,
  onChange,
  placeholder = "搜索角色（公开 + 我的）...",
  excludeId,
  resetOnSelect = false,
}: CharacterSearchSelectProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [results, setResults] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    Promise.all([
      characterApi.listPublic({ search: debouncedSearch, limit: 8 }),
      characterApi.listUser(getCreatorId()),
    ])
      .then(([publicResult, userItems]) =>
        setResults(
          mergeCharacters(publicResult.items, userItems, debouncedSearch, excludeId),
        ),
      )
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, excludeId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (character: Character) => {
    onChange(character.id, character.name);
    if (resetOnSelect) {
      setSearch("");
    } else {
      setSelectedName(character.name);
      setSearch("");
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("", "");
    setSelectedName("");
    setSearch("");
  };

  const showSelected = !resetOnSelect && (selectedName || value);

  return (
    <div ref={containerRef} className="relative">
      {showSelected ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-4 py-2.5">
          <span className="flex-1 text-sm text-ink">{selectedName || value}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            清除
          </button>
        </div>
      ) : (
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClear={() => setSearch("")}
          placeholder={placeholder}
        />
      )}

      {isOpen && (search || loading) && !showSelected && (
        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-xs text-ink-muted">搜索中...</div>
          )}
          {!loading && results.length === 0 && search && (
            <div className="px-4 py-3 text-xs text-ink-muted">无结果</div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-canvas"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-xs font-bold text-brand">
                {(c.character_data?.anchor?.name || c.name)[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="truncate text-xs text-ink-muted">
                  {c.character_data?.anchor?.essence ||
                    c.character_data?.contour?.first_impression ||
                    ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
