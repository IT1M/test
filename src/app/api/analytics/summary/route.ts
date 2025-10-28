import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { cache, generateCacheKey, TTL } from "@/utils/cache";

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

    // Check cache first (5 minute TTL)
    const cacheKey = generateCacheKey('analytics:summary', { dateFrom, dateTo });
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        meta: {
          cached: true,
        },
      });
    }

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

    // Fetch current period data using aggregation for better performance
    const [
      totalItems,
      aggregations,
      activeUsers,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: dateFilter }),
      prisma.inventoryItem.aggregate({
        where: dateFilter,
        _sum: {
          quantity: true,
          reject: true,
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // Calculate KPIs for current period
    const totalQuantity = aggregations._sum.quantity || 0;
    const totalRejects = aggregations._sum.reject || 0;
    const rejectRate = totalQuantity > 0 ? (totalRejects / totalQuantity) * 100 : 0;

    // Fetch previous period data for trends using aggregation
    let previousPeriodData = null;
    if (Object.keys(previousPeriodFilter).length > 0) {
      const [prevTotalItems, prevAggregations] = await Promise.all([
        prisma.inventoryItem.count({ where: previousPeriodFilter }),
        prisma.inventoryItem.aggregate({
          where: previousPeriodFilter,
          _sum: {
            quantity: true,
            reject: true,
          },
        }),
      ]);

      const prevTotalQuantity = prevAggregations._sum.quantity || 0;
      const prevTotalRejects = prevAggregations._sum.reject || 0;
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

    const responseData = {
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
    };

    // Cache the response for 5 minutes
    cache.set(cacheKey, responseData, TTL.FIVE_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        cached: false,
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
