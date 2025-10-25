import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { BackupType } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Helper function to generate CSV content
function generateCSV(items: any[]): string {
  if (items.length === 0) return "";

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

// This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
// It should be protected by a secret token in production
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid authorization" } },
        { status: 401 }
      );
    }

    // Get backup configuration from system settings or use defaults
    let backupConfig = {
      fileType: "JSON" as BackupType,
      enabled: true,
    };

    try {
      const settings = await prisma.systemSettings.findUnique({
        where: { key: "backup_config" },
      });

      if (settings && settings.value) {
        backupConfig = { ...backupConfig, ...(settings.value as any) };
      }
    } catch (error) {
      console.log("No backup config found, using defaults");
    }

    // Check if automated backups are enabled
    if (!backupConfig.enabled) {
      return NextResponse.json({
        success: true,
        message: "Automated backups are disabled",
      });
    }

    // Get admin user for backup creation (use first admin found)
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    });

    if (!adminUser) {
      console.error("No active admin user found for automated backup");
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_ADMIN", message: "No active admin user found" },
        },
        { status: 500 }
      );
    }

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

    // Generate backup content
    let content: string;
    let fileExtension: string;

    switch (backupConfig.fileType) {
      case "CSV":
        content = generateCSV(items);
        fileExtension = "csv";
        break;
      case "JSON":
        content = generateJSON(items);
        fileExtension = "json";
        break;
      default:
        content = generateJSON(items);
        fileExtension = "json";
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-auto-${timestamp}.${fileExtension}`;

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
        fileType: backupConfig.fileType,
        recordCount,
        storagePath: `/backups/${fileName}`,
        status: "COMPLETED",
        createdById: adminUser.id,
      },
    });

    // Clean up old backups based on retention policy
    await cleanupOldBackups();

    console.log(`Automated backup created: ${fileName} with ${recordCount} records`);

    return NextResponse.json({
      success: true,
      data: {
        backupId: backup.id,
        fileName: backup.fileName,
        recordCount: backup.recordCount,
        fileSize: backup.fileSize,
      },
      message: "Automated backup completed successfully",
    });
  } catch (error) {
    console.error("Error creating automated backup:", error);

    // Try to create a failed backup record
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
      });

      if (adminUser) {
        await prisma.backup.create({
          data: {
            fileName: `backup-failed-${new Date().toISOString()}.json`,
            fileSize: 0,
            fileType: "JSON",
            recordCount: 0,
            storagePath: "",
            status: "FAILED",
            createdById: adminUser.id,
          },
        });
      }
    } catch (dbError) {
      console.error("Failed to create failed backup record:", dbError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKUP_FAILED",
          message: "Automated backup failed",
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to clean up old backups based on retention policy
async function cleanupOldBackups() {
  try {
    const now = new Date();

    // Retention policy:
    // - Keep daily backups for 30 days
    // - Keep weekly backups for 12 weeks (84 days)
    // - Keep monthly backups for 12 months (365 days)

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get all backups older than 30 days
    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Determine which backups to keep
    const backupsToDelete: string[] = [];

    oldBackups.forEach((backup) => {
      const backupDate = new Date(backup.createdAt);
      const dayOfWeek = backupDate.getDay();
      const dayOfMonth = backupDate.getDate();

      // Keep if it's a Sunday (weekly backup) and within 12 weeks
      if (dayOfWeek === 0 && backupDate >= twelveWeeksAgo) {
        return;
      }

      // Keep if it's the first of the month (monthly backup) and within 12 months
      if (dayOfMonth === 1 && backupDate >= twelveMonthsAgo) {
        return;
      }

      // Otherwise, mark for deletion
      backupsToDelete.push(backup.id);
    });

    // Delete old backups
    if (backupsToDelete.length > 0) {
      await prisma.backup.deleteMany({
        where: {
          id: {
            in: backupsToDelete,
          },
        },
      });

      console.log(`Cleaned up ${backupsToDelete.length} old backups`);
    }
  } catch (error) {
    console.error("Error cleaning up old backups:", error);
    // Don't throw - cleanup failure shouldn't fail the backup
  }
}
