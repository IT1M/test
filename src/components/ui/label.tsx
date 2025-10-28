import * as React from "react"
import { cn } from "@/utils/cn"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ 
    className, 
    size = 'md',
    variant = 'default',
    required = false,
    optional = false,
    disabled = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'font-medium leading-none transition-colors',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      disabled && 'cursor-not-allowed opacity-70'
    );

    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const variants = {
      default: 'text-secondary-700 dark:text-secondary-300',
      success: 'text-success-600 dark:text-success-400',
      warning: 'text-warning-600 dark:text-warning-400',
      danger: 'text-danger-600 dark:text-danger-400',
      info: 'text-info-600 dark:text-info-400',
    };

    return (
      <label
        ref={ref}
        className={cn(
          baseClasses,
          sizes[size],
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-danger-500" aria-label="required">
            *
          </span>
        )}
        {optional && !required && (
          <span className="ml-1 text-xs text-secondary-500 dark:text-secondary-400">
            (اختياري)
          </span>
        )}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Label }