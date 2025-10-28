"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface DashboardFilterState {
  dateFrom: string;
  dateTo: string;
  destinations: string[];
  categories: string[];
}

export interface DashboardFiltersProps {
  filters: DashboardFilterState;
  onFiltersChange: (filters: DashboardFilterState) => void;
  availableCategories?: string[];
  className?: string;
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  availableCategories = [],
  className,
}: DashboardFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilterState>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: DashboardFilterState = {
      dateFrom: "",
      dateTo: "",
      destinations: [],
      categories: [],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let dateFrom = "";
    let dateTo = today.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        dateFrom = dateTo;
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        dateFrom = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        dateFrom = monthAgo.toISOString().split("T")[0];
        break;
      case "quarter":
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(today.getMonth() - 3);
        dateFrom = quarterAgo.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        dateFrom = yearAgo.toISOString().split("T")[0];
        break;
    }

    setLocalFilters({ ...localFilters, dateFrom, dateTo });
  };

  const toggleDestination = (destination: string) => {
    const newDestinations = localFilters.destinations.includes(destination)
      ? localFilters.destinations.filter((d) => d !== destination)
      : [...localFilters.destinations, destination];
    setLocalFilters({ ...localFilters, destinations: newDestinations });
  };

  const toggleCategory = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter((c) => c !== category)
      : [...localFilters.categories, category];
    setLocalFilters({ ...localFilters, categories: newCategories });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.destinations.length > 0 ||
    filters.categories.length > 0;

  return (
    <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-secondary-600 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Filters
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                Active
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100"
          >
            <svg
              className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Date Range
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {["today", "week", "month", "quarter", "year"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDatePreset(preset)}
                    className="px-3 py-1 text-sm rounded-md bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                  >
                    {preset === "today" && "Today"}
                    {preset === "week" && "Last 7 days"}
                    {preset === "month" && "Last 30 days"}
                    {preset === "quarter" && "Last 90 days"}
                    {preset === "year" && "Last year"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateFrom}
                    onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateTo}
                    onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Destinations */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Destinations
              </label>
              <div className="flex flex-wrap gap-2">
                {["MAIS", "FOZAN"].map((destination) => (
                  <button
                    key={destination}
                    onClick={() => toggleDestination(destination)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors",
                      localFilters.destinations.includes(destination)
                        ? "bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                        : "bg-white dark:bg-secondary-900 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                    )}
                  >
                    {destination}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            {availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md border transition-colors",
                        localFilters.categories.includes(category)
                          ? "bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
                          : "bg-white dark:bg-secondary-900 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleApply} className="flex-1">
                Apply Filters
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
