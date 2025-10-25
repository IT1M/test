import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { cache, generateCacheKey, TTL } from "@/utils/cache";

// GET handler for analytics trends (time-series data)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    // Check cache first (5 minute TTL)
    const cacheKey = generateCacheKey('analytics:trends', { dateFrom, dateTo, groupBy });
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

    // Fetch all inventory items in the date range
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: dateFilter,
      select: {
        createdAt: true,
        quantity: true,
        reject: true,
        destination: true,
        category: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group data by time period
    const groupedData = new Map<string, {
      date: string;
      totalQuantity: number;
      totalRejects: number;
      itemCount: number;
      maisCount: number;
      fozanCount: number;
    }>();

    inventoryItems.forEach((item) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // day
        key = date.toISOString().split("T")[0];
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: key,
          totalQuantity: 0,
          totalRejects: 0,
          itemCount: 0,
          maisCount: 0,
          fozanCount: 0,
        });
      }

      const group = groupedData.get(key)!;
      group.totalQuantity += item.quantity;
      group.totalRejects += item.reject;
      group.itemCount += 1;
      
      if (item.destination === "MAIS") {
        group.maisCount += 1;
      } else if (item.destination === "FOZAN") {
        group.fozanCount += 1;
      }
    });

    // Convert to array and calculate reject rates
    const trends = Array.from(groupedData.values()).map((group) => ({
      date: group.date,
      totalQuantity: group.totalQuantity,
      totalRejects: group.totalRejects,
      rejectRate: group.totalQuantity > 0 
        ? parseFloat(((group.totalRejects / group.totalQuantity) * 100).toFixed(2))
        : 0,
      itemCount: group.itemCount,
      maisCount: group.maisCount,
      fozanCount: group.fozanCount,
    }));

    // Calculate distribution by destination
    const destinationDistribution = {
      MAIS: inventoryItems.filter(item => item.destination === "MAIS").length,
      FOZAN: inventoryItems.filter(item => item.destination === "FOZAN").length,
    };

    // Calculate distribution by category
    const categoryMap = new Map<string, number>();
    inventoryItems.forEach((item) => {
      const category = item.category || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 categories

    // Calculate reject analysis by ranges
    const rejectRanges = {
      none: 0,        // 0%
      low: 0,         // 0-5%
      medium: 0,      // 5-15%
      high: 0,        // >15%
    };

    inventoryItems.forEach((item) => {
      if (item.reject === 0) {
        rejectRanges.none += 1;
      } else {
        const rejectRate = (item.reject / item.quantity) * 100;
        if (rejectRate <= 5) {
          rejectRanges.low += 1;
        } else if (rejectRate <= 15) {
          rejectRanges.medium += 1;
        } else {
          rejectRanges.high += 1;
        }
      }
    });

    const responseData = {
      trends,
      destinationDistribution,
      categoryDistribution,
      rejectAnalysis: rejectRanges,
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
    console.error("Error fetching analytics trends:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching analytics trends",
        },
      },
      { status: 500 }
    );
  }
}
