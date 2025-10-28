import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { z } from "zod";

const updateScheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template ID is required").optional(),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    timezone: z.string().default("Asia/Riyadh"),
  }).optional(),
  recipients: z.object({
    emails: z.array(z.string().email()),
    roles: z.array(z.string()),
  }).optional(),
  format: z.enum(["pdf", "excel", "csv"]).optional(),
  filters: z.object({
    dateRange: z.enum(["last7days", "last30days", "lastMonth", "lastQuarter"]).optional(),
    categories: z.array(z.string()).optional(),
    destinations: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/reports/scheduled/[id] - Get a specific scheduled report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: { message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!scheduledReport) {
      return NextResponse.json(
        { error: { message: "Scheduled report not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...scheduledReport,
        schedule: JSON.parse(scheduledReport.schedule as string),
        recipients: JSON.parse(scheduledReport.recipients as string),
        filters: scheduledReport.filters ? JSON.parse(scheduledReport.filters as string) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching scheduled report:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch scheduled report" } },
      { status: 500 }
    );
  }
}

// PUT /api/reports/scheduled/[id] - Update a scheduled report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: { message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateScheduledReportSchema.parse(body);

    // Check if the scheduled report exists
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id: params.id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: { message: "Scheduled report not found" } },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.templateId !== undefined) updateData.templateId = validatedData.templateId;
    if (validatedData.format !== undefined) updateData.format = validatedData.format;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    if (validatedData.schedule !== undefined) {
      updateData.schedule = JSON.stringify(validatedData.schedule);
      
      // Recalculate next run time if schedule changed
      const nextRun = calculateNextRun(
        validatedData.schedule.frequency,
        validatedData.schedule.time,
        validatedData.schedule.dayOfWeek,
        validatedData.schedule.dayOfMonth
      );
      updateData.nextRun = (validatedData.isActive ?? existingReport.isActive) ? nextRun : null;
    }

    if (validatedData.recipients !== undefined) {
      updateData.recipients = JSON.stringify(validatedData.recipients);
    }

    if (validatedData.filters !== undefined) {
      updateData.filters = validatedData.filters ? JSON.stringify(validatedData.filters) : null;
    }

    // If only isActive changed, update nextRun accordingly
    if (validatedData.isActive !== undefined && validatedData.schedule === undefined) {
      if (validatedData.isActive && !existingReport.nextRun) {
        const currentSchedule = JSON.parse(existingReport.schedule as string);
        const nextRun = calculateNextRun(
          currentSchedule.frequency,
          currentSchedule.time,
          currentSchedule.dayOfWeek,
          currentSchedule.dayOfMonth
        );
        updateData.nextRun = nextRun;
      } else if (!validatedData.isActive) {
        updateData.nextRun = null;
      }
    }

    const updatedReport = await prisma.scheduledReport.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        ...updatedReport,
        schedule: JSON.parse(updatedReport.schedule as string),
        recipients: JSON.parse(updatedReport.recipients as string),
        filters: updatedReport.filters ? JSON.parse(updatedReport.filters as string) : null,
      },
    });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Validation error", details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { message: "Failed to update scheduled report" } },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/scheduled/[id] - Delete a scheduled report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: { message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Check if the scheduled report exists
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id: params.id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: { message: "Scheduled report not found" } },
        { status: 404 }
      );
    }

    await prisma.scheduledReport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      data: { message: "Scheduled report deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting scheduled report:", error);
    return NextResponse.json(
      { error: { message: "Failed to delete scheduled report" } },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run time
function calculateNextRun(
  frequency: string,
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case "weekly":
      const currentDay = nextRun.getDay();
      const targetDay = dayOfWeek || 1;
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
      
    case "monthly":
      const targetDate = dayOfMonth || 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
      
    case "quarterly":
      const currentMonth = nextRun.getMonth();
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
      nextRun.setMonth(nextQuarterMonth);
      nextRun.setDate(1);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }
  
  return nextRun;
}