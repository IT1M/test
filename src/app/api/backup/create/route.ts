import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";
import { BackupType } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Validation schema for backup creation
const BackupSchema = z.object({
  fileType: z.enum(["CSV", "JSON", "SQL"], { message: "File type must be CSV, JSON, or SQL" }),
});

// Helper function to generate CSV content
function generateCSV(items: any[]): string {
  if (items.length === 0) return "";

  // CSV headers
  const headers = [
    "ID",
    "Item Name",
    "Batch",
    "Quantity",
    "Reject",
    "Destination",
    "Category",
    "Notes",
    "Entered By",
    "Created At",
    "Updated At",
  ];

  // CSV rows
  const rows = items.map((item) => [
    item.id,
    `"${item.itemName.replace(/"/g, '""')}"`,
    item.batch,
    item.quantity,
    item.reject,
    item.destination,
    item.category || "",
    item.notes ? `"${item.notes.replace(/"/g, '""')}"` : "",
    item.enteredBy.name,
    item.createdAt.toISOString(),
    item.updatedAt.toISOString(),
  ]);

  // Add UTF-8 BOM for Excel compatibility
  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// Helper function to generate JSON content
function generateJSON(items: any[]): string {
  const backup = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    recordCount: items.length,
    data: items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      batch: item.batch,
      quantity: item.quantity,
      reject: item.reject,
      destination: item.destination,
      category: item.category,
      notes: item.notes,
      enteredBy: {
        id: item.enteredBy.id,
        name: item.enteredBy.name,
        email: item.enteredBy.email,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };

  return JSON.stringify(backup, null, 2);
}

// Helper function to generate SQL content
function generateSQL(items: any[]): string {
  if (items.length === 0) return "";

  const sqlStatements: string[] = [
    "-- Saudi Mais Inventory System Backup",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Record Count: ${items.length}`,
    "",
    "BEGIN TRANSACTION;",
    "",
  ];

  items.forEach((item) => {
    const values = [
      `'${item.id}'`,
      `'${item.itemName.replace(/'/g, "''")}'`,
      `'${item.batch}'`,
      item.quantity,
      item.reject,
      `'${item.destination}'`,
      item.category ? `'${item.category.replace(/'/g, "''")}'` : "NULL",
      item.notes ? `'${item.notes.replace(/'/g, "''")}'` : "NULL",
      `'${item.enteredById}'`,
      `'${item.createdAt.toISOString()}'`,
      `'${item.updatedAt.toISOString()}'`,
    ];

    sqlStatements.push(
      `INSERT INTO "InventoryItem" ("id", "itemName", "batch", "quantity", "reject", "destination", "category", "notes", "enteredById", "createdAt", "updatedAt") VALUES (${values.join(", ")});`
    );
  });

  sqlStatements.push("", "COMMIT;");

  return sqlStatements.join("\n");
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

    // Check authorization - ADMIN or MANAGER only
    const allowedRoles = ["ADMIN", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = BackupSchema.safeParse(body);

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

    const { fileType } = validationResult.data;

    // Fetch all inventory items
    const items = await prisma.inventoryItem.findMany({
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const recordCount = items.length;

    // Generate backup content based on file type
    let content: string;
    let fileExtension: string;

    switch (fileType) {
      case "CSV":
        content = generateCSV(items);
        fileExtension = "csv";
        break;
      case "JSON":
        content = generateJSON(items);
        fileExtension = "json";
        break;
      case "SQL":
        content = generateSQL(items);
        fileExtension = "sql";
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: "INVALID_TYPE", message: "Invalid file type" } },
          { status: 400 }
        );
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.${fileExtension}`;

    // Ensure backup directory exists
    const backupDir = join(process.cwd(), "public", "backups");
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    // Write backup file
    const filePath = join(backupDir, fileName);
    await writeFile(filePath, content, "utf-8");

    // Get file size
    const fileSize = Buffer.byteLength(content, "utf-8");

    // Create backup record in database
    const backup = await prisma.backup.create({
      data: {
        fileName,
        fileSize,
        fileType: fileType as BackupType,
        recordCount,
        storagePath: `/backups/${fileName}`,
        status: "COMPLETED",
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Backup",
      entityId: backup.id,
      newValue: {
        fileName: backup.fileName,
        fileType: backup.fileType,
        recordCount: backup.recordCount,
      },
      ipAddress,
      userAgent,
    });

    // Send notification to admins about backup completion
    const { notifyBackupStatus } = await import("@/utils/notifications");
    await notifyBackupStatus("success", backup.id, backup.fileName).catch((error) => {
      console.error("Error sending backup notification:", error);
      // Don't fail the request if notification fails
    });

    return NextResponse.json(
      {
        success: true,
        data: backup,
        message: `Backup created successfully with ${recordCount} records`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating backup:", error);

    // Try to send failure notification
    try {
      const { notifyBackupStatus } = await import("@/utils/notifications");
      await notifyBackupStatus("failure", "", "backup", error instanceof Error ? error.message : "Unknown error");
    } catch (notifError) {
      console.error("Error sending backup failure notification:", notifError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while creating the backup",
        },
      },
      { status: 500 }
    );
  }
}
