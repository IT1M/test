"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface FilterStateConfig {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'dateRange';
  defaultValue?: any;
}

export function useFilterState(configs: FilterStateConfig[], enableUrlSync: boolean = true) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL or defaults
  useEffect(() => {
    const initialFilters: Record<string, any> = {};

    configs.forEach(config => {
      if (enableUrlSync) {
        const urlValue = searchParams.get(config.key);
        if (urlValue !== null) {
          switch (config.type) {
            case 'string':
              initialFilters[config.key] = urlValue;
              break;
            case 'number':
              const numValue = parseFloat(urlValue);
              if (!isNaN(numValue)) {
                initialFilters[config.key] = numValue;
              }
              break;
            case 'boolean':
              initialFilters[config.key] = urlValue === 'true';
              break;
            case 'array':
              initialFilters[config.key] = urlValue.split(',').filter(Boolean);
              break;
            case 'dateRange':
              const [start, end] = urlValue.split('|');
              if (start && end) {
                initialFilters[config.key] = [start, end];
              }
              break;
          }
        } else if (config.defaultValue !== undefined) {
          initialFilters[config.key] = config.defaultValue;
        }
      } else if (config.defaultValue !== undefined) {
        initialFilters[config.key] = config.defaultValue;
      }
    });

    setFilters(initialFilters);
    setIsInitialized(true);
  }, [searchParams, configs, enableUrlSync]);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: Record<string, any>) => {
    if (!enableUrlSync || !isInitialized) return;

    const params = new URLSearchParams(searchParams);

    // Clear existing filter params
    configs.forEach(config => {
      params.delete(config.key);
    });

    // Add new filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      const config = configs.find(c => c.key === key);
      if (!config) return;

      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        
        switch (config.type) {
          case 'string':
          case 'number':
          case 'boolean':
            params.set(key, String(value));
            break;
          case 'array':
            if (Array.isArray(value) && value.length > 0) {
              params.set(key, value.join(','));
            }
            break;
          case 'dateRange':
            if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
              params.set(key, `${value[0]}|${value[1]}`);
            }
            break;
        }
      }
    });

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [enableUrlSync, isInitialized, searchParams, configs, pathname, router]);

  // Update single filter
  const updateFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateUrl(newFilters);
  }, [filters, updateUrl]);

  // Update multiple filters
  const updateFilters = useCallback((updates: Record<string, any>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    updateUrl(newFilters);
  }, [filters, updateUrl]);

  // Remove filter
  const removeFilter = useCallback((key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    updateUrl(newFilters);
  }, [filters, updateUrl]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilters: Record<string, any> = {};
    configs.forEach(config => {
      if (config.defaultValue !== undefined) {
        defaultFilters[config.key] = config.defaultValue;
      }
    });
    setFilters(defaultFilters);
    updateUrl(defaultFilters);
  }, [configs, updateUrl]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const config = configs.find(c => c.key === key);
      if (!config) return false;

      if (config.defaultValue !== undefined && value === config.defaultValue) {
        return false;
      }

      return value !== undefined && value !== null && value !== '' && 
             !(Array.isArray(value) && value.length === 0);
    }).length;
  }, [filters, configs]);

  // Check if filters have changed from defaults
  const hasActiveFilters = useCallback(() => {
    return getActiveFilterCount() > 0;
  }, [getActiveFilterCount]);

  return {
    filters,
    updateFilter,
    updateFilters,
    removeFilter,
    clearFilters,
    getActiveFilterCount,
    hasActiveFilters,
    isInitialized
  };
}