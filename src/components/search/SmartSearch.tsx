"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';

export interface SearchSuggestion {
  id: string;
  value: string;
  label: string;
  type: 'item' | 'batch' | 'category' | 'recent' | 'saved';
  description?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  dateRange?: [Date, Date];
  categories?: string[];
  destinations?: ('MAIS' | 'FOZAN')[];
  customFilters?: Record<string, any>;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
  isShared?: boolean;
}

export interface SmartSearchProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string, filters?: SearchFilters) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  savedSearches?: SavedSearch[];
  loading?: boolean;
  debounceMs?: number;
  maxSuggestions?: number;
  enableHistory?: boolean;
  enableSavedSearches?: boolean;
  className?: string;
}

export function SmartSearch({
  placeholder = "Search inventory items, batches, categories...",
  value = "",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  recentSearches = [],
  savedSearches = [],
  loading = false,
  debounceMs = 300,
  maxSuggestions = 8,
  enableHistory = true,
  enableSavedSearches = true,
  className,
}: SmartSearchProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [localSuggestions, setLocalSuggestions] = useState<SearchSuggestion[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    if (newQuery.trim()) {
      setIsOpen(true);
      debouncedSearch(newQuery);
    } else {
      setIsOpen(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.trim() || recentSearches.length > 0 || savedSearches.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setIsOpen(false), 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = localSuggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && localSuggestions[selectedIndex]) {
          handleSuggestionClick(localSuggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }

    onSearch(suggestion.value);
  };

  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      setIsOpen(false);
      onSearch(query.trim());
    }
  };

  // Handle saved search click
  const handleSavedSearchClick = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setIsOpen(false);
    onSearch(savedSearch.query, savedSearch.filters);
  };

  // Combine and filter suggestions
  useEffect(() => {
    const combined: SearchSuggestion[] = [];

    // Add external suggestions first
    if (suggestions.length > 0) {
      combined.push(...suggestions.slice(0, maxSuggestions));
    }

    // Add recent searches if no query or limited suggestions
    if (enableHistory && (query.length === 0 || combined.length < maxSuggestions)) {
      const recentToAdd = recentSearches
        .filter(recent => 
          query.length === 0 || 
          recent.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxSuggestions - combined.length)
        .map((recent, index) => ({
          id: `recent-${index}`,
          value: recent,
          label: recent,
          type: 'recent' as const,
          description: 'Recent search'
        }));
      
      combined.push(...recentToAdd);
    }

    setLocalSuggestions(combined);
  }, [suggestions, recentSearches, query, maxSuggestions, enableHistory]);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
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

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'item':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'batch':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'category':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'recent':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'saved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className={cn(
              "w-5 h-5 transition-colors",
              loading 
                ? "text-primary-500 animate-pulse" 
                : "text-secondary-400"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-3 text-base",
            "bg-white dark:bg-secondary-900",
            "border border-secondary-300 dark:border-secondary-600",
            "rounded-lg shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            "dark:focus:ring-primary-400 dark:focus:border-primary-400",
            "placeholder:text-secondary-500 dark:placeholder:text-secondary-400",
            "text-secondary-900 dark:text-secondary-100",
            "transition-all duration-200"
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />

        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full mt-1",
            "bg-white dark:bg-secondary-900",
            "border border-secondary-200 dark:border-secondary-700",
            "rounded-lg shadow-lg",
            "max-h-96 overflow-y-auto"
          )}
          role="listbox"
        >
          {/* Saved Searches Section */}
          {enableSavedSearches && savedSearches.length > 0 && query.length === 0 && (
            <div className="p-2 border-b border-secondary-200 dark:border-secondary-700">
              <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400 px-2 py-1 mb-1">
                Saved Searches
              </div>
              {savedSearches.slice(0, 3).map((savedSearch) => (
                <button
                  key={savedSearch.id}
                  onClick={() => handleSavedSearchClick(savedSearch)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left",
                    "hover:bg-secondary-50 dark:hover:bg-secondary-800",
                    "rounded-md transition-colors"
                  )}
                >
                  <div className="text-secondary-400">
                    {getSuggestionIcon('saved')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {savedSearch.name}
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                      {savedSearch.query}
                    </div>
                  </div>
                  {savedSearch.isShared && (
                    <div className="text-xs text-primary-600 dark:text-primary-400">
                      Shared
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions List */}
          {localSuggestions.length > 0 ? (
            <div className="p-2">
              {query.length > 0 && (
                <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400 px-2 py-1 mb-1">
                  Suggestions
                </div>
              )}
              {localSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left",
                    "rounded-md transition-colors",
                    index === selectedIndex
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-secondary-50 dark:hover:bg-secondary-800"
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className={cn(
                    "transition-colors",
                    index === selectedIndex
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-secondary-400"
                  )}>
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {suggestion.label}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                  {suggestion.type === 'recent' && (
                    <div className="text-xs text-secondary-400">
                      Recent
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center text-secondary-500 dark:text-secondary-400">
              <div className="text-sm">No suggestions found</div>
              <div className="text-xs mt-1">Press Enter to search for "{query}"</div>
            </div>
          ) : (
            <div className="p-4 text-center text-secondary-500 dark:text-secondary-400">
              <div className="text-sm">Start typing to search...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}