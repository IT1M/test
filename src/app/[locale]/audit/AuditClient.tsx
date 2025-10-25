"use client";

import { useState, useEffect } from "react";
import { AuditLogTable } from "@/components/tables/AuditLogTable";
import { AuditLogFilters } from "@/components/filters/AuditLogFilters";
import { Pagination } from "@/components/ui/Pagination";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface FilterState {
  userId: string;
  action: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

interface AuditClientProps {
  initialLogs: any[];
  initialMeta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  availableUsers: Array<{ id: string; name: string; email: string }>;
  availableEntityTypes: string[];
}

export function AuditClient({
  initialLogs,
  initialMeta,
  availableUsers,
  availableEntityTypes,
}: AuditClientProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    userId: "",
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit/logs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setMeta(result.meta);
      } else {
        toast.error(result.error?.message || "Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const params = new URLSearchParams({
        format,
      });

      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Audit Logs
          </h1>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            View and track all system activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
          <div className="relative">
            <Button
              variant="primary"
              onClick={() => {
                const menu = document.getElementById("export-menu");
                menu?.classList.toggle("hidden");
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </Button>
            <div
              id="export-menu"
              className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-secondary-800 ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("csv")}
                  className="block w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="block w-full text-left px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableUsers={availableUsers}
          availableEntityTypes={availableEntityTypes}
        />
      )}

      {/* Stats */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            Showing {meta.total === 0 ? 0 : (page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, meta.total)} of {meta.total} audit logs
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600 dark:text-secondary-400">
              Per page:
            </label>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border border-secondary-300 dark:border-secondary-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-secondary-950 text-secondary-900 dark:text-secondary-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      ) : (
        <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 overflow-hidden">
          <AuditLogTable
            logs={logs}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={meta.pages}
          totalItems={meta.total}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleLimitChange}
        />
      )}
    </div>
  );
}
