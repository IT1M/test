"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/cn";

interface Suggestion {
  value: string;
  label: string;
  frequency?: number;
  lastUsed?: Date;
}

interface SmartFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  suggestions?: Suggestion[];
  onSuggestionsFetch?: (query: string) => Promise<Suggestion[]>;
  debounceMs?: number;
  minCharsForSuggestions?: number;
  maxSuggestions?: number;
  showFrequency?: boolean;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export function SmartFormField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  maxLength,
  suggestions = [],
  onSuggestionsFetch,
  debounceMs = 300,
  minCharsForSuggestions = 1,
  maxSuggestions = 10,
  showFrequency = false,
  className,
  disabled = false,
  autoComplete = "off",
}: SmartFormFieldProps) {
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Filter and sort suggestions
  const filterSuggestions = useCallback((query: string, allSuggestions: Suggestion[]) => {
    if (query.length < minCharsForSuggestions) {
      return [];
    }

    const filtered = allSuggestions
      .filter(suggestion => 
        suggestion.value.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.label.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by frequency (if available), then by relevance
        if (showFrequency && a.frequency && b.frequency) {
          if (a.frequency !== b.frequency) {
            return b.frequency - a.frequency;
          }
        }
        
        // Exact matches first
        const aExact = a.value.toLowerCase() === query.toLowerCase();
        const bExact = b.value.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Starts with query
        const aStarts = a.value.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.value.toLowerCase().startsWith(query.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Alphabetical
        return a.value.localeCompare(b.value);
      })
      .slice(0, maxSuggestions);

    return filtered;
  }, [minCharsForSuggestions, maxSuggestions, showFrequency]);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (query.length >= minCharsForSuggestions && onSuggestionsFetch) {
        setIsLoading(true);
        try {
          const fetchedSuggestions = await onSuggestionsFetch(query);
          const allSuggestions = [...suggestions, ...fetchedSuggestions];
          const filtered = filterSuggestions(query, allSuggestions);
          setFilteredSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          // Fall back to static suggestions
          const filtered = filterSuggestions(query, suggestions);
          setFilteredSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use static suggestions only
        const filtered = filterSuggestions(query, suggestions);
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    }, debounceMs);
  }, [suggestions, onSuggestionsFetch, debounceMs, minCharsForSuggestions, filterSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(e);
    setSelectedIndex(-1);
    
    if (newValue.trim()) {
      fetchSuggestions(newValue);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: Suggestion) => {
    const syntheticEvent = {
      target: {
        name,
        value: suggestion.value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          selectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      case "Tab":
        // Allow tab to close suggestions
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Handle input focus
  const handleFocus = () => {
    if (value.length >= minCharsForSuggestions && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        label={label}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={error}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? `${name}-suggestions` : undefined}
        aria-expanded={showSuggestions}
        aria-activedescendant={
          selectedIndex >= 0 ? `${name}-suggestion-${selectedIndex}` : undefined
        }
        role="combobox"
      />
      
      {showSuggestions && (
        <div
          id={`${name}-suggestions`}
          ref={suggestionsRef}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400 flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-secondary-500"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading suggestions...
            </div>
          )}
          
          {!isLoading && filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              id={`${name}-suggestion-${index}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                "hover:bg-secondary-100 dark:hover:bg-secondary-700",
                "focus:bg-secondary-100 dark:focus:bg-secondary-700 focus:outline-none",
                index === selectedIndex && "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-secondary-900 dark:text-secondary-100">
                  {suggestion.label || suggestion.value}
                </span>
                {showFrequency && suggestion.frequency && (
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 ml-2">
                    {suggestion.frequency} uses
                  </span>
                )}
              </div>
            </button>
          ))}
          
          {!isLoading && filteredSuggestions.length === 0 && value.length >= minCharsForSuggestions && (
            <div className="px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}