"use client";

import * as React from "react";
import { Search, X, Clock, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export type EntityType = "all" | "products" | "customers" | "orders" | "patients" | "medical-records";

interface SearchHistoryItem {
  query: string;
  entityType: EntityType;
  timestamp: Date;
}

interface UniversalSearchProps {
  onSearch: (query: string, entityType: EntityType) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export function UniversalSearch({
  onSearch,
  placeholder = "Search products, customers, orders, patients...",
  className,
  showFilters = true,
  autoFocus = false,
}: UniversalSearchProps) {
  const [query, setQuery] = React.useState("");
  const [entityType, setEntityType] = React.useState<EntityType>("all");
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("searchHistory");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSearchHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      } catch (error) {
        console.error("Failed to parse search history:", error);
      }
    }
  }, []);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Trigger search when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery, entityType);
    }
  }, [debouncedQuery, entityType, onSearch]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Add to search history
    const newHistoryItem: SearchHistoryItem = {
      query: searchQuery,
      entityType,
      timestamp: new Date(),
    };

    const updatedHistory = [
      newHistoryItem,
      ...searchHistory.filter((item) => item.query !== searchQuery),
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));

    onSearch(searchQuery, entityType);
    setShowHistory(false);
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setEntityType(item.entityType);
    handleSearch(item.query);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              } else if (e.key === "Escape") {
                setShowHistory(false);
              }
            }}
            className="pl-10 pr-10"
            autoFocus={autoFocus}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Entity type filter */}
        {showFilters && (
          <Select
            value={entityType}
            onValueChange={(value) => setEntityType(value as EntityType)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="patients">Patients</SelectItem>
              <SelectItem value="medical-records">Medical Records</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Search button */}
        <Button onClick={() => handleSearch()}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Search history dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 p-2 shadow-lg">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Recent Searches
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{item.query}</span>
                </div>
                <Badge variant="outline" className="ml-2 flex-shrink-0">
                  {item.entityType === "all" ? "All" : item.entityType}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Click outside to close history */}
      {showHistory && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
