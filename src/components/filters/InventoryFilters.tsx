"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Badge";

interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  destinations: string[];
  categories: string[];
}

interface InventoryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: string[];
}

export function InventoryFilters({
  filters,
  onFiltersChange,
  availableCategories,
}: InventoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Debounced search - only trigger on search changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.search]);

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }));
  };

  const handleDateFromChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, dateFrom: value }));
  };

  const handleDateToChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, dateTo: value }));
  };

  const handleDestinationToggle = (destination: string) => {
    setLocalFilters((prev) => {
      const destinations = prev.destinations.includes(destination)
        ? prev.destinations.filter((d) => d !== destination)
        : [...prev.destinations, destination];
      return { ...prev, destinations };
    });
  };

  const handleCategoryToggle = (category: string) => {
    setLocalFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: "",
      dateFrom: "",
      dateTo: "",
      destinations: [],
      categories: [],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const setDatePreset = (preset: "today" | "week" | "month" | "year") => {
    const today = new Date();
    const dateTo = today.toISOString().split("T")[0];
    let dateFrom = "";

    switch (preset) {
      case "today":
        dateFrom = dateTo;
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFrom = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFrom = monthAgo.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFrom = yearAgo.toISOString().split("T")[0];
        break;
    }

    setLocalFilters((prev) => ({ ...prev, dateFrom, dateTo }));
  };

  const hasActiveFilters =
    localFilters.search ||
    localFilters.dateFrom ||
    localFilters.dateTo ||
    localFilters.destinations.length > 0 ||
    localFilters.categories.length > 0;

  return (
    <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 p-6">
      <div className="space-y-6">
        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder="Search by item name or batch number..."
            value={localFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            label="Search"
          />
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={localFilters.dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              label="From"
            />
            <Input
              type="date"
              value={localFilters.dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              label="To"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("today")}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("week")}
            >
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("month")}
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("year")}
            >
              Last Year
            </Button>
          </div>
        </div>

        {/* Destination Filter */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Destination
          </label>
          <div className="flex flex-wrap gap-2">
            {["MAIS", "FOZAN"].map((destination) => (
              <label
                key={destination}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localFilters.destinations.includes(destination)}
                  onChange={() => handleDestinationToggle(destination)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  {destination}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Tag
                  key={category}
                  variant={
                    localFilters.categories.includes(category)
                      ? "primary"
                      : "default"
                  }
                  onRemove={
                    localFilters.categories.includes(category)
                      ? () => handleCategoryToggle(category)
                      : undefined
                  }
                >
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="text-sm"
                  >
                    {category}
                  </button>
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
          <Button onClick={handleApply} variant="primary" className="flex-1">
            Apply Filters
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasActiveFilters}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
