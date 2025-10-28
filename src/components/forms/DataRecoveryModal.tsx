"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface SavedData {
  data: any;
  timestamp: string;
  version: string;
  sessionId: string;
  checksum: string;
}

interface DataRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (data: any) => void;
  onDiscard: () => void;
  currentData: any;
  savedData: SavedData | null;
  versionHistory: SavedData[];
}

export function DataRecoveryModal({
  isOpen,
  onClose,
  onRestore,
  onDiscard,
  currentData,
  savedData,
  versionHistory,
}: DataRecoveryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<SavedData | null>(savedData);
  const [showComparison, setShowComparison] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDataPreview = (data: any) => {
    if (!data) return "No data";
    
    const preview = {
      itemName: data.itemName || "",
      batch: data.batch || "",
      quantity: data.quantity || "",
      destination: data.destination || "",
    };
    
    return Object.entries(preview)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  const hasChanges = (data1: any, data2: any) => {
    return JSON.stringify(data1) !== JSON.stringify(data2);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Recovery"
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-warning-800 dark:text-warning-200">
                Unsaved Changes Detected
              </h3>
              <p className="mt-1 text-sm text-warning-700 dark:text-warning-300">
                We found previously saved data that might contain unsaved changes. 
                You can restore this data or continue with your current changes.
              </p>
            </div>
          </div>
        </div>

        {/* Current vs Saved Data Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Current Data
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
              {getDataPreview(currentData) || "No data entered"}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              Last modified: Just now
            </p>
          </div>

          <div className="border border-primary-200 dark:border-primary-700 rounded-lg p-4 bg-primary-50 dark:bg-primary-900/20">
            <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
              Saved Data
            </h4>
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-2">
              {savedData ? getDataPreview(savedData.data) : "No saved data"}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              {savedData ? `Saved: ${formatTimestamp(savedData.timestamp)}` : ""}
            </p>
          </div>
        </div>

        {/* Version History */}
        {versionHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                Version History
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? "Hide Details" : "Show Details"}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {versionHistory.map((version, index) => (
                <div
                  key={`${version.timestamp}-${index}`}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-colors",
                    selectedVersion?.timestamp === version.timestamp
                      ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                      : "border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600"
                  )}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Version {versionHistory.length - index}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {formatTimestamp(version.timestamp)}
                      </p>
                      {showComparison && (
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                          {getDataPreview(version.data)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      {hasChanges(currentData, version.data) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200 mr-2">
                          Different
                        </span>
                      )}
                      {selectedVersion?.timestamp === version.timestamp && (
                        <svg
                          className="w-4 h-4 text-primary-600 dark:text-primary-400"
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="flex-1"
          >
            Discard Saved Data
          </Button>
          
          <Button
            variant="primary"
            onClick={() => {
              if (selectedVersion) {
                onRestore(selectedVersion.data);
              } else if (savedData) {
                onRestore(savedData.data);
              }
            }}
            disabled={!selectedVersion && !savedData}
            className="flex-1"
          >
            Restore Selected Data
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Continue Without Restoring
          </Button>
        </div>
      </div>
    </Modal>
  );
}