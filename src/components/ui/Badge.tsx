import { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  const variants = {
    default: "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100",
    primary: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100",
    success: "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100",
    warning: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100",
    danger: "bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100",
    secondary: "bg-secondary-200 text-secondary-900 dark:bg-secondary-700 dark:text-secondary-100",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function Tag({ children, onRemove, variant = "default", className }: TagProps) {
  const variants = {
    default: "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100",
    primary: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100",
    success: "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100",
    warning: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100",
    danger: "bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-md",
        variants[variant],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
