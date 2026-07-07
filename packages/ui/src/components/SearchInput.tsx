import { type InputHTMLAttributes, forwardRef } from "react";
import { Search, X } from "lucide-react";

import { cn, inputBase } from "./formStyles";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  containerClassName?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onClear, className = "", containerClassName = "", ...props },
    ref,
  ) => {
    const hasValue = value !== undefined && String(value).length > 0;

    return (
      <div className={cn("relative", containerClassName)}>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50"
          strokeWidth={1.75}
        />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            inputBase,
            "py-2.5 !pl-10 !pr-9 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            className,
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted/50 transition-colors hover:bg-gray-100 hover:text-ink"
            aria-label="清除搜索"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
