"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
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

const INITIAL_FORM_DATA: InventoryFormData = {
  itemName: "",
  batch: "",
  quantity: "",
  reject: "",
  destination: "",
  category: "",
  notes: "",
};

// Common item names for autocomplete
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

// Common categories for autocomplete
const COMMON_CATEGORIES = [
  "PPE",
  "Surgical Supplies",
  "Wound Care",
  "Diagnostic Equipment",
  "Disposables",
  "Sterilization",
];

const DRAFT_KEY = "inventory-form-draft";

export function InventoryEntryForm() {
  const [formData, setFormData] = useState<InventoryFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDraftIndicator, setShowDraftIndicator] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (confirm("A draft was found. Would you like to restore it?")) {
          setFormData(draft.data);
          setIsDirty(true);
          setLastSaved(new Date(draft.timestamp));
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Auto-save to localStorage every 2 seconds
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString(),
          })
        );
        setLastSaved(new Date());
        setShowDraftIndicator(true);
        
        // Hide indicator after 2 seconds
        setTimeout(() => setShowDraftIndicator(false), 2000);
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, isDirty]);

  // Warn user about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save draft manually
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) {
          try {
            localStorage.setItem(
              DRAFT_KEY,
              JSON.stringify({
                data: formData,
                timestamp: new Date().toISOString(),
              })
            );
            setLastSaved(new Date());
            setShowDraftIndicator(true);
            setTimeout(() => setShowDraftIndicator(false), 2000);
          } catch (error) {
            console.error("Error saving draft:", error);
          }
        }
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
  }, [formData, isDirty]);

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

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Handle autocomplete for item name
    if (name === "itemName" && value.length > 0) {
      const filtered = COMMON_ITEMS.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setItemSuggestions(filtered);
      setShowItemSuggestions(filtered.length > 0);
    } else if (name === "itemName") {
      setShowItemSuggestions(false);
    }

    // Handle autocomplete for category
    if (name === "category" && value.length > 0) {
      const filtered = COMMON_CATEGORIES.filter((cat) =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setCategorySuggestions(filtered);
      setShowCategorySuggestions(filtered.length > 0);
    } else if (name === "category") {
      setShowCategorySuggestions(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Item name validation
    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required";
    } else if (formData.itemName.trim().length < 2) {
      newErrors.itemName = "Item name must be at least 2 characters";
    } else if (formData.itemName.trim().length > 100) {
      newErrors.itemName = "Item name must not exceed 100 characters";
    }

    // Batch validation
    if (!formData.batch.trim()) {
      newErrors.batch = "Batch number is required";
    } else if (formData.batch.trim().length < 3) {
      newErrors.batch = "Batch number must be at least 3 characters";
    } else if (formData.batch.trim().length > 50) {
      newErrors.batch = "Batch number must not exceed 50 characters";
    } else if (!/^[A-Z0-9]+$/.test(formData.batch.trim())) {
      newErrors.batch = "Batch number must contain only uppercase letters and numbers";
    }

    // Quantity validation
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else {
      const qty = parseFloat(formData.quantity);
      if (isNaN(qty) || !Number.isInteger(qty)) {
        newErrors.quantity = "Quantity must be a whole number";
      } else if (qty <= 0) {
        newErrors.quantity = "Quantity must be positive";
      } else if (qty > 1000000) {
        newErrors.quantity = "Quantity must not exceed 1,000,000";
      }
    }

    // Reject validation
    if (!formData.reject) {
      newErrors.reject = "Reject quantity is required";
    } else {
      const rej = parseFloat(formData.reject);
      if (isNaN(rej) || !Number.isInteger(rej)) {
        newErrors.reject = "Reject quantity must be a whole number";
      } else if (rej < 0) {
        newErrors.reject = "Reject quantity cannot be negative";
      } else if (formData.quantity && rej > parseFloat(formData.quantity)) {
        newErrors.reject = "Reject quantity cannot exceed total quantity";
      }
    }

    // Destination validation
    if (!formData.destination) {
      newErrors.destination = "Destination is required";
    }

    // Category validation (optional)
    if (formData.category && formData.category.trim().length > 0) {
      if (formData.category.trim().length < 2) {
        newErrors.category = "Category must be at least 2 characters";
      } else if (formData.category.trim().length > 50) {
        newErrors.category = "Category must not exceed 50 characters";
      }
    }

    // Notes validation (optional)
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Notes must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
      setIsDirty(false);
      setErrors({});
      setLastSaved(null);
      localStorage.removeItem(DRAFT_KEY);
      alert("Inventory item created successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle suggestion selection
  const selectItemSuggestion = (item: string) => {
    setFormData((prev) => ({ ...prev, itemName: item }));
    setShowItemSuggestions(false);
    setIsDirty(true);
  };

  const selectCategorySuggestion = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setShowCategorySuggestions(false);
    setIsDirty(true);
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
        {/* Item Name with Autocomplete */}
        <div className="relative">
          <Input
            label="Item Name"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            error={errors.itemName}
            required
            maxLength={100}
            placeholder="e.g., Surgical Mask"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={showItemSuggestions ? "item-suggestions" : undefined}
            aria-expanded={showItemSuggestions}
          />
          {showItemSuggestions && (
            <div 
              id="item-suggestions"
              role="listbox"
              aria-label="Item name suggestions"
              className="absolute z-10 w-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {itemSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={formData.itemName === item}
                  onClick={() => selectItemSuggestion(item)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
            {formData.itemName.length}/100 characters
          </p>
        </div>

        {/* Batch Number */}
        <Input
          label="Batch Number"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          error={errors.batch}
          required
          maxLength={50}
          placeholder="e.g., BATCH123"
          helperText="Uppercase letters and numbers only"
          style={{ textTransform: "uppercase" }}
        />

        {/* Quantity */}
        <Input
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          error={errors.quantity}
          required
          min="1"
          max="1000000"
          placeholder="e.g., 1000"
        />

        {/* Reject Quantity */}
        <div>
          <Input
            label="Reject Quantity"
            name="reject"
            type="number"
            value={formData.reject}
            onChange={handleChange}
            error={errors.reject}
            required
            min="0"
            placeholder="e.g., 10"
            aria-describedby={formData.quantity && formData.reject ? "reject-rate" : undefined}
          />
          {formData.quantity && formData.reject && (
            <p 
              id="reject-rate"
              role="status"
              aria-live="polite"
              className={cn("mt-2 text-sm font-medium", getRejectColor(rejectPercentage))}
            >
              Reject Rate: {rejectPercentage.toFixed(2)}%
            </p>
          )}
        </div>

        {/* Destination */}
        <Select
          label="Destination"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          error={errors.destination}
          required
        >
          <option value="">Select destination</option>
          <option value="MAIS">MAIS</option>
          <option value="FOZAN">FOZAN</option>
        </Select>

        {/* Category with Autocomplete */}
        <div className="relative">
          <Input
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
            maxLength={50}
            placeholder="e.g., PPE (optional)"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={showCategorySuggestions ? "category-suggestions" : undefined}
            aria-expanded={showCategorySuggestions}
          />
          {showCategorySuggestions && (
            <div 
              id="category-suggestions"
              role="listbox"
              aria-label="Category suggestions"
              className="absolute z-10 w-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {categorySuggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="option"
                  aria-selected={formData.category === category}
                  onClick={() => selectCategorySuggestion(category)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
            {formData.category.length}/50 characters
          </p>
        </div>
      </div>

      {/* Notes */}
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
      />

      {/* Draft Indicator - ARIA live region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="min-h-[24px]"
      >
        {showDraftIndicator && (
          <div className="flex items-center justify-center text-sm text-success-600 dark:text-success-400">
            <svg
              className="w-4 h-4 mr-2"
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
            Draft saved
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 order-2 sm:order-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isDirty && !confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
                return;
              }
              setFormData(INITIAL_FORM_DATA);
              setErrors({});
              setIsDirty(false);
              setLastSaved(null);
              localStorage.removeItem(DRAFT_KEY);
            }}
            disabled={isSubmitting}
            aria-label="Reset form to initial state"
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          
          {lastSaved && (
            <span 
              className="text-xs text-center sm:text-left text-secondary-500 dark:text-secondary-400"
              role="status"
              aria-live="polite"
            >
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
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
    </form>
  );
}
