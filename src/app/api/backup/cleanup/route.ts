import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { advancedBackupService } from "@/services/advancedBackup";
import { createAuditLog, getClientInfo } from "@/utils/audit";

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
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Admin access required" } },
        { status: 403 }
      );
    }

    // Perform cleanup
    const cleanupResults = await advancedBackupService.cleanupOldBackups();

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "BackupCleanup",
      entityId: "cleanup_operation",
      newValue: {
        deletedCount: cleanupResults.deleted,
        errors: cleanupResults.errors.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: cleanupResults,
      message: `Cleanup completed. ${cleanupResults.deleted} old backups removed.`,
    });
  } catch (error) {
    console.error("Error during backup cleanup:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred during backup cleanup",
        },
      },
      { status: 500 }
    );
  }
}