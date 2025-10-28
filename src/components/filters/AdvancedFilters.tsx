"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export interface FilterValue {
  id: string;
  label: string;
  value: any;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'multiSelect' | 'number';
  removable?: boolean;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'multiSelect' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  enableUrlState?: boolean;
  className?: string;
  showActiveCount?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function AdvancedFilters({
  filters,
  values,
  onFiltersChange,
  enableUrlState = true,
  className,
  showActiveCount = true,
  collapsible = true,
  defaultCollapsed = false
}: AdvancedFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync URL state with filters
  useEffect(() => {
    if (enableUrlState) {
      const urlFilters: Record<string, any> = {};
      
      filters.forEach(filter => {
        const paramValue = searchParams.get(filter.id);
        if (paramValue) {
          switch (filter.type) {
            case 'multiSelect':
              urlFilters[filter.id] = paramValue.split(',');
              break;
            case 'number':
              urlFilters[filter.id] = parseFloat(paramValue);
              break;
            case 'dateRange':
              const [start, end] = paramValue.split('|');
              if (start && end) {
                urlFilters[filter.id] = [start, end];
              }
              break;
            default:
              urlFilters[filter.id] = paramValue;
          }
        }
      });

      if (Object.keys(urlFilters).length > 0) {
        setLocalValues(prev => ({ ...prev, ...urlFilters }));
        onFiltersChange({ ...values, ...urlFilters });
      }
    }
  }, [searchParams, filters, enableUrlState]);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: Record<string, any>) => {
    if (!enableUrlState) return;

    const params = new URLSearchParams(searchParams);

    // Clear existing filter params
    filters.forEach(filter => {
      params.delete(filter.id);
    });

    // Add new filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        
        const filter = filters.find(f => f.id === key);
        if (filter) {
          switch (filter.type) {
            case 'multiSelect':
              if (Array.isArray(value) && value.length > 0) {
                params.set(key, value.join(','));
              }
              break;
            case 'dateRange':
              if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
                params.set(key, `${value[0]}|${value[1]}`);
              }
              break;
            default:
              params.set(key, String(value));
          }
        }
      }
    });

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [enableUrlState, searchParams, filters, pathname, router]);

  // Handle filter value change
  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...localValues, [filterId]: value };
    setLocalValues(newValues);
    onFiltersChange(newValues);
    updateUrl(newValues);
  };

  // Remove specific filter
  const removeFilter = (filterId: string) => {
    const newValues = { ...localValues };
    delete newValues[filterId];
    setLocalValues(newValues);
    onFiltersChange(newValues);
    updateUrl(newValues);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalValues({});
    onFiltersChange({});
    updateUrl({});
  };

  // Get active filter chips
  const getActiveFilterChips = (): FilterValue[] => {
    const chips: FilterValue[] = [];

    Object.entries(localValues).forEach(([key, value]) => {
      const filter = filters.find(f => f.id === key);
      if (!filter || value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        return;
      }

      switch (filter.type) {
        case 'text':
        case 'number':
        case 'date':
          chips.push({
            id: key,
            label: `${filter.label}: ${value}`,
            value,
            type: filter.type,
            removable: true
          });
          break;
        
        case 'select':
          const option = filter.options?.find(opt => opt.value === value);
          chips.push({
            id: key,
            label: `${filter.label}: ${option?.label || value}`,
            value,
            type: filter.type,
            removable: true
          });
          break;
        
        case 'multiSelect':
          if (Array.isArray(value) && value.length > 0) {
            value.forEach(val => {
              const option = filter.options?.find(opt => opt.value === val);
              chips.push({
                id: `${key}-${val}`,
                label: `${filter.label}: ${option?.label || val}`,
                value: val,
                type: filter.type,
                removable: true
              });
            });
          }
          break;
        
        case 'dateRange':
          if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
            chips.push({
              id: key,
              label: `${filter.label}: ${value[0]} - ${value[1]}`,
              value,
              type: filter.type,
              removable: true
            });
          }
          break;
      }
    });

    return chips;
  };

  // Handle chip removal
  const handleChipRemove = (chip: FilterValue) => {
    if (chip.type === 'multiSelect') {
      const [filterId, chipValue] = chip.id.split('-');
      const currentValues = localValues[filterId] || [];
      const newValues = currentValues.filter((val: any) => val !== chipValue);
      handleFilterChange(filterId, newValues);
    } else {
      removeFilter(chip.id);
    }
  };

  const activeChips = getActiveFilterChips();
  const activeCount = activeChips.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Filters
          </h3>
          {showActiveCount && activeCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
              {activeCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
            >
              Clear all
            </Button>
          )}
          
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
            >
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <div
              key={chip.id}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm",
                "bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400",
                "border border-primary-200 dark:border-primary-800"
              )}
            >
              <span className="truncate max-w-xs">{chip.label}</span>
              {chip.removable && (
                <button
                  onClick={() => handleChipRemove(chip)}
                  className="ml-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-1">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {filter.label}
              </label>
              
              {filter.type === 'text' && (
                <Input
                  type="text"
                  placeholder={filter.placeholder}
                  value={localValues[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                />
              )}

              {filter.type === 'number' && (
                <Input
                  type="number"
                  placeholder={filter.placeholder}
                  min={filter.min}
                  max={filter.max}
                  step={filter.step}
                  value={localValues[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value ? parseFloat(e.target.value) : '')}
                />
              )}

              {filter.type === 'date' && (
                <Input
                  type="date"
                  value={localValues[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                />
              )}

              {filter.type === 'dateRange' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={localValues[filter.id]?.[0] || ''}
                    onChange={(e) => {
                      const current = localValues[filter.id] || ['', ''];
                      handleFilterChange(filter.id, [e.target.value, current[1]]);
                    }}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={localValues[filter.id]?.[1] || ''}
                    onChange={(e) => {
                      const current = localValues[filter.id] || ['', ''];
                      handleFilterChange(filter.id, [current[0], e.target.value]);
                    }}
                  />
                </div>
              )}

              {filter.type === 'select' && filter.options && (
                <Select
                  value={localValues[filter.id] || ''}
                  onValueChange={(value) => handleFilterChange(filter.id, value)}
                >
                  <option value="">{filter.placeholder || 'Select...'}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}

              {filter.type === 'multiSelect' && filter.options && (
                <div className="space-y-2">
                  <div className="max-h-32 overflow-y-auto border border-secondary-300 dark:border-secondary-600 rounded-md p-2 space-y-1">
                    {filter.options.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(localValues[filter.id] || []).includes(option.value)}
                          onChange={(e) => {
                            const current = localValues[filter.id] || [];
                            const newValue = e.target.checked
                              ? [...current, option.value]
                              : current.filter((val: any) => val !== option.value);
                            handleFilterChange(filter.id, newValue);
                          }}
                          className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-secondary-700 dark:text-secondary-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}