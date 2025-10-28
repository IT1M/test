import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";

// Validation schema for restore
const RestoreSchema = z.object({
  backupData: z.string().min(1, "Backup data is required"),
  fileType: z.enum(["CSV", "JSON"], { message: "File type must be CSV or JSON" }),
  preview: z.boolean().optional(),
});

interface InventoryItemData {
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
  destination: "MAIS" | "FOZAN";
  category?: string | null;
  notes?: string | null;
  enteredById: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to parse CSV
function parseCSV(csvContent: string): InventoryItemData[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("Invalid CSV format: No data rows found");
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const items: InventoryItemData[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted values)
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Add last value

    if (values.length < 8) {
      console.warn(`Skipping invalid CSV row ${i + 2}: insufficient columns`);
      continue;
    }

    try {
      items.push({
        itemName: values[1].replace(/^"|"$/g, ""),
        batch: values[2],
        quantity: parseInt(values[3]),
        reject: parseInt(values[4]),
        destination: values[5] as "MAIS" | "FOZAN",
        category: values[6] || null,
        notes: values[7] ? values[7].replace(/^"|"$/g, "") : null,
        enteredById: "", // Will be set to current user
      });
    } catch (error) {
      console.warn(`Skipping invalid CSV row ${i + 2}:`, error);
    }
  }

  return items;
}

// Helper function to parse JSON
function parseJSON(jsonContent: string): InventoryItemData[] {
  const backup = JSON.parse(jsonContent);

  if (!backup.data || !Array.isArray(backup.data)) {
    throw new Error("Invalid JSON format: 'data' array not found");
  }

  return backup.data.map((item: any) => ({
    itemName: item.itemName,
    batch: item.batch,
    quantity: item.quantity,
    reject: item.reject,
    destination: item.destination,
    category: item.category || null,
    notes: item.notes || null,
    enteredById: "", // Will be set to current user
  }));
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - ADMIN only
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Only administrators can restore backups" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = RestoreSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    const { backupData, fileType, preview = false } = validationResult.data;

    // Parse backup data based on file type
    let items: InventoryItemData[];

    try {
      if (fileType === "CSV") {
        items = parseCSV(backupData);
      } else {
        items = parseJSON(backupData);
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message: error.message || "Failed to parse backup data",
          },
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_BACKUP",
            message: "No valid items found in backup data",
          },
        },
        { status: 400 }
      );
    }

    // If preview mode, return parsed data without restoring
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          itemCount: items.length,
          preview: items.slice(0, 10), // Return first 10 items for preview
          summary: {
            totalItems: items.length,
            destinations: {
              MAIS: items.filter((i) => i.destination === "MAIS").length,
              FOZAN: items.filter((i) => i.destination === "FOZAN").length,
            },
            totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
            totalReject: items.reduce((sum, i) => sum + i.reject, 0),
          },
        },
        message: "Preview generated successfully",
      });
    }

    // Perform restore in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current inventory count for comparison
      const currentCount = await tx.inventoryItem.count();

      // Delete all existing inventory items
      await tx.inventoryItem.deleteMany({});

      // Set enteredById to current user for all items
      const itemsToCreate = items.map((item) => ({
        ...item,
        enteredById: session.user.id,
      }));

      // Create new inventory items
      await tx.inventoryItem.createMany({
        data: itemsToCreate,
      });

      return {
        previousCount: currentCount,
        restoredCount: items.length,
      };
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "BackupRestore",
      newValue: {
        fileType,
        previousCount: result.previousCount,
        restoredCount: result.restoredCount,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully restored ${result.restoredCount} items (replaced ${result.previousCount} existing items)`,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while restoring the backup",
        },
      },
      { status: 500 }
    );
  }
}
