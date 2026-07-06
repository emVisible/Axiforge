import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn, inputSm } from "./formStyles";

interface SearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export default function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "选择或搜索...",
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          inputSm,
          "flex w-full cursor-pointer items-center justify-between gap-2 text-left",
          isOpen && "border-brand ring-2 ring-brand/15",
          value ? "text-ink" : "text-ink-muted/50",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-ink-muted/50 transition-transform",
            isOpen && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 flex max-h-48 w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {options.length > 8 && (
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted/50"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索..."
                  className={cn(inputSm, "pl-8")}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-ink-muted">
                无匹配选项
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-brand-muted",
                    value === option
                      ? "bg-brand-muted font-medium text-brand"
                      : "text-ink-muted",
                  )}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
