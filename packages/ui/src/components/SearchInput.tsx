import { type InputHTMLAttributes, forwardRef } from "react";
import { Search, X } from "lucide-react";

import {
  searchSizeClasses,
  searchTheme,
  searchWidthClasses,
  type SearchSize,
  type SearchWidth,
  type SurfaceTheme,
} from "./searchTheme";
import { cn } from "./formStyles";
import { useResolvedSurfaceTheme } from "../hooks/useSurfaceTheme";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  onClear?: () => void;
  className?: string;
  containerClassName?: string;
  /** @deprecated 读 runtime `data-theme` */
  variant?: SurfaceTheme;
  size?: SearchSize;
  width?: SearchWidth;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onClear,
      className = "",
      containerClassName = "",
      variant,
      size = "md",
      width = "full",
      disabled,
      ...props
    },
    ref,
  ) => {
    const resolvedTheme = useResolvedSurfaceTheme(variant);
    const hasValue = value !== undefined && String(value).length > 0;
    const theme = searchTheme[resolvedTheme];
    const sizing = searchSizeClasses[size];

    return (
      <div
        className={cn(
          "inline-flex max-w-full items-center rounded-full border transition-all duration-200",
          searchWidthClasses[width],
          sizing.shell,
          theme.shell,
          disabled && "cursor-not-allowed opacity-50",
          containerClassName,
        )}
      >
        <Search
          className={cn("shrink-0", sizing.icon, theme.icon)}
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={ref}
          type="text"
          role="searchbox"
          value={value}
          disabled={disabled}
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none",
            sizing.input,
            theme.input,
            className,
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full transition-colors",
              sizing.clear,
              theme.clear,
            )}
            aria-label="清除搜索"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
