import { z } from "zod";
import { prisma } from "@/services/prisma";

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: "error" | "warning" | "info";
}

// Async validation function type
export type AsyncValidator = (value: string, context?: any) => Promise<ValidationResult>;
export type SyncValidator = (value: string, context?: any) => ValidationResult;
export type Validator = AsyncValidator | SyncValidator;

// Base validation schemas
const itemNameSchema = z
  .string()
  .min(2, "Item name must be at least 2 characters")
  .max(100, "Item name must not exceed 100 characters")
  .trim();

const batchSchema = z
  .string()
  .min(3, "Batch number must be at least 3 characters")
  .max(50, "Batch number must not exceed 50 characters")
  .regex(/^[A-Z0-9]+$/, "Batch number must contain only uppercase letters and numbers")
  .transform(val => val.toUpperCase());

const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .positive("Quantity must be positive")
  .max(1000000, "Quantity must not exceed 1,000,000");

const rejectSchema = z
  .number()
  .int("Reject quantity must be a whole number")
  .min(0, "Reject quantity cannot be negative");

const destinationSchema = z.enum(["MAIS", "FOZAN"], {
  errorMap: () => ({ message: "Please select a valid destination" }),
});

const categorySchema = z
  .string()
  .min(2, "Category must be at least 2 characters")
  .max(50, "Category must not exceed 50 characters")
  .trim()
  .optional();

const notesSchema = z
  .string()
  .max(500, "Notes must not exceed 500 characters")
  .optional();

// Sync validators
export const validateItemName: SyncValidator = (value: string): ValidationResult => {
  try {
    itemNameSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid item name",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid item name", severity: "error" };
  }
};

export const validateBatch: SyncValidator = (value: string): ValidationResult => {
  try {
    batchSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid batch number",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid batch number", severity: "error" };
  }
};

export const validateQuantity: SyncValidator = (value: string): ValidationResult => {
  try {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return { isValid: false, message: "Quantity must be a number", severity: "error" };
    }
    quantitySchema.parse(numValue);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid quantity",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid quantity", severity: "error" };
  }
};

export const validateReject: SyncValidator = (value: string, context?: { quantity?: string }): ValidationResult => {
  try {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return { isValid: false, message: "Reject quantity must be a number", severity: "error" };
    }
    
    rejectSchema.parse(numValue);
    
    // Additional validation against quantity
    if (context?.quantity) {
      const quantityNum = parseInt(context.quantity);
      if (!isNaN(quantityNum) && numValue > quantityNum) {
        return {
          isValid: false,
          message: "Reject quantity cannot exceed total quantity",
          severity: "error",
        };
      }
      
      // Warning for high reject rate
      if (!isNaN(quantityNum) && quantityNum > 0) {
        const rejectRate = (numValue / quantityNum) * 100;
        if (rejectRate > 15) {
          return {
            isValid: true,
            message: `High reject rate: ${rejectRate.toFixed(1)}%`,
            severity: "warning",
          };
        } else if (rejectRate > 5) {
          return {
            isValid: true,
            message: `Moderate reject rate: ${rejectRate.toFixed(1)}%`,
            severity: "info",
          };
        }
      }
    }
    
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid reject quantity",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid reject quantity", severity: "error" };
  }
};

export const validateDestination: SyncValidator = (value: string): ValidationResult => {
  try {
    destinationSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid destination",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid destination", severity: "error" };
  }
};

export const validateCategory: SyncValidator = (value: string): ValidationResult => {
  if (!value || value.trim() === "") {
    return { isValid: true }; // Category is optional
  }
  
  try {
    categorySchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid category",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid category", severity: "error" };
  }
};

export const validateNotes: SyncValidator = (value: string): ValidationResult => {
  try {
    notesSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || "Invalid notes",
        severity: "error",
      };
    }
    return { isValid: false, message: "Invalid notes", severity: "error" };
  }
};

// Async validators
export const validateBatchUniqueness: AsyncValidator = async (value: string): Promise<ValidationResult> => {
  if (!value || value.trim().length < 3) {
    return { isValid: true }; // Skip if too short
  }

  try {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        batch: value.toUpperCase(),
      },
      select: {
        id: true,
        itemName: true,
        createdAt: true,
      },
    });

    if (existing) {
      return {
        isValid: false,
        message: `Batch "${value}" already exists for "${existing.itemName}" (${existing.createdAt.toLocaleDateString()})`,
        severity: "error",
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking batch uniqueness:", error);
    return {
      isValid: true, // Don't block on validation error
      message: "Could not verify batch uniqueness",
      severity: "warning",
    };
  }
};

export const validateItemNameSimilarity: AsyncValidator = async (value: string): Promise<ValidationResult> => {
  if (!value || value.trim().length < 3) {
    return { isValid: true };
  }

  try {
    // Check for very similar item names (potential duplicates)
    const similar = await prisma.inventoryItem.findMany({
      where: {
        itemName: {
          contains: value.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        itemName: true,
        batch: true,
        createdAt: true,
      },
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (similar.length > 0) {
      const exactMatch = similar.find(item => 
        item.itemName.toLowerCase() === value.trim().toLowerCase()
      );

      if (exactMatch) {
        return {
          isValid: true,
          message: `Similar item exists: "${exactMatch.itemName}" (${exactMatch.batch})`,
          severity: "info",
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking item name similarity:", error);
    return { isValid: true };
  }
};

// Composite validation function
export const validateInventoryForm = async (data: any): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}> => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Sync validations
  const itemNameResult = validateItemName(data.itemName || "");
  const batchResult = validateBatch(data.batch || "");
  const quantityResult = validateQuantity(data.quantity || "");
  const rejectResult = validateReject(data.reject || "", { quantity: data.quantity });
  const destinationResult = validateDestination(data.destination || "");
  const categoryResult = validateCategory(data.category || "");
  const notesResult = validateNotes(data.notes || "");

  // Collect sync validation errors
  if (!itemNameResult.isValid) errors.itemName = itemNameResult.message!;
  if (!batchResult.isValid) errors.batch = batchResult.message!;
  if (!quantityResult.isValid) errors.quantity = quantityResult.message!;
  if (!rejectResult.isValid) errors.reject = rejectResult.message!;
  if (!destinationResult.isValid) errors.destination = destinationResult.message!;
  if (!categoryResult.isValid) errors.category = categoryResult.message!;
  if (!notesResult.isValid) errors.notes = notesResult.message!;

  // Collect warnings
  if (rejectResult.isValid && rejectResult.severity === "warning") {
    warnings.reject = rejectResult.message!;
  }

  // Async validations (only if sync validations pass)
  if (!errors.batch && data.batch) {
    const batchUniquenessResult = await validateBatchUniqueness(data.batch);
    if (!batchUniquenessResult.isValid) {
      errors.batch = batchUniquenessResult.message!;
    }
  }

  if (!errors.itemName && data.itemName) {
    const similarityResult = await validateItemNameSimilarity(data.itemName);
    if (similarityResult.isValid && similarityResult.message && similarityResult.severity === "info") {
      warnings.itemName = similarityResult.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

// Validation utilities
export const createValidator = (syncValidator: SyncValidator, asyncValidator?: AsyncValidator): Validator => {
  return async (value: string, context?: any) => {
    // First run sync validation
    const syncResult = syncValidator(value, context);
    if (!syncResult.isValid) {
      return syncResult;
    }

    // Then run async validation if provided
    if (asyncValidator) {
      const asyncResult = await asyncValidator(value, context);
      if (!asyncResult.isValid) {
        return asyncResult;
      }
      
      // Merge messages if both have info/warnings
      if (syncResult.message && asyncResult.message) {
        return {
          isValid: true,
          message: `${syncResult.message}; ${asyncResult.message}`,
          severity: syncResult.severity || asyncResult.severity,
        };
      }
      
      return asyncResult.message ? asyncResult : syncResult;
    }

    return syncResult;
  };
};

// Pre-configured validators for form fields
export const itemNameValidator = createValidator(validateItemName, validateItemNameSimilarity);
export const batchValidator = createValidator(validateBatch, validateBatchUniqueness);
export const quantityValidator = createValidator(validateQuantity);
export const rejectValidator = createValidator(validateReject);
export const destinationValidator = createValidator(validateDestination);
export const categoryValidator = createValidator(validateCategory);
export const notesValidator = createValidator(validateNotes);