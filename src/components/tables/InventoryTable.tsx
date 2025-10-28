"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatters";

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

interface InventoryTableProps {
  items: InventoryItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  userRole: string;
}

export function InventoryTable({
  items,
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder,
  onEdit,
  onDelete,
  userRole,
}: InventoryTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const getRejectPercentage = (reject: number, quantity: number): string => {
    if (quantity === 0) return "0.00";
    return ((reject / quantity) * 100).toFixed(2);
  };

  const getRejectBadgeVariant = (reject: number, quantity: number) => {
    const percentage = parseFloat(getRejectPercentage(reject, quantity));
    if (percentage === 0) return "success";
    if (percentage < 5) return "primary";
    if (percentage < 15) return "warning";
    return "danger";
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const canDelete = ["SUPERVISOR", "MANAGER", "ADMIN"].includes(userRole);

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4 p-4">
        {items.length === 0 ? (
          <div className="py-12 text-center text-secondary-500 dark:text-secondary-400">
            No inventory items found
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-lg p-4 space-y-3 shadow-sm"
            >
              {/* Header with checkbox and menu */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectionChange([...selectedIds, item.id]);
                      } else {
                        onSelectionChange(selectedIds.filter((id) => id !== item.id));
                      }
                    }}
                    className="mt-1 h-5 w-5 min-w-[20px] text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    aria-label={`Select ${item.itemName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                      {item.itemName}
                    </h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 font-mono">
                      {item.batch}
                    </p>
                  </div>
                </div>
                <div className="relative ml-2">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Actions menu"
                    aria-expanded={openMenuId === item.id}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {openMenuId === item.id && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onEdit(item);
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-4 py-3 text-base text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              onDelete(item);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-3 text-base text-danger-600 dark:text-danger-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Quantity</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    {item.quantity.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Reject</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    {item.reject.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Reject %</span>
                  <Badge variant={getRejectBadgeVariant(item.reject, item.quantity)} size="sm">
                    {getRejectPercentage(item.reject, item.quantity)}%
                  </Badge>
                </div>
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Destination</span>
                  <Badge variant={item.destination === "MAIS" ? "primary" : "secondary"} size="sm">
                    {item.destination}
                  </Badge>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2 text-sm">
                {item.category && (
                  <div className="flex justify-between">
                    <span className="text-secondary-500 dark:text-secondary-400">Category:</span>
                    <span className="text-secondary-900 dark:text-secondary-100">{item.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Date:</span>
                  <span className="text-secondary-900 dark:text-secondary-100">{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Entered by:</span>
                  <span className="text-secondary-900 dark:text-secondary-100">{item.enteredBy.name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
        <thead className="bg-secondary-50 dark:bg-secondary-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.length === items.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => onSort("itemName")}
            >
              <div className="flex items-center gap-2">
                Item Name
                <SortIcon field="itemName" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => onSort("batch")}
            >
              <div className="flex items-center gap-2">
                Batch
                <SortIcon field="batch" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => onSort("quantity")}
            >
              <div className="flex items-center gap-2">
                Quantity
                <SortIcon field="quantity" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Reject
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Reject %
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Destination
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Category
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => onSort("createdAt")}
            >
              <div className="flex items-center gap-2">
                Date
                <SortIcon field="createdAt" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Entered By
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-950 divide-y divide-secondary-200 dark:divide-secondary-800">
          {items.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                No inventory items found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {item.itemName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {item.batch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {item.reject.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getRejectBadgeVariant(item.reject, item.quantity)} size="sm">
                    {getRejectPercentage(item.reject, item.quantity)}%
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={item.destination === "MAIS" ? "primary" : "secondary"} size="sm">
                    {item.destination}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {item.category || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                  {item.enteredBy.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {openMenuId === item.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onEdit(item);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                          >
                            Edit
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => {
                                onDelete(item);
                                setOpenMenuId(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
