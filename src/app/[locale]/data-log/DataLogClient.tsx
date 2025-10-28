"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { InventoryTable } from "@/components/tables/InventoryTable";
import { InventoryFilters } from "@/components/filters/InventoryFilters";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/Loading";
import { Toast } from "@/components/ui/Toast";
import { ExportButton } from "@/components/ui/ExportButton";

// Dynamically import modals (only loaded when needed)
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

interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  destinations: string[];
  categories: string[];
}

interface DataLogClientProps {
  userRole: string;
}

export function DataLogClient({ userRole }: DataLogClientProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    dateFrom: "",
    dateTo: "",
    destinations: [],
    categories: [],
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.destinations.length > 0) params.append("destinations", filters.destinations.join(","));
      if (filters.categories.length > 0) params.append("categories", filters.categories.join(","));

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
  }, [currentPage, itemsPerPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  return (
    <div className="mt-4 md:mt-8 space-y-4 md:space-y-6">
      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableCategories={availableCategories}
      />

      {/* Export Button */}
      <div className="flex justify-end px-4 md:px-0">
        <ExportButton filters={filters} />
      </div>

      {/* Table */}
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

      {/* Edit Modal */}
      <EditInventoryModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          showToast("Inventory item updated successfully", "success");
          fetchItems();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingItem?.itemName || ""}
      />

      {/* Toast Notification */}
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
