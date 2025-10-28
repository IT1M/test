"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  errors: ImportError[];
  data?: any[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<ImportResult>;
}

const REQUIRED_COLUMNS = [
  { key: "itemName", label: "Item Name", required: true },
  { key: "batch", label: "Batch Number", required: true },
  { key: "quantity", label: "Quantity", required: true },
  { key: "reject", label: "Reject Quantity", required: true },
  { key: "destination", label: "Destination", required: true },
  { key: "category", label: "Category", required: false },
  { key: "notes", label: "Notes", required: false },
];

const SAMPLE_DATA = [
  {
    itemName: "Surgical Mask",
    batch: "MASK001",
    quantity: 1000,
    reject: 5,
    destination: "MAIS",
    category: "PPE",
    notes: "Standard surgical masks",
  },
  {
    itemName: "N95 Respirator",
    batch: "N95002",
    quantity: 500,
    reject: 2,
    destination: "FOZAN",
    category: "PPE",
    notes: "High filtration respirators",
  },
];

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state
  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setIsProcessing(false);
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      alert("Please select a valid CSV or Excel file");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // Parse uploaded file
  const parseFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/inventory/import/parse", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setParsedData(result.data);
        setStep("preview");
      } else {
        alert(result.error?.message || "Failed to parse file");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("An error occurred while parsing the file");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setStep("processing");
    setIsProcessing(true);

    try {
      const result = await onImport(parsedData);
      setImportResult(result);
      setStep("results");
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        totalRows: parsedData.length,
        successfulRows: 0,
        errors: [{ row: 0, field: "general", message: "Import failed", value: null }],
      });
      setStep("results");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample template
  const downloadTemplate = () => {
    const headers = REQUIRED_COLUMNS.map(col => col.label);
    const csvContent = [
      headers.join(","),
      ...SAMPLE_DATA.map(row => 
        REQUIRED_COLUMNS.map(col => {
          const value = row[col.key as keyof typeof row];
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          Import Inventory Data
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400">
          Upload a CSV or Excel file to import multiple inventory items at once
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
            : "border-secondary-300 dark:border-secondary-700 hover:border-secondary-400 dark:hover:border-secondary-600"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="space-y-2">
          <p className="text-secondary-600 dark:text-secondary-400">
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Click to upload
            </Button>
            {" "}or drag and drop
          </p>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            CSV, XLS, or XLSX files up to 10MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Template Download */}
      <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
              Need a template?
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Download our sample template with the correct format and example data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            Download Template
          </Button>
        </div>
      </div>

      {/* Required Columns */}
      <div>
        <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-3">
          Required Columns
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REQUIRED_COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex items-center text-sm"
            >
              <span
                className={cn(
                  "inline-block w-2 h-2 rounded-full mr-2",
                  col.required ? "bg-danger-500" : "bg-secondary-400"
                )}
              />
              <span className="text-secondary-700 dark:text-secondary-300">
                {col.label}
                {col.required && <span className="text-danger-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
            Preview Import Data
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            {parsedData.length} rows found in {file?.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setStep("upload")}
        >
          Choose Different File
        </Button>
      </div>

      {/* Data Preview Table */}
      <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Row
                </th>
                {REQUIRED_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider"
                  >
                    {col.label}
                    {col.required && <span className="text-danger-500 ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
              {parsedData.slice(0, 10).map((row, index) => (
                <tr key={index} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                  <td className="px-3 py-2 text-sm text-secondary-500 dark:text-secondary-400">
                    {index + 1}
                  </td>
                  {REQUIRED_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 text-sm text-secondary-900 dark:text-secondary-100"
                    >
                      {row[col.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {parsedData.length > 10 && (
          <div className="bg-secondary-50 dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-400">
            Showing first 10 rows of {parsedData.length} total rows
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => setStep("upload")}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={parsedData.length === 0}
        >
          Import {parsedData.length} Items
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-12">
      <svg
        className="animate-spin mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
        Processing Import
      </h3>
      <p className="text-secondary-600 dark:text-secondary-400">
        Please wait while we import your data...
      </p>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={cn(
            "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4",
            importResult?.success
              ? "bg-success-100 dark:bg-success-900/30"
              : "bg-danger-100 dark:bg-danger-900/30"
          )}
        >
          {importResult?.success ? (
            <svg
              className="w-6 h-6 text-success-600 dark:text-success-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-danger-600 dark:text-danger-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          {importResult?.success ? "Import Completed" : "Import Failed"}
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400">
          {importResult?.successfulRows} of {importResult?.totalRows} rows imported successfully
        </p>
      </div>

      {/* Errors */}
      {importResult?.errors && importResult.errors.length > 0 && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <h4 className="font-medium text-danger-800 dark:text-danger-200 mb-3">
            Import Errors ({importResult.errors.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {importResult.errors.slice(0, 10).map((error, index) => (
              <div
                key={index}
                className="text-sm text-danger-700 dark:text-danger-300"
              >
                Row {error.row}: {error.field} - {error.message}
              </div>
            ))}
            {importResult.errors.length > 10 && (
              <div className="text-sm text-danger-600 dark:text-danger-400">
                ... and {importResult.errors.length - 10} more errors
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-3">
        <Button
          variant="outline"
          onClick={resetModal}
        >
          Import More Data
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            resetModal();
            onClose();
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetModal();
        onClose();
      }}
      title="Bulk Import"
      size="xl"
    >
      {step === "upload" && renderUploadStep()}
      {step === "preview" && renderPreviewStep()}
      {step === "processing" && renderProcessingStep()}
      {step === "results" && renderResultsStep()}
    </Modal>
  );
}