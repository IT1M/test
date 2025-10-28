import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { backupScheduler } from "@/services/backupScheduler";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";
import { BackupType } from "@prisma/client";

// Validation schema for scheduled backup job
const ScheduledBackupJobSchema = z.object({
  name: z.string().min(1, "Name is required"),
  schedule: z.string().min(1, "Schedule is required"),
  type: z.enum(["full", "incremental"]),
  fileType: z.enum(["CSV", "JSON", "SQL"]),
  enabled: z.boolean(),
  options: z.object({
    encryption: z.boolean(),
    compression: z.boolean(),
    testing: z.boolean(),
    cleanup: z.boolean(),
  }),
});

// GET handler for listing scheduled backup jobs
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

    const jobs = backupScheduler.getJobs();

    return NextResponse.json({
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        enabled: jobs.filter(job => job.enabled).length,
        disabled: jobs.filter(job => !job.enabled).length,
      },
    });
  } catch (error) {
    console.error("Error fetching scheduled backup jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching scheduled backup jobs",
        },
      },
      { status: 500 }
    );
  }
}

// POST handler for creating a new scheduled backup job
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ScheduledBackupJobSchema.safeParse(body);

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

    const jobData = validationResult.data;

    // Generate unique job ID
    const jobId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the scheduled job
    const job = {
      id: jobId,
      ...jobData,
    };

    backupScheduler.addJob(job);

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "ScheduledBackupJob",
      entityId: jobId,
      newValue: job,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: job,
        message: "Scheduled backup job created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating scheduled backup job:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An error occurred while creating the scheduled backup job",
        },
      },
      { status: 500 }
    );
  }
}