import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { geminiService } from "@/services/gemini";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { ReportType } from "@prisma/client";

interface GenerateReportRequest {
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  title?: string;
  includeAIInsights?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - MANAGER role or higher
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body: GenerateReportRequest = await request.json();
    const { type, periodStart, periodEnd, title, includeAIInsights = false } = body;

    // Validate required fields
    if (!type || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    endDate.setHours(23, 59, 59, 999);

    // Validate date range
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid date range" } },
        { status: 400 }
      );
    }

    // Fetch inventory data for the period
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        enteredBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate analytics
    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRejects = inventoryItems.reduce((sum, item) => sum + item.reject, 0);
    const rejectRate = totalQuantity > 0 ? (totalRejects / totalQuantity) * 100 : 0;

    // Group by destination
    const byDestination = inventoryItems.reduce((acc, item) => {
      const dest = item.destination;
      if (!acc[dest]) {
        acc[dest] = { count: 0, quantity: 0, rejects: 0 };
      }
      acc[dest].count++;
      acc[dest].quantity += item.quantity;
      acc[dest].rejects += item.reject;
      return acc;
    }, {} as Record<string, { count: number; quantity: number; rejects: number }>);

    // Group by category
    const byCategory = inventoryItems.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = { count: 0, quantity: 0, rejects: 0 };
      }
      acc[cat].count++;
      acc[cat].quantity += item.quantity;
      acc[cat].rejects += item.reject;
      return acc;
    }, {} as Record<string, { count: number; quantity: number; rejects: number }>);

    // Top items by quantity
    const topItems = inventoryItems
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(item => ({
        itemName: item.itemName,
        batch: item.batch,
        quantity: item.quantity,
        reject: item.reject,
        destination: item.destination,
      }));

    // Items with high reject rates
    const highRejectItems = inventoryItems
      .filter(item => item.quantity > 0 && (item.reject / item.quantity) > 0.15)
      .map(item => ({
        itemName: item.itemName,
        batch: item.batch,
        quantity: item.quantity,
        reject: item.reject,
        rejectRate: ((item.reject / item.quantity) * 100).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.rejectRate) - parseFloat(a.rejectRate))
      .slice(0, 10);

    // Prepare data snapshot
    const dataSnapshot = {
      summary: {
        totalItems,
        totalQuantity,
        totalRejects,
        rejectRate: parseFloat(rejectRate.toFixed(2)),
      },
      byDestination,
      byCategory,
      topItems,
      highRejectItems,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };

    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAIInsights && geminiService.isInitialized()) {
      try {
        const insights = await geminiService.generateInsights(inventoryItems);
        aiInsights = JSON.stringify(insights);
      } catch (error) {
        console.error("Failed to generate AI insights:", error);
        // Continue without AI insights
      }
    }

    // Generate report title
    const reportTitle = title || `${type} Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

    // Create report record
    const report = await prisma.report.create({
      data: {
        title: reportTitle,
        type,
        periodStart: startDate,
        periodEnd: endDate,
        generatedById: session.user.id,
        dataSnapshot,
        aiInsights,
        status: "COMPLETED",
      },
      include: {
        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Report",
      entityId: report.id,
      newValue: { type, periodStart, periodEnd },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while generating the report",
        },
      },
      { status: 500 }
    );
  }
}
