import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { advancedBackupService } from "@/services/advancedBackup";
import { createAuditLog, getClientInfo } from "@/utils/audit";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ID", message: "Backup ID is required" } },
        { status: 400 }
      );
    }

    // Test the backup
    const testResults = await advancedBackupService.testBackup(id);

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "VIEW",
      entityType: "BackupTest",
      entityId: id,
      newValue: {
        testResults: testResults.success,
        testsRun: Object.keys(testResults.tests).length,
        errors: testResults.errors.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: testResults,
      message: testResults.success 
        ? "Backup test completed successfully" 
        : "Backup test completed with errors",
    });
  } catch (error) {
    console.error("Error testing backup:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred while testing the backup",
        },
      },
      { status: 500 }
    );
  }
}