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
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useState(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  });

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
    if (isMobile) {
      setIsOpen(false);
    }
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
    if (isMobile) {
      setIsOpen(false);
    }
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

  // Mobile Bottom Sheet View
  if (isMobile) {
    return (
      <>
        {/* Mobile Filter Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            className="flex-1 relative"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Bottom Sheet Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet */}
            <div className="relative w-full bg-white dark:bg-secondary-900 rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-secondary-300 dark:bg-secondary-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 dark:border-secondary-800">
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Filters
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                  aria-label="Close filters"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter Content */}
              <div className="p-6 space-y-6">
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
                  <div className="space-y-3">
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
                  <div className="mt-3 grid grid-cols-2 gap-2">
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
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Destination
                  </label>
                  <div className="space-y-3">
                    {["MAIS", "FOZAN"].map((destination) => (
                      <label
                        key={destination}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.destinations.includes(destination)}
                          onChange={() => handleDestinationToggle(destination)}
                          className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                        <span className="text-base text-secondary-700 dark:text-secondary-300">
                          {destination}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
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
                            className="text-sm py-1"
                          >
                            {category}
                          </button>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Action Buttons */}
              <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 p-6 space-y-3">
                <Button onClick={handleApply} variant="primary" className="w-full">
                  Apply Filters
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={!hasActiveFilters}
                  className="w-full"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop View
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
