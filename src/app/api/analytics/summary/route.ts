import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";

// GET handler for analytics summary with KPIs
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

    // Check authorization - MANAGER role or higher
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse query parameters for date range
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDate;
      }
    }

    // Calculate previous period for comparison
    let previousPeriodFilter: any = {};
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const periodLength = endDate.getTime() - startDate.getTime();
      
      const prevEndDate = new Date(startDate.getTime() - 1);
      const prevStartDate = new Date(prevEndDate.getTime() - periodLength);
      
      previousPeriodFilter = {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      };
    }

    // Fetch current period data
    const [
      totalItems,
      inventoryItems,
      activeUsers,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: dateFilter }),
      prisma.inventoryItem.findMany({
        where: dateFilter,
        select: {
          quantity: true,
          reject: true,
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // Calculate KPIs for current period
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRejects = inventoryItems.reduce((sum, item) => sum + item.reject, 0);
    const rejectRate = totalQuantity > 0 ? (totalRejects / totalQuantity) * 100 : 0;

    // Fetch previous period data for trends
    let previousPeriodData = null;
    if (Object.keys(previousPeriodFilter).length > 0) {
      const [prevTotalItems, prevInventoryItems] = await Promise.all([
        prisma.inventoryItem.count({ where: previousPeriodFilter }),
        prisma.inventoryItem.findMany({
          where: previousPeriodFilter,
          select: {
            quantity: true,
            reject: true,
          },
        }),
      ]);

      const prevTotalQuantity = prevInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      const prevTotalRejects = prevInventoryItems.reduce((sum, item) => sum + item.reject, 0);
      const prevRejectRate = prevTotalQuantity > 0 ? (prevTotalRejects / prevTotalQuantity) * 100 : 0;

      previousPeriodData = {
        totalItems: prevTotalItems,
        totalQuantity: prevTotalQuantity,
        rejectRate: prevRejectRate,
      };
    }

    // Calculate trends (percentage change from previous period)
    const calculateTrend = (current: number, previous: number | null) => {
      if (previous === null || previous === 0) return null;
      return ((current - previous) / previous) * 100;
    };

    const trends = previousPeriodData ? {
      totalItems: calculateTrend(totalItems, previousPeriodData.totalItems),
      totalQuantity: calculateTrend(totalQuantity, previousPeriodData.totalQuantity),
      rejectRate: calculateTrend(rejectRate, previousPeriodData.rejectRate),
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalItems: {
            value: totalItems,
            trend: trends?.totalItems || null,
          },
          totalQuantity: {
            value: totalQuantity,
            trend: trends?.totalQuantity || null,
          },
          rejectRate: {
            value: parseFloat(rejectRate.toFixed(2)),
            trend: trends?.rejectRate || null,
          },
          activeUsers: {
            value: activeUsers,
            trend: null, // User count doesn't have a trend
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching analytics summary",
        },
      },
      { status: 500 }
    );
  }
}
