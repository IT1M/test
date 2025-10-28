import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface Suggestion {
  value: string;
  label: string;
  description?: string;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  successMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'underlined';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  suggestions?: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
  realTimeValidation?: boolean;
  onValidate?: (value: string) => string | null;
  required?: boolean;
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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    success = false,
    successMessage,
    size = 'md',
    variant = 'default',
    leftIcon,
    rightIcon,
    loading = false,
    suggestions = [],
    onSuggestionSelect,
    showSuggestions = false,
    maxSuggestions = 5,
    debounceMs = 300,
    realTimeValidation = false,
    onValidate,
    required = false,
    value,
    onChange,
    onFocus,
    onBlur,
    id,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showSuggestionsList, setShowSuggestionsList] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Combine external ref with internal ref
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Debounced validation
    const debouncedValidation = useCallback((val: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (realTimeValidation && onValidate) {
          const validationResult = onValidate(val);
          setValidationError(validationResult);
        }
      }, debounceMs);
    }, [realTimeValidation, onValidate, debounceMs]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      if (onChange) {
        onChange(e);
      }

      // Show suggestions if available
      if (showSuggestions && suggestions.length > 0 && newValue.length > 0) {
        setShowSuggestionsList(true);
        setSelectedSuggestionIndex(-1);
      } else {
        setShowSuggestionsList(false);
      }

      // Trigger validation
      if (realTimeValidation) {
        debouncedValidation(newValue);
      }
    };

    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) {
        onFocus(e);
      }

      if (showSuggestions && suggestions.length > 0 && String(internalValue).length > 0) {
        setShowSuggestionsList(true);
      }
    };

    // Handle blur
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) {
        onBlur(e);
      }

      // Delay hiding suggestions to allow for clicks
      setTimeout(() => {
        setShowSuggestionsList(false);
        setSelectedSuggestionIndex(-1);
      }, 150);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestionsList && filteredSuggestions.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex(prev =>
              prev < filteredSuggestions.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex(prev =>
              prev > 0 ? prev - 1 : filteredSuggestions.length - 1
            );
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
              handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
            }
            break;
          case 'Escape':
            setShowSuggestionsList(false);
            setSelectedSuggestionIndex(-1);
            break;
        }
      }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: Suggestion) => {
      setInternalValue(suggestion.value);
      setShowSuggestionsList(false);
      setSelectedSuggestionIndex(-1);

      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }

      // Trigger change event
      if (onChange && inputRef.current) {
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { ...inputRef.current, value: suggestion.value }
        });
        onChange(event as any);
      }
    };

    // Filter suggestions based on input value
    const filteredSuggestions = suggestions
      .filter(suggestion =>
        suggestion.label.toLowerCase().includes(String(internalValue).toLowerCase()) ||
        suggestion.value.toLowerCase().includes(String(internalValue).toLowerCase())
      )
      .slice(0, maxSuggestions);

    // Sync internal value with external value
    useEffect(() => {
      if (value !== undefined && value !== internalValue) {
        setInternalValue(value as string);
      }
    }, [value]);

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    const baseClasses = cn(
      'flex w-full rounded-lg border transition-all duration-200',
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

    const inputClasses = cn(
      'flex-1 bg-transparent px-3 py-2 text-secondary-900',
      'placeholder:text-secondary-500 focus:outline-none',
      'dark:text-secondary-100 dark:placeholder:text-secondary-400',
      variant === 'underlined' && 'px-0',
      leftIcon && 'pl-0',
      rightIcon && 'pr-0'
    );

    const currentError = error || validationError;
    const hasError = Boolean(currentError);
    const hasSuccess = success && !hasError;

    return (
      <div className="relative w-full">
        {label && (
          <label
            htmlFor={inputId}
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

          <input
            ref={inputRef}
            type={type}
            id={inputId}
            className={inputClasses}
            value={internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-autocomplete={showSuggestions ? 'list' : undefined}
            aria-expanded={showSuggestionsList ? 'true' : 'false'}
            aria-controls={showSuggestionsList ? `${inputId}-suggestions` : undefined}
            {...props}
          />

          {(rightIcon || loading || hasSuccess) && (
            <div className="flex items-center pr-3 text-secondary-400">
              {loading ? (
                <LoadingSpinner />
              ) : hasSuccess ? (
                <svg className="h-4 w-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestionsList && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            id={`${inputId}-suggestions`}
            role="listbox"
            aria-label="Suggestions"
            className={cn(
              'absolute z-50 mt-1 w-full rounded-lg border border-secondary-200',
              'bg-white shadow-lg dark:border-secondary-700 dark:bg-secondary-900'
            )}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.value}-${index}`}
                role="option"
                aria-selected={index === selectedSuggestionIndex}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  'hover:bg-secondary-50 dark:hover:bg-secondary-800',
                  index === selectedSuggestionIndex && 'bg-primary-50 dark:bg-primary-900/20',
                  index === 0 && 'rounded-t-lg',
                  index === filteredSuggestions.length - 1 && 'rounded-b-lg'
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium text-secondary-900 dark:text-secondary-100">
                  {suggestion.label}
                </div>
                {suggestion.description && (
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                    {suggestion.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {currentError && (
          <p className="mt-1 flex items-center text-sm text-danger-600 dark:text-danger-400">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {currentError}
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
        {helperText && !currentError && !hasSuccess && (
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';