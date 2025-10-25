import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, showCharCount, maxLength, value, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            "w-full px-3 py-2 border rounded-lg text-secondary-900 dark:text-secondary-100 bg-white dark:bg-secondary-900",
            "placeholder:text-secondary-400 dark:placeholder:text-secondary-600",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed resize-y",
            error
              ? "border-danger-500 focus:ring-danger-500"
              : "border-secondary-300 dark:border-secondary-700",
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center mt-1">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">{helperText}</p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p className="text-sm text-secondary-500 dark:text-secondary-400 ml-2">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
