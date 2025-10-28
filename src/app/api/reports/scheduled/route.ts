import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { z } from "zod";

// Validation schemas
const createScheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template ID is required"),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    timezone: z.string().default("Asia/Riyadh"),
  }),
  recipients: z.object({
    emails: z.array(z.string().email()),
    roles: z.array(z.string()),
  }),
  format: z.enum(["pdf", "excel", "csv"]),
  filters: z.object({
    dateRange: z.enum(["last7days", "last30days", "lastMonth", "lastQuarter"]).optional(),
    categories: z.array(z.string()).optional(),
    destinations: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

const updateScheduledReportSchema = createScheduledReportSchema.partial();

// GET /api/reports/scheduled - Get all scheduled reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Check if user has permission to view scheduled reports
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: { message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const [scheduledReports, total] = await Promise.all([
      prisma.scheduledReport.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledReport.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        scheduledReports: scheduledReports.map(report => ({
          ...report,
          schedule: JSON.parse(report.schedule as string),
          recipients: JSON.parse(report.recipients as string),
          filters: report.filters ? JSON.parse(report.filters as string) : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch scheduled reports" } },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Check if user has permission to create scheduled reports
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: { message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createScheduledReportSchema.parse(body);

    // Calculate next run time
    const nextRun = calculateNextRun(
      validatedData.schedule.frequency,
      validatedData.schedule.time,
      validatedData.schedule.dayOfWeek,
      validatedData.schedule.dayOfMonth
    );

    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        templateId: validatedData.templateId,
        schedule: JSON.stringify(validatedData.schedule),
        recipients: JSON.stringify(validatedData.recipients),
        format: validatedData.format,
        filters: validatedData.filters ? JSON.stringify(validatedData.filters) : null,
        isActive: validatedData.isActive,
        nextRun: validatedData.isActive ? nextRun : null,
        createdById: session.user.id,
      },
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
        ...scheduledReport,
        schedule: JSON.parse(scheduledReport.schedule as string),
        recipients: JSON.parse(scheduledReport.recipients as string),
        filters: scheduledReport.filters ? JSON.parse(scheduledReport.filters as string) : null,
      },
    });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Validation error", details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { message: "Failed to create scheduled report" } },
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