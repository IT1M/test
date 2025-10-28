import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  successMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'underlined';
  options?: SelectOption[];
  placeholder?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const LoadingSpinner = () => (
  <svg
    className="h-4 w-4 animate-spin text-secondary-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
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

const ChevronDownIcon = () => (
  <svg
    className="h-4 w-4 text-secondary-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    success = false,
    successMessage,
    size = 'md',
    variant = 'default',
    options,
    placeholder,
    loading = false,
    leftIcon,
    rightIcon,
    id, 
    children, 
    required = false,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const hasSuccess = success && !hasError;

    // Group options by group property
    const groupedOptions = options?.reduce((acc, option) => {
      const group = option.group || 'default';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(option);
      return acc;
    }, {} as Record<string, SelectOption[]>);

    const baseClasses = cn(
      'relative flex w-full rounded-lg border transition-all duration-200',
      'focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Touch-friendly minimum height
      'min-h-[44px] md:min-h-[40px]'
    );

    const variants = {
      default: cn(
        'border-secondary-300 bg-white',
        'focus-within:border-primary-500 focus-within:ring-primary-500',
        'dark:border-secondary-600 dark:bg-secondary-900',
        'dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400'
      ),
      filled: cn(
        'border-transparent bg-secondary-100',
        'focus-within:bg-white focus-within:border-primary-500 focus-within:ring-primary-500',
        'dark:bg-secondary-800 dark:focus-within:bg-secondary-900',
        'dark:focus-within:border-primary-400 dark:focus-within:ring-primary-400'
      ),
      underlined: cn(
        'border-0 border-b-2 border-secondary-300 rounded-none bg-transparent',
        'focus-within:border-primary-500 focus-within:ring-0',
        'dark:border-secondary-600 dark:focus-within:border-primary-400'
      ),
    };

    const sizes = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-base',
      lg: 'h-12 text-lg',
    };

    const selectClasses = cn(
      'flex-1 bg-transparent px-3 py-2 text-secondary-900 appearance-none',
      'focus:outline-none cursor-pointer',
      'dark:text-secondary-100',
      variant === 'underlined' && 'px-0',
      leftIcon && 'pl-0',
      'pr-8' // Space for chevron icon
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'mb-2 block text-sm font-medium transition-colors',
              hasError 
                ? 'text-danger-600 dark:text-danger-400'
                : hasSuccess
                ? 'text-success-600 dark:text-success-400'
                : 'text-secondary-700 dark:text-secondary-300',
              required && "after:content-['*'] after:ml-0.5 after:text-danger-500"
            )}
          >
            {label}
          </label>
        )}
        
        <div className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          hasError && [
            'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500',
            'dark:border-danger-400 dark:focus-within:border-danger-400 dark:focus-within:ring-danger-400'
          ],
          hasSuccess && [
            'border-success-500 focus-within:border-success-500 focus-within:ring-success-500',
            'dark:border-success-400 dark:focus-within:border-success-400 dark:focus-within:ring-success-400'
          ],
          className
        )}>
          {leftIcon && (
            <div className="flex items-center pl-3 text-secondary-400">
              {leftIcon}
            </div>
          )}
          
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {options ? (
              groupedOptions && Object.keys(groupedOptions).length > 1 ? (
                // Render with optgroups
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  group === 'default' ? (
                    groupOptions.map((option) => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <optgroup key={group} label={group}>
                      {groupOptions.map((option) => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  )
                ))
              ) : (
                // Render without optgroups
                options.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              )
            ) : (
              children
            )}
          </select>
          
          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {loading ? (
              <LoadingSpinner />
            ) : hasSuccess ? (
              <svg className="h-4 w-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : rightIcon ? (
              rightIcon
            ) : (
              <ChevronDownIcon />
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 flex items-center text-sm text-danger-600 dark:text-danger-400">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        
        {/* Success message */}
        {hasSuccess && successMessage && (
          <p className="mt-1 flex items-center text-sm text-success-600 dark:text-success-400">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !error && !hasSuccess && (
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
