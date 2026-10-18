import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

import { cn, inputBase, inputError, labelBase, fieldError } from "./formStyles";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = "", children, ...props }, ref) => {
    const autoId = useId(); // 调用方没给 id 时，label 与控件靠它连起来
    return (
      <div>
        {label && <label className={labelBase} htmlFor={autoId}>{label}</label>}
        <div className="relative">
          <select
            id={autoId}
            ref={ref}
            className={cn(
              inputBase,
              "cursor-pointer appearance-none pr-10",
              error && inputError,
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50"
            strokeWidth={1.75}
          />
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-ink-muted/70">{hint}</p>}
        {error && <p className={fieldError}>{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
