import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | 'primary' 
    | 'secondary' 
    | 'outline' 
    | 'ghost' 
    | 'danger' 
    | 'success' 
    | 'warning' 
    | 'info'
    | 'saudi-green'
    | 'saudi-gold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}

const LoadingSpinner = ({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) => {
  const spinnerSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  return (
    <svg
      className={cn('animate-spin', spinnerSizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    leftIcon,
    rightIcon,
    iconOnly = false,
    fullWidth = false,
    children, 
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-[0.98] hover:shadow-sm',
      fullWidth && 'w-full'
    );
    
    const variants = {
      primary: cn(
        'bg-primary-600 text-white shadow-sm',
        'hover:bg-primary-700 hover:shadow-md',
        'focus-visible:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ),
      secondary: cn(
        'bg-secondary-100 text-secondary-900 shadow-sm',
        'hover:bg-secondary-200 hover:shadow-md',
        'focus-visible:ring-secondary-500',
        'dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700'
      ),
      outline: cn(
        'border-2 border-secondary-300 bg-transparent text-secondary-700',
        'hover:bg-secondary-50 hover:border-secondary-400',
        'focus-visible:ring-secondary-500',
        'dark:border-secondary-600 dark:text-secondary-300',
        'dark:hover:bg-secondary-800 dark:hover:border-secondary-500'
      ),
      ghost: cn(
        'text-secondary-700 bg-transparent',
        'hover:bg-secondary-100 hover:text-secondary-900',
        'focus-visible:ring-secondary-500',
        'dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-secondary-100'
      ),
      danger: cn(
        'bg-danger-600 text-white shadow-sm',
        'hover:bg-danger-700 hover:shadow-md',
        'focus-visible:ring-danger-500',
        'dark:bg-danger-500 dark:hover:bg-danger-600'
      ),
      success: cn(
        'bg-success-600 text-white shadow-sm',
        'hover:bg-success-700 hover:shadow-md',
        'focus-visible:ring-success-500',
        'dark:bg-success-500 dark:hover:bg-success-600'
      ),
      warning: cn(
        'bg-warning-600 text-white shadow-sm',
        'hover:bg-warning-700 hover:shadow-md',
        'focus-visible:ring-warning-500',
        'dark:bg-warning-500 dark:hover:bg-warning-600'
      ),
      info: cn(
        'bg-info-600 text-white shadow-sm',
        'hover:bg-info-700 hover:shadow-md',
        'focus-visible:ring-info-500',
        'dark:bg-info-500 dark:hover:bg-info-600'
      ),
      'saudi-green': cn(
        'bg-saudi-green-500 text-white shadow-sm',
        'hover:bg-saudi-green-600 hover:shadow-md',
        'focus-visible:ring-saudi-green-500',
        'dark:bg-saudi-green-400 dark:hover:bg-saudi-green-500'
      ),
      'saudi-gold': cn(
        'bg-saudi-gold-500 text-saudi-green-900 shadow-sm',
        'hover:bg-saudi-gold-600 hover:shadow-md',
        'focus-visible:ring-saudi-gold-500',
        'dark:bg-saudi-gold-400 dark:hover:bg-saudi-gold-500'
      ),
    };

    const sizes = {
      xs: cn(
        iconOnly ? 'h-6 w-6 p-1' : 'h-6 px-2 text-xs',
        'rounded-md'
      ),
      sm: cn(
        iconOnly ? 'h-8 w-8 p-1.5' : 'h-8 px-3 text-sm',
        'rounded-md'
      ),
      md: cn(
        iconOnly ? 'h-10 w-10 p-2' : 'h-10 px-4 py-2 text-base',
        'rounded-lg'
      ),
      lg: cn(
        iconOnly ? 'h-12 w-12 p-2.5' : 'h-12 px-6 text-lg',
        'rounded-lg'
      ),
      xl: cn(
        iconOnly ? 'h-14 w-14 p-3' : 'h-14 px-8 text-xl',
        'rounded-xl'
      ),
    };

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel || (iconOnly ? 'Button' : undefined)}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size} />
            {!iconOnly && <span className="sr-only">Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span 
                className={cn(
                  iconSizes[size],
                  !iconOnly && children && 'mr-2 rtl:mr-0 rtl:ml-2'
                )}
                aria-hidden="true"
              >
                {leftIcon}
              </span>
            )}
            
            {!iconOnly && children && (
              <span className="truncate">{children}</span>
            )}
            
            {rightIcon && (
              <span 
                className={cn(
                  iconSizes[size],
                  !iconOnly && children && 'ml-2 rtl:ml-0 rtl:mr-2'
                )}
                aria-hidden="true"
              >
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';