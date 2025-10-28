"use client";

import { useState } from "react";
import { InventoryEntryForm } from "@/components/forms/InventoryEntryForm";
import { BulkImportModal } from "@/components/forms/BulkImportModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type TabType = "single" | "bulk" | "preview";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
}

export function EnhancedDataEntryClient() {
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // Handle bulk import
  const handleBulkImport = async (data: any[]): Promise<ImportResult> => {
    try {
      const response = await fetch("/api/inventory/import/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh recent entries if successful
        if (result.successfulRows > 0) {
          fetchRecentEntries();
        }
        return result;
      } else {
        return {
          success: false,
          totalRows: data.length,
          successfulRows: 0,
          errors: [{ row: 0, field: "general", message: result.error?.message || "Import failed", value: null }],
        };
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      return {
        success: false,
        totalRows: data.length,
        successfulRows: 0,
        errors: [{ row: 0, field: "general", message: "Network error occurred", value: null }],
      };
    }
  };

  // Fetch recent entries for preview
  const fetchRecentEntries = async () => {
    try {
      const response = await fetch("/api/inventory?limit=10&sortBy=createdAt&sortOrder=desc");
      if (response.ok) {
        const result = await response.json();
        setRecentEntries(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching recent entries:", error);
    }
  };

  // Handle successful single entry
  const handleSingleEntrySuccess = () => {
    fetchRecentEntries();
  };

  const tabs = [
    {
      id: "single" as TabType,
      label: "Single Entry",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      description: "Add one item at a time with smart suggestions",
    },
    {
      id: "bulk" as TabType,
      label: "Bulk Import",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      description: "Import multiple items from Excel or CSV files",
    },
    {
      id: "preview" as TabType,
      label: "Recent Entries",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      description: "View and verify recently added items",
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-secondary-200 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "preview") {
                  fetchRecentEntries();
                }
              }}
              className={cn(
                "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
              )}
            >
              <span className={cn(
                "mr-2 transition-colors",
                activeTab === tab.id
                  ? "text-primary-500 dark:text-primary-400"
                  : "text-secondary-400 group-hover:text-secondary-500 dark:text-secondary-500 dark:group-hover:text-secondary-400"
              )}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Descriptions */}
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <span className="text-primary-600 dark:text-primary-400">
                {tabs.find(tab => tab.id === activeTab)?.icon}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800">
        {activeTab === "single" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                Single Item Entry
              </h2>
              <div className="flex items-center space-x-2 text-sm text-secondary-500 dark:text-secondary-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Auto-save enabled • Real-time validation • Smart suggestions</span>
              </div>
            </div>
            <InventoryEntryForm onSuccess={handleSingleEntrySuccess} />
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="p-6">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                Bulk Import
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                Import multiple inventory items at once using Excel or CSV files. 
                Our system will validate each entry and provide detailed error reporting.
              </p>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => setShowBulkImportModal(true)}
                  className="inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Start Bulk Import
                </Button>
                <div className="text-sm text-secondary-500 dark:text-secondary-400">
                  Supports CSV, XLS, and XLSX files up to 10MB
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">1000</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">Max rows per import</div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400">99.5%</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">Validation accuracy</div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-info-600 dark:text-info-400">10MB</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">Max file size</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                Recent Entries
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecentEntries}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>

            {recentEntries.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-secondary-300 dark:divide-secondary-700">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Added
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                    {recentEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {entry.itemName}
                          </div>
                          {entry.category && (
                            <div className="text-sm text-secondary-500 dark:text-secondary-400">
                              {entry.category}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                          {entry.batch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900 dark:text-secondary-100">
                            {entry.quantity.toLocaleString()}
                          </div>
                          {entry.reject > 0 && (
                            <div className="text-sm text-danger-600 dark:text-danger-400">
                              {entry.reject} rejected ({((entry.reject / entry.quantity) * 100).toFixed(1)}%)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                            entry.destination === "MAIS"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          )}>
                            {entry.destination}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  No Recent Entries
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Start adding inventory items to see them here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}