import { useState, useEffect, useRef } from "react";

import { SearchInput, cn } from "@axiforge/ui";

export interface SelectableItem {
  id: string;
  name: string;
}

interface EntitySearchSelectProps {
  fetcher: (q: string) => Promise<SelectableItem[]>;
  onSelect: (item: SelectableItem) => void;
  placeholder: string;
}

export default function EntitySearchSelect({
  fetcher,
  onSelect,
  placeholder,
}: EntitySearchSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SelectableItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetcher(debounced)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debounced, fetcher]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <SearchInput
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClear={() => {
          setSearch("");
          setResults([]);
        }}
        placeholder={placeholder}
      />
      {isOpen && (search || loading) && (
        <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-xs text-ink-muted">搜索中...</div>
          )}
          {!loading && results.length === 0 && search && (
            <div className="px-4 py-3 text-xs text-ink-muted">无结果</div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setSearch("");
                setIsOpen(false);
              }}
              className={cn(
                "w-full border-b border-border/60 px-4 py-2.5 text-left text-sm text-ink last:border-0",
                "hover:bg-brand-muted hover:text-brand",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
