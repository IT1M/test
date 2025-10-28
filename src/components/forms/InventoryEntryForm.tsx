"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { SmartFormField } from "@/components/forms/SmartFormField";
import { ValidatedInput } from "@/components/forms/ValidatedInput";
import { DataRecoveryModal } from "@/components/forms/DataRecoveryModal";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  itemNameValidator,
  batchValidator,
  quantityValidator,
  rejectValidator,
  destinationValidator,
  categoryValidator,
  notesValidator,
  validateInventoryForm,
  type ValidationResult,
} from "@/services/validation";
import { cn } from "@/utils/cn";

interface InventoryFormData {
  itemName: string;
  batch: string;
  quantity: string;
  reject: string;
  destination: "MAIS" | "FOZAN" | "";
  category: string;
  notes: string;
}

interface FormErrors {
  itemName?: string;
  batch?: string;
  quantity?: string;
  reject?: string;
  destination?: string;
  category?: string;
  notes?: string;
}

interface FormWarnings {
  itemName?: string;
  batch?: string;
  quantity?: string;
  reject?: string;
  destination?: string;
  category?: string;
  notes?: string;
}

interface Suggestion {
  value: string;
  label: string;
  frequency?: number;
  lastUsed?: Date;
}

const INITIAL_FORM_DATA: InventoryFormData = {
  itemName: "",
  batch: "",
  quantity: "",
  reject: "",
  destination: "",
  category: "",
  notes: "",
};

// Common item names for autocomplete (fallback)
const COMMON_ITEMS = [
  "Surgical Mask",
  "N95 Respirator", 
  "Surgical Gloves",
  "Nitrile Gloves",
  "Face Shield",
  "Isolation Gown",
  "Surgical Drape",
  "Gauze Bandage",
  "Adhesive Bandage",
  "Alcohol Swabs",
];

// Common categories for autocomplete (fallback)
const COMMON_CATEGORIES = [
  "PPE",
  "Surgical Supplies",
  "Wound Care",
  "Diagnostic Equipment",
  "Disposables",
  "Sterilization",
];

const DRAFT_KEY = "inventory-form-draft";

interface InventoryEntryFormProps {
  onSuccess?: () => void;
}

export function InventoryEntryForm({ onSuccess }: InventoryEntryFormProps = {}) {
  const [formData, setFormData] = useState<InventoryFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [warnings, setWarnings] = useState<FormWarnings>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationInProgress, setValidationInProgress] = useState<Record<string, boolean>>({});
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);

  // Auto-save functionality with recovery
  const autoSave = useAutoSave({
    key: DRAFT_KEY,
    data: formData,
    enabled: true,
    interval: 60000, // Save every minute
    enableRecovery: true,
    maxVersions: 10,
    onRestore: (data) => {
      // Show recovery modal instead of simple confirm
      setRecoveryData(data);
      setShowRecoveryModal(true);
    },
    onError: (error) => {
      console.error("Auto-save error:", error);
    },
    onConflict: (localData, remoteData) => {
      // Simple conflict resolution: prefer local changes but show warning
      console.warn("Auto-save conflict detected. Local changes preserved.");
      return localData;
    },
  });

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (field: string, query: string): Promise<Suggestion[]> => {
    try {
      const response = await fetch(`/api/inventory/suggestions?field=${field}&query=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
    
    // Fallback to static suggestions
    if (field === "itemName") {
      return COMMON_ITEMS
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .map(item => ({ value: item, label: item }));
    } else if (field === "category") {
      return COMMON_CATEGORIES
        .filter(cat => cat.toLowerCase().includes(query.toLowerCase()))
        .map(cat => ({ value: cat, label: cat }));
    }
    
    return [];
  }, []);

  // Create field validators with context
  const createFieldValidator = useCallback((fieldName: string) => {
    return async (value: string): Promise<string | null> => {
      setValidationInProgress(prev => ({ ...prev, [fieldName]: true }));
      
      try {
        let validator;
        let context = {};
        
        switch (fieldName) {
          case "itemName":
            validator = itemNameValidator;
            break;
          case "batch":
            validator = batchValidator;
            break;
          case "quantity":
            validator = quantityValidator;
            break;
          case "reject":
            validator = rejectValidator;
            context = { quantity: formData.quantity };
            break;
          case "destination":
            validator = destinationValidator;
            break;
          case "category":
            validator = categoryValidator;
            break;
          case "notes":
            validator = notesValidator;
            break;
          default:
            return null;
        }
        
        const result: ValidationResult = await validator(value, context);
        
        // Handle warnings separately
        if (result.isValid && result.message && result.severity === "warning") {
          setWarnings(prev => ({ ...prev, [fieldName]: result.message }));
          setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        } else if (result.isValid && result.message && result.severity === "info") {
          setWarnings(prev => ({ ...prev, [fieldName]: result.message }));
          setErrors(prev => ({ ...prev, [fieldName]: undefined }));
        } else if (!result.isValid) {
          setErrors(prev => ({ ...prev, [fieldName]: result.message }));
          setWarnings(prev => ({ ...prev, [fieldName]: undefined }));
        } else {
          setErrors(prev => ({ ...prev, [fieldName]: undefined }));
          setWarnings(prev => ({ ...prev, [fieldName]: undefined }));
        }
        
        return result.isValid ? null : result.message || "Invalid value";
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return "Validation failed";
      } finally {
        setValidationInProgress(prev => ({ ...prev, [fieldName]: false }));
      }
    };
  }, [formData.quantity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save draft manually
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        autoSave.save();
      }

      // Ctrl+Enter or Cmd+Enter to submit form
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form");
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [autoSave]);

  // Calculate reject percentage
  const rejectPercentage = 
    formData.quantity && formData.reject && parseFloat(formData.quantity) > 0
      ? (parseFloat(formData.reject) / parseFloat(formData.quantity)) * 100
      : 0;

  // Get color for reject percentage
  const getRejectColor = (percentage: number) => {
    if (percentage === 0) return "text-success-600 dark:text-success-400";
    if (percentage < 5) return "text-warning-600 dark:text-warning-400";
    if (percentage < 15) return "text-orange-600 dark:text-orange-400";
    return "text-danger-600 dark:text-danger-400";
  };

  // Handle input change with real-time validation
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateField(name, value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [validateField]);

  // Validate entire form before submission
  const validateForm = async (): Promise<boolean> => {
    try {
      const result = await validateInventoryForm(formData);
      
      setErrors(result.errors);
      setWarnings(result.warnings);
      
      return result.isValid;
    } catch (error) {
      console.error("Form validation error:", error);
      setErrors({ itemName: "Validation failed. Please try again." });
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName: formData.itemName.trim(),
          batch: formData.batch.trim().toUpperCase(),
          quantity: parseInt(formData.quantity),
          reject: parseInt(formData.reject),
          destination: formData.destination,
          category: formData.category.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.details) {
          // Handle validation errors from API
          const apiErrors: FormErrors = {};
          result.error.details.forEach((err: any) => {
            apiErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(apiErrors);
        } else {
          alert(result.error?.message || "Failed to create inventory item");
        }
        return;
      }

      // Success - clear form, draft, and show success message
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setWarnings({});
      autoSave.clearSavedData();
      alert("Inventory item created successfully!");
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    if (autoSave.hasUnsavedChanges && !confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
      return;
    }
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setWarnings({});
    autoSave.clearSavedData();
  };

  // Handle recovery modal actions
  const handleRestoreData = (data: any) => {
    setFormData(data);
    setShowRecoveryModal(false);
    setRecoveryData(null);
  };

  const handleDiscardRecovery = () => {
    autoSave.clearSavedData();
    setShowRecoveryModal(false);
    setRecoveryData(null);
  };

  const handleCloseRecovery = () => {
    setShowRecoveryModal(false);
    setRecoveryData(null);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      aria-label="Inventory entry form"
      noValidate
    >
      {/* Keyboard Shortcuts Info - Hidden on mobile */}
      <div className="hidden md:block bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
        <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-secondary-600 dark:text-secondary-400">
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded text-xs font-mono">
              Ctrl+S
            </kbd>
            <span className="ml-2">Save draft</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded text-xs font-mono">
              Ctrl+Enter
            </kbd>
            <span className="ml-2">Submit form</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Item Name with Smart Suggestions */}
        <SmartFormField
          label="Item Name"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          error={errors.itemName}
          required
          maxLength={100}
          placeholder="e.g., Surgical Mask"
          suggestions={COMMON_ITEMS.map(item => ({ value: item, label: item }))}
          onSuggestionsFetch={(query) => fetchSuggestions("itemName", query)}
          showFrequency={true}
          disabled={validationInProgress.itemName}
        />

        {/* Batch Number with Real-time Validation */}
        <ValidatedInput
          label="Batch Number"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          error={errors.batch}
          validator={createFieldValidator("batch")}
          required
          maxLength={50}
          placeholder="e.g., BATCH123"
          helperText="Uppercase letters and numbers only"
          style={{ textTransform: "uppercase" }}
          validMessage="Batch number is available"
        />

        {/* Quantity with Real-time Validation */}
        <ValidatedInput
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          error={errors.quantity}
          validator={createFieldValidator("quantity")}
          required
          min="1"
          max="1000000"
          placeholder="e.g., 1000"
          validMessage="Valid quantity"
        />

        {/* Reject Quantity with Real-time Validation */}
        <div>
          <ValidatedInput
            label="Reject Quantity"
            name="reject"
            type="number"
            value={formData.reject}
            onChange={handleChange}
            error={errors.reject}
            validator={createFieldValidator("reject")}
            required
            min="0"
            placeholder="e.g., 10"
            validMessage="Valid reject quantity"
          />
          {warnings.reject && (
            <div className="mt-2 p-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
              <p className="text-sm text-warning-700 dark:text-warning-300 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {warnings.reject}
              </p>
            </div>
          )}
          {formData.quantity && formData.reject && (
            <p 
              role="status"
              aria-live="polite"
              className={cn("mt-2 text-sm font-medium", getRejectColor(rejectPercentage))}
            >
              Reject Rate: {rejectPercentage.toFixed(2)}%
            </p>
          )}
        </div>

        {/* Destination */}
        <div>
          <Select
            label="Destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            error={errors.destination}
            required
            disabled={validationInProgress.destination}
          >
            <option value="">Select destination</option>
            <option value="MAIS">MAIS</option>
            <option value="FOZAN">FOZAN</option>
          </Select>
          {formData.destination && !errors.destination && (
            <div className="mt-1 flex items-center text-sm text-success-600 dark:text-success-400">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Destination selected
            </div>
          )}
        </div>

        {/* Category with Smart Suggestions and Validation */}
        <div>
          <SmartFormField
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
            maxLength={50}
            placeholder="e.g., PPE (optional)"
            suggestions={COMMON_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            onSuggestionsFetch={(query) => fetchSuggestions("category", query)}
            showFrequency={true}
            disabled={validationInProgress.category}
          />
          {warnings.category && (
            <div className="mt-1 flex items-center text-sm text-info-600 dark:text-info-400">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {warnings.category}
            </div>
          )}
        </div>
      </div>

      {/* Notes with Real-time Validation */}
      <div>
        <Textarea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          error={errors.notes}
          maxLength={500}
          showCharCount
          rows={4}
          placeholder="Additional notes or comments (optional)"
          disabled={validationInProgress.notes}
        />
        {formData.notes && formData.notes.length > 0 && !errors.notes && (
          <div className="mt-1 flex items-center text-sm text-success-600 dark:text-success-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Notes added ({formData.notes.length}/500 characters)
          </div>
        )}
      </div>

      {/* Auto-save Status */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="min-h-[24px] flex items-center justify-center"
      >
        {autoSave.isSaving && (
          <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
            <svg
              className="animate-spin w-4 h-4 mr-2"
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
            Saving draft...
          </div>
        )}
        {autoSave.lastSaved && !autoSave.isSaving && (
          <div className="text-sm text-success-600 dark:text-success-400">
            <svg
              className="w-4 h-4 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Draft saved at {autoSave.lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 order-2 sm:order-1">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
            aria-label="Reset form to initial state"
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={autoSave.save}
            disabled={isSubmitting || !autoSave.hasUnsavedChanges}
            aria-label="Save draft manually"
            className="w-full sm:w-auto"
          >
            Save Draft
          </Button>
          
          {autoSave.hasRecoveryData && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRecoveryModal(true)}
              disabled={isSubmitting}
              aria-label="View recovery options"
              className="w-full sm:w-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recovery
            </Button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          aria-label="Submit inventory entry form"
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {isSubmitting ? "Saving..." : "Save Entry"}
        </Button>
      </div>

      {/* Data Recovery Modal */}
      <DataRecoveryModal
        isOpen={showRecoveryModal}
        onClose={handleCloseRecovery}
        onRestore={handleRestoreData}
        onDiscard={handleDiscardRecovery}
        currentData={formData}
        savedData={recoveryData ? {
          data: recoveryData,
          timestamp: new Date().toISOString(),
          version: "2.0",
          sessionId: "",
          checksum: "",
        } : null}
        versionHistory={autoSave.getVersionHistory()}
      />
    </form>
  );
}
