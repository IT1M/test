import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { advancedBackupService } from "@/services/advancedBackup";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";
import { BackupType } from "@prisma/client";

// Validation schema for advanced backup creation
const AdvancedBackupSchema = z.object({
  type: z.enum(["full", "incremental"], { message: "Type must be 'full' or 'incremental'" }),
  fileType: z.enum(["CSV", "JSON", "SQL"], { message: "File type must be CSV, JSON, or SQL" }),
  options: z.object({
    encryption: z.boolean().optional(),
    compression: z.boolean().optional(),
    testing: z.boolean().optional(),
  }).optional(),
});

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
    const validationResult = AdvancedBackupSchema.safeParse(body);

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

    const { type, fileType, options } = validationResult.data;

    let backupMetadata;

    // Create backup based on type
    if (type === "full") {
      backupMetadata = await advancedBackupService.createFullBackup(
        session.user.id,
        fileType as BackupType
      );
    } else {
      backupMetadata = await advancedBackupService.createIncrementalBackup(
        session.user.id,
        fileType as BackupType
      );
    }

    // Test backup if requested
    let testResults;
    if (options?.testing) {
      testResults = await advancedBackupService.testBackup(backupMetadata.id);
    }

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "AdvancedBackup",
      entityId: backupMetadata.id,
      newValue: {
        type: backupMetadata.type,
        fileType,
        recordCount: backupMetadata.recordCount,
        encrypted: backupMetadata.encrypted,
        compressed: backupMetadata.compressed,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          backup: backupMetadata,
          testResults,
        },
        message: `${type === 'full' ? 'Full' : 'Incremental'} backup created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating advanced backup:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred while creating the backup",
        },
      },
      { status: 500 }
    );
  }
}

// GET handler for advanced backup configuration
export async function GET(request: NextRequest) {
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

    // Get backup configuration and statistics
    const stats = {
      totalBackups: 0,
      fullBackups: 0,
      incrementalBackups: 0,
      totalSize: 0,
      lastBackup: null,
      nextScheduled: null,
    };

    // This would fetch actual statistics from the database
    // For now, return basic configuration info

    return NextResponse.json({
      success: true,
      data: {
        configuration: {
          enabled: true,
          schedule: "0 2 * * *", // Daily at 2 AM
          retention: {
            daily: 30,
            weekly: 12,
            monthly: 12
          },
          encryption: {
            enabled: true,
            algorithm: "aes-256-cbc"
          },
          compression: {
            enabled: true,
            level: 6
          },
          incremental: {
            enabled: true,
            baselineFrequency: 7
          },
          testing: {
            enabled: true,
            frequency: 24
          }
        },
        statistics: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching advanced backup configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching backup configuration",
        },
      },
      { status: 500 }
    );
  }
}