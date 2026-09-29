import { type InputHTMLAttributes, forwardRef, useId } from "react";

import { cn, fieldError, fieldHint, inputBase, inputError, labelBase } from "./formStyles";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", required, ...props }, ref) => {
    const autoId = useId(); // 调用方没给 id 时，label 与控件靠它连起来
    return (
      <div>
        {label && (
          <label className={labelBase} htmlFor={autoId}>
            {required && <span className="mr-0.5 text-red-400">*</span>}
            {label}
          </label>
        )}
        <input
          id={autoId}
          ref={ref}
          className={cn(inputBase, error && inputError, className)}
          {...props}
        />
        {hint && !error && <p className={fieldHint}>{hint}</p>}
        {error && <p className={fieldError}>{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
