import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { backupScheduler } from "@/services/backupScheduler";
import { createAuditLog, getClientInfo } from "@/utils/audit";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET handler for getting a specific scheduled backup job
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const job = backupScheduler.getJob(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Scheduled backup job not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching scheduled backup job:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching the scheduled backup job",
        },
      },
      { status: 500 }
    );
  }
}

// PUT handler for updating a scheduled backup job
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = params;
    const job = backupScheduler.getJob(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Scheduled backup job not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    if (action) {
      // Handle specific actions
      switch (action) {
        case 'enable':
          backupScheduler.enableJob(id);
          break;
        case 'disable':
          backupScheduler.disableJob(id);
          break;
        case 'execute':
          await backupScheduler.executeJob(id);
          break;
        default:
          return NextResponse.json(
            { success: false, error: { code: "INVALID_ACTION", message: "Invalid action" } },
            { status: 400 }
          );
      }
    } else {
      // Update job properties
      const updatedJob = { ...job, ...updateData };
      backupScheduler.addJob(updatedJob); // This will replace the existing job
    }

    const updatedJob = backupScheduler.getJob(id);

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "ScheduledBackupJob",
      entityId: id,
      oldValue: job,
      newValue: updatedJob,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: action ? `Job ${action} completed successfully` : "Scheduled backup job updated successfully",
    });
  } catch (error) {
    console.error("Error updating scheduled backup job:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred while updating the scheduled backup job",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a scheduled backup job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = params;
    const job = backupScheduler.getJob(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Scheduled backup job not found" } },
        { status: 404 }
      );
    }

    // Remove the job
    backupScheduler.removeJob(id);

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "ScheduledBackupJob",
      entityId: id,
      oldValue: job,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled backup job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled backup job:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred while deleting the scheduled backup job",
        },
      },
      { status: 500 }
    );
  }
}