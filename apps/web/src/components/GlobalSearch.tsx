import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";

import { searchApi } from "../api/search";
import { Badge, cn, inputBase } from "@/components/ui";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; type: string; url: string }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchApi
      .global(debounced)
      .then((d) => setResults(d.results || []))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const typeVariant: Record<string, "blue" | "emerald" | "amber" | "purple" | "default"> = {
    剧本: "blue",
    场景: "emerald",
    道具: "amber",
    角色: "purple",
    插件: "purple",
  };

  return (
    <div ref={ref} className="relative w-56 lg:w-64">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50"
          strokeWidth={1.75}
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="全局搜索..."
          className={cn(
            inputBase,
            "bg-canvas/80 py-2 pl-9 pr-3 text-xs",
          )}
        />
      </div>
      {isOpen && (query || loading) && (
        <div className="absolute top-full z-50 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-xs text-ink-muted">搜索中...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-3 text-xs text-ink-muted">无结果</div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                navigate(r.url);
                setQuery("");
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-2.5 text-left last:border-0 hover:bg-canvas"
            >
              <Badge variant={typeVariant[r.type] ?? "default"} size="sm">
                {r.type}
              </Badge>
              <span className="truncate text-sm text-ink">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
