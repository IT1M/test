"use client";

import React from 'react';
import { cn } from '@/utils/cn';

export interface FilterChipProps {
  label: string;
  value?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FilterChip({
  label,
  value,
  variant = 'default',
  size = 'md',
  removable = true,
  onRemove,
  onClick,
  icon,
  className,
  disabled = false
}: FilterChipProps) {
  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
    'border focus:outline-none focus:ring-2 focus:ring-offset-2',
    disabled && 'opacity-50 cursor-not-allowed',
    !disabled && onClick && 'cursor-pointer hover:shadow-sm',
    !disabled && !onClick && 'cursor-default'
  );

  const variants = {
    default: cn(
      'bg-secondary-100 text-secondary-800 border-secondary-200',
      'hover:bg-secondary-200 focus:ring-secondary-500',
      'dark:bg-secondary-800 dark:text-secondary-200 dark:border-secondary-700',
      'dark:hover:bg-secondary-700 dark:focus:ring-secondary-400'
    ),
    primary: cn(
      'bg-primary-100 text-primary-800 border-primary-200',
      'hover:bg-primary-200 focus:ring-primary-500',
      'dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800',
      'dark:hover:bg-primary-900/30 dark:focus:ring-primary-400'
    ),
    secondary: cn(
      'bg-secondary-100 text-secondary-800 border-secondary-200',
      'hover:bg-secondary-200 focus:ring-secondary-500',
      'dark:bg-secondary-800 dark:text-secondary-200 dark:border-secondary-700',
      'dark:hover:bg-secondary-700 dark:focus:ring-secondary-400'
    ),
    success: cn(
      'bg-success-100 text-success-800 border-success-200',
      'hover:bg-success-200 focus:ring-success-500',
      'dark:bg-success-900/20 dark:text-success-400 dark:border-success-800',
      'dark:hover:bg-success-900/30 dark:focus:ring-success-400'
    ),
    warning: cn(
      'bg-warning-100 text-warning-800 border-warning-200',
      'hover:bg-warning-200 focus:ring-warning-500',
      'dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800',
      'dark:hover:bg-warning-900/30 dark:focus:ring-warning-400'
    ),
    danger: cn(
      'bg-danger-100 text-danger-800 border-danger-200',
      'hover:bg-danger-200 focus:ring-danger-500',
      'dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800',
      'dark:hover:bg-danger-900/30 dark:focus:ring-danger-400'
    )
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      
      <span className="truncate">
        {label}
        {value && (
          <span className="ml-1 opacity-75">
            {value}
          </span>
        )}
      </span>

      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className={cn(
            'flex-shrink-0 ml-1 rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 focus:outline-none focus:bg-black/10',
            'dark:hover:bg-white/10 dark:focus:bg-white/10',
            disabled && 'cursor-not-allowed'
          )}
          aria-label={`Remove ${label} filter`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

export interface FilterChipGroupProps {
  chips: Array<{
    id: string;
    label: string;
    value?: string;
    variant?: FilterChipProps['variant'];
    removable?: boolean;
    onRemove?: () => void;
    onClick?: () => void;
    icon?: React.ReactNode;
  }>;
  onClearAll?: () => void;
  clearAllLabel?: string;
  className?: string;
  size?: FilterChipProps['size'];
  maxVisible?: number;
  showCount?: boolean;
}

export function FilterChipGroup({
  chips,
  onClearAll,
  clearAllLabel = 'Clear all',
  className,
  size = 'md',
  maxVisible,
  showCount = true
}: FilterChipGroupProps) {
  const visibleChips = maxVisible ? chips.slice(0, maxVisible) : chips;
  const hiddenCount = maxVisible ? Math.max(0, chips.length - maxVisible) : 0;

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {visibleChips.map((chip) => (
        <FilterChip
          key={chip.id}
          label={chip.label}
          value={chip.value}
          variant={chip.variant}
          size={size}
          removable={chip.removable}
          onRemove={chip.onRemove}
          onClick={chip.onClick}
          icon={chip.icon}
        />
      ))}

      {hiddenCount > 0 && (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          'bg-secondary-100 text-secondary-600 border border-secondary-200',
          'dark:bg-secondary-800 dark:text-secondary-400 dark:border-secondary-700'
        )}>
          +{hiddenCount} more
        </span>
      )}

      {showCount && chips.length > 1 && (
        <span className={cn(
          'text-xs text-secondary-500 dark:text-secondary-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          ({chips.length} filters)
        </span>
      )}

      {onClearAll && chips.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'text-xs font-medium text-secondary-600 hover:text-secondary-900',
            'dark:text-secondary-400 dark:hover:text-secondary-100',
            'transition-colors underline-offset-2 hover:underline',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {clearAllLabel}
        </button>
      )}
    </div>
  );
}