import { type TextareaHTMLAttributes, forwardRef } from "react";

import { cn, fieldError, inputBase, inputError, labelBase } from "./formStyles";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", required, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className={labelBase}>
            {required && <span className="mr-0.5 text-red-400">*</span>}
            {label}
          </label>
        )}
        <textarea
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
