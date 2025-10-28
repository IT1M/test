"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface ExportButtonProps {
  filters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    destinations?: string[];
    categories?: string[];
  };
  className?: string;
}

type ExportFormat = "csv" | "excel" | "pdf" | "json";

export function ExportButton({ filters, className }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);
    setIsOpen(false);

    try {
      // Build query parameters
      const params = new URLSearchParams({ format });

      if (filters.search) params.append("search", filters.search);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.destinations && filters.destinations.length > 0) {
        params.append("destinations", filters.destinations.join(","));
      }
      if (filters.categories && filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","));
      }

      // Fetch the export file
      const response = await fetch(`/api/inventory/export?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Export failed");
      }

      // Get the blob and file name
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `inventory-export.${format}`;

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success toast with file size
      const fileSizeKB = (blob.size / 1024).toFixed(2);
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      const fileSize = blob.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

      toast.success(`Export successful! File size: ${fileSize}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const exportOptions = [
    {
      format: "csv" as ExportFormat,
      label: "CSV",
      description: "Comma-separated values",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      format: "excel" as ExportFormat,
      label: "Excel",
      description: "Microsoft Excel format",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      format: "pdf" as ExportFormat,
      label: "PDF",
      description: "Portable document format",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      format: "json" as ExportFormat,
      label: "JSON",
      description: "JavaScript object notation",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        isLoading={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <>Exporting {exportingFormat?.toUpperCase()}...</>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </Button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50 overflow-hidden">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Select Format
            </div>
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-left"
              >
                <div className="text-primary-600 dark:text-primary-400 mt-0.5">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {option.label}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
