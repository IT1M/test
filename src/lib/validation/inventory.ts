import { z } from "zod";

// Base validation schema for inventory items
export const InventoryItemSchema = z.object({
  itemName: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(100, "Item name must not exceed 100 characters")
    .trim()
    .refine(
      (val) => val.length > 0,
      "Item name is required"
    ),
  
  batch: z
    .string()
    .min(3, "Batch number must be at least 3 characters")
    .max(50, "Batch number must not exceed 50 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Batch number must contain only uppercase letters and numbers"
    )
    .transform((val) => val.toUpperCase()),
  
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .int("Quantity must be a whole number")
    .positive("Quantity must be positive")
    .max(1000000, "Quantity must not exceed 1,000,000"),
  
  reject: z
    .number({
      required_error: "Reject quantity is required",
      invalid_type_error: "Reject quantity must be a number",
    })
    .int("Reject quantity must be a whole number")
    .min(0, "Reject quantity cannot be negative"),
  
  destination: z.enum(["MAIS", "FOZAN"], {
    required_error: "Destination is required",
    invalid_type_error: "Destination must be either MAIS or FOZAN",
  }),
  
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => data.reject <= data.quantity,
  {
    message: "Reject quantity cannot exceed total quantity",
    path: ["reject"],
  }
);

// Schema for string inputs (before conversion to numbers)
export const InventoryItemInputSchema = z.object({
  itemName: z.string().trim(),
  batch: z.string().trim(),
  quantity: z.string().trim(),
  reject: z.string().trim(),
  destination: z.string(),
  category: z.string().trim().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// Individual field validation functions
export const validateItemName = (value: string): string | null => {
  try {
    InventoryItemSchema.shape.itemName.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid item name";
    }
    return "Invalid item name";
  }
};

export const validateBatch = (value: string): string | null => {
  try {
    InventoryItemSchema.shape.batch.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid batch number";
    }
    return "Invalid batch number";
  }
};

export const validateQuantity = (value: string): string | null => {
  try {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return "Quantity must be a number";
    }
    InventoryItemSchema.shape.quantity.parse(numValue);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid quantity";
    }
    return "Invalid quantity";
  }
};

export const validateReject = (value: string, quantity?: string): string | null => {
  try {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return "Reject quantity must be a number";
    }
    
    InventoryItemSchema.shape.reject.parse(numValue);
    
    // Additional validation against quantity
    if (quantity) {
      const quantityNum = parseInt(quantity);
      if (!isNaN(quantityNum) && numValue > quantityNum) {
        return "Reject quantity cannot exceed total quantity";
      }
    }
    
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid reject quantity";
    }
    return "Invalid reject quantity";
  }
};

export const validateDestination = (value: string): string | null => {
  try {
    InventoryItemSchema.shape.destination.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid destination";
    }
    return "Invalid destination";
  }
};

export const validateCategory = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return null; // Category is optional
  }
  
  try {
    InventoryItemSchema.shape.category.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid category";
    }
    return "Invalid category";
  }
};

export const validateNotes = (value: string): string | null => {
  try {
    InventoryItemSchema.shape.notes.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid notes";
    }
    return "Invalid notes";
  }
};

// Validate entire form
export const validateInventoryForm = (data: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Convert string inputs to appropriate types
  const processedData = {
    ...data,
    quantity: data.quantity ? parseInt(data.quantity) : undefined,
    reject: data.reject ? parseInt(data.reject) : undefined,
  };
  
  try {
    InventoryItemSchema.parse(processedData);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};

// Check for duplicate batch numbers
export const validateBatchUniqueness = async (batch: string): Promise<string | null> => {
  try {
    const { prisma } = await import("@/services/prisma");
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        batch: batch.toUpperCase(),
      },
      select: {
        id: true,
        itemName: true,
        createdAt: true,
      },
    });
    
    if (existing) {
      return `Batch number "${batch}" already exists for "${existing.itemName}" (created ${existing.createdAt.toLocaleDateString()})`;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking batch uniqueness:", error);
    return null; // Don't block form submission on validation error
  }
};

export type InventoryItemInput = z.infer<typeof InventoryItemInputSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;