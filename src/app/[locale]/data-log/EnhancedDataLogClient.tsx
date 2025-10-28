"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { SmartSearch, SearchSuggestion } from "@/components/search/SmartSearch";
import { AdvancedFilters, FilterConfig } from "@/components/filters/AdvancedFilters";
import { SavedSearches, SavedSearch } from "@/components/search/SavedSearches";
import { FilterChipGroup } from "@/components/ui/FilterChip";
import { InventoryTable } from "@/components/tables/InventoryTable";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/Loading";
import { Toast } from "@/components/ui/Toast";
import { ExportButton } from "@/components/ui/ExportButton";
import { Button } from "@/components/ui/Button";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useFilterState } from "@/hooks/useFilterState";
import { cn } from "@/utils/cn";

// Dynamically import modals
const EditInventoryModal = dynamic(
  () => import("@/components/modals/EditInventoryModal").then((mod) => ({ default: mod.EditInventoryModal })),
  { ssr: false }
);

const DeleteConfirmModal = dynamic(
  () => import("@/components/modals/DeleteConfirmModal").then((mod) => ({ default: mod.DeleteConfirmModal })),
  { ssr: false }
);

interface InventoryItem {
  id: string;
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
  destination: "MAIS" | "FOZAN";
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  enteredBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface EnhancedDataLogClientProps {
  userRole: string;
}

export function EnhancedDataLogClient({ userRole }: EnhancedDataLogClientProps) {
  // State management
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  // Hooks
  const { history, addToHistory } = useSearchHistory();
  const { suggestions, loading: suggestionsLoading } = useSearchSuggestions(searchQuery);
  const { 
    searches, 
    createSearch, 
    loading: savedSearchesLoading 
  } = useSavedSearches();

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      id: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      id: 'dateTo',
      label: 'Date To',
      type: 'date'
    },
    {
      id: 'destinations',
      label: 'Destinations',
      type: 'multiSelect',
      options: [
        { value: 'MAIS', label: 'MAIS' },
        { value: 'FOZAN', label: 'FOZAN' }
      ]
    },
    {
      id: 'categories',
      label: 'Categories',
      type: 'multiSelect',
      options: availableCategories.map(cat => ({ value: cat, label: cat }))
    },
    {
      id: 'minQuantity',
      label: 'Min Quantity',
      type: 'number',
      min: 0
    },
    {
      id: 'maxQuantity',
      label: 'Max Quantity',
      type: 'number',
      min: 0
    },
    {
      id: 'hasRejects',
      label: 'Has Rejects',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
  ];

  // Filter state management
  const {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    getActiveFilterCount
  } = useFilterState([
    { key: 'dateFrom', type: 'string' },
    { key: 'dateTo', type: 'string' },
    { key: 'destinations', type: 'array', defaultValue: [] },
    { key: 'categories', type: 'array', defaultValue: [] },
    { key: 'minQuantity', type: 'number' },
    { key: 'maxQuantity', type: 'number' },
    { key: 'hasRejects', type: 'string' }
  ]);

  // Fetch inventory items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.destinations?.length > 0) params.append("destinations", filters.destinations.join(","));
      if (filters.categories?.length > 0) params.append("categories", filters.categories.join(","));
      if (filters.minQuantity) params.append("minQuantity", filters.minQuantity.toString());
      if (filters.maxQuantity) params.append("maxQuantity", filters.maxQuantity.toString());
      if (filters.hasRejects) params.append("hasRejects", filters.hasRejects);

      const response = await fetch(`/api/inventory?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setItems(result.data);
        setTotalItems(result.meta.total);
        setTotalPages(result.meta.pages);

        // Extract unique categories
        const categories = Array.from(
          new Set(
            result.data
              .map((item: InventoryItem) => item.category)
              .filter((cat: string | null) => cat !== null)
          )
        ) as string[];
        setAvailableCategories(categories);
      } else {
        showToast("Failed to load inventory items", "error");
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      showToast("An error occurred while loading data", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchQuery, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (query.trim()) {
      addToHistory(query, filters);
    }
  }, [addToHistory, filters]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'saved' && suggestion.metadata?.filters) {
      updateFilters(suggestion.metadata.filters);
    }
    handleSearch(suggestion.value);
  }, [handleSearch, updateFilters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    updateFilters(newFilters);
    setCurrentPage(1);
  }, [updateFilters]);

  // Handle saved search selection
  const handleSavedSearchSelect = useCallback((savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    updateFilters(savedSearch.filters);
    setCurrentPage(1);
    setShowSavedSearches(false);
  }, [updateFilters]);

  // Handle save current search
  const handleSaveCurrentSearch = useCallback(async (data: {
    name: string;
    description?: string;
    query: string;
    filters: Record<string, any>;
  }) => {
    try {
      await createSearch({
        name: data.name,
        description: data.description,
        query: data.query,
        filters: data.filters,
        isPublic: false
      });
      showToast("Search saved successfully", "success");
    } catch (error) {
      showToast("Failed to save search", "error");
    }
  }, [createSearch]);

  // Other handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleDelete = (item: InventoryItem) => {
    setDeletingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const response = await fetch(`/api/inventory/${deletingItem.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        showToast("Inventory item deleted successfully", "success");
        fetchItems();
        setSelectedIds(selectedIds.filter((id) => id !== deletingItem.id));
      } else {
        showToast(result.error?.message || "Failed to delete item", "error");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast("An error occurred while deleting the item", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Generate filter chips
  const filterChips = useMemo(() => {
    const chips: Array<{
      id: string;
      label: string;
      value?: string;
      onRemove: () => void;
    }> = [];

    if (searchQuery) {
      chips.push({
        id: 'search',
        label: 'Search',
        value: searchQuery,
        onRemove: () => setSearchQuery('')
      });
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const config = filterConfigs.find(f => f.id === key);
      if (!config) return;

      if (Array.isArray(value)) {
        value.forEach(val => {
          const option = config.options?.find(opt => opt.value === val);
          chips.push({
            id: `${key}-${val}`,
            label: config.label,
            value: option?.label || val,
            onRemove: () => {
              const newValue = filters[key].filter((v: any) => v !== val);
              updateFilters({ [key]: newValue });
            }
          });
        });
      } else {
        let displayValue = value;
        if (config.type === 'select') {
          const option = config.options?.find(opt => opt.value === value);
          displayValue = option?.label || value;
        }

        chips.push({
          id: key,
          label: config.label,
          value: displayValue,
          onRemove: () => updateFilters({ [key]: undefined })
        });
      }
    });

    return chips;
  }, [searchQuery, filters, filterConfigs, updateFilters]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 p-6">
        <div className="space-y-4">
          {/* Main Search */}
          <SmartSearch
            value={searchQuery}
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={suggestions}
            recentSearches={history}
            loading={suggestionsLoading}
            placeholder="Search inventory items, batches, categories..."
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative",
                hasActiveFilters() && "border-primary-300 bg-primary-50 dark:bg-primary-900/20"
              )}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              loading={savedSearchesLoading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved Searches
            </Button>

            {(searchQuery || hasActiveFilters()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  clearFilters();
                }}
                className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
              >
                Clear All
              </Button>
            )}

            <div className="ml-auto">
              <ExportButton 
                filters={{ 
                  search: searchQuery, 
                  ...filters 
                }} 
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          {filterChips.length > 0 && (
            <FilterChipGroup
              chips={filterChips}
              onClearAll={() => {
                setSearchQuery('');
                clearFilters();
              }}
              maxVisible={8}
            />
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800">
          <AdvancedFilters
            filters={filterConfigs}
            values={filters}
            onFiltersChange={handleFiltersChange}
            enableUrlState={true}
            collapsible={false}
            className="p-6"
          />
        </div>
      )}

      {/* Saved Searches Panel */}
      {showSavedSearches && (
        <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800">
          <SavedSearches
            onSearchSelect={handleSavedSearchSelect}
            onSave={handleSaveCurrentSearch}
            currentQuery={searchQuery}
            currentFilters={filters}
            className="p-6"
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
        <div>
          {loading ? (
            "Loading..."
          ) : (
            `Showing ${items.length} of ${totalItems} items`
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Sort by: {sortBy} ({sortOrder})</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <InventoryTable
              items={items}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userRole={userRole}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <EditInventoryModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          showToast("Inventory item updated successfully", "success");
          fetchItems();
        }}
      />

      <DeleteConfirmModal
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingItem?.itemName || ""}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}