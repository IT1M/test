import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { withSecurity } from "@/middleware/security";
import { validateInventoryForm } from "@/services/validation";

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

// Bulk import handler
async function postHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - DATA_ENTRY role or higher
    const allowedRoles = ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse request body
    const { data } = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No data provided for import" } },
        { status: 400 }
      );
    }

    // Limit batch size
    if (data.length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Maximum 1000 rows allowed per import" } },
        { status: 400 }
      );
    }

    const result = await processBulkImport(data, session.user.id, request);

    return NextResponse.json({
      success: result.success,
      ...result,
    });
  } catch (error) {
    console.error("Error processing bulk import:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while processing the import",
        },
      },
      { status: 500 }
    );
  }
}

// Process bulk import with validation and error handling
async function processBulkImport(
  data: any[],
  userId: string,
  request: NextRequest
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const successfulItems: any[] = [];
  let processedRows = 0;

  // Get client info for audit logging
  const { ipAddress, userAgent } = getClientInfo(request);

  // Process each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;
    processedRows++;

    try {
      // Validate the row data
      const validationResult = await validateInventoryForm(row);
      
      if (!validationResult.isValid) {
        // Add validation errors
        Object.entries(validationResult.errors).forEach(([field, message]) => {
          errors.push({
            row: rowNumber,
            field,
            message,
            value: row[field],
          });
        });
        continue;
      }

      // Check for duplicate batch number
      const existingItem = await prisma.inventoryItem.findFirst({
        where: {
          batch: row.batch.toUpperCase(),
        },
      });

      if (existingItem) {
        errors.push({
          row: rowNumber,
          field: "batch",
          message: `Batch number already exists`,
          value: row.batch,
        });
        continue;
      }

      // Create the inventory item
      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          itemName: row.itemName.trim(),
          batch: row.batch.trim().toUpperCase(),
          quantity: parseInt(row.quantity),
          reject: parseInt(row.reject || 0),
          destination: row.destination.toUpperCase(),
          category: row.category?.trim() || null,
          notes: row.notes?.trim() || null,
          enteredById: userId,
        },
      });

      successfulItems.push(inventoryItem);

      // Create audit log for successful import
      await createAuditLog({
        userId,
        action: "CREATE",
        entityType: "InventoryItem",
        entityId: inventoryItem.id,
        newValue: inventoryItem,
        ipAddress,
        userAgent,
        metadata: {
          importType: "bulk",
          rowNumber,
        },
      });

    } catch (error) {
      console.error(`Error processing row ${rowNumber}:`, error);
      errors.push({
        row: rowNumber,
        field: "general",
        message: "Failed to create inventory item",
        value: null,
      });
    }
  }

  // Create audit log for the bulk import operation
  await createAuditLog({
    userId,
    action: "CREATE",
    entityType: "BulkImport",
    entityId: null,
    newValue: {
      totalRows: processedRows,
      successfulRows: successfulItems.length,
      errorCount: errors.length,
    },
    ipAddress,
    userAgent,
  });

  // Trigger notifications for high reject rates
  try {
    const { checkHighRejectRate } = await import("@/utils/notifications");
    for (const item of successfulItems) {
      if (item.reject > 0) {
        await checkHighRejectRate(item).catch(console.error);
      }
    }
  } catch (error) {
    console.error("Error checking reject rates:", error);
  }

  // Trigger real-time updates
  try {
    const { triggerInventoryUpdate } = await import("@/app/api/realtime/events/route");
    for (const item of successfulItems) {
      await triggerInventoryUpdate(item).catch(console.error);
    }
  } catch (error) {
    console.error("Error triggering real-time updates:", error);
  }

  return {
    success: errors.length === 0,
    totalRows: processedRows,
    successfulRows: successfulItems.length,
    errors,
    data: successfulItems,
  };
}

// Export secured handler
export const POST = withSecurity(postHandler);