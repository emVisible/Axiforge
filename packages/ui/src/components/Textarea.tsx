import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

import { cn, fieldError, inputBase, inputError, labelBase } from "./formStyles";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", required, ...props }, ref) => {
    const autoId = useId(); // 调用方没给 id 时，label 与控件靠它连起来
    return (
      <div>
        {label && (
          <label className={labelBase} htmlFor={autoId}>
            {required && <span className="mr-0.5 text-red-400">*</span>}
            {label}
          </label>
        )}
        <textarea
          id={autoId}
          ref={ref}
          className={cn(inputBase, "resize-none", error && inputError, className)}
          {...props}
        />
        {error && <p className={fieldError}>{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
export default Textarea;
