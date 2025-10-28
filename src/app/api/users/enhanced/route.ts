import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";

// GET /api/users/enhanced - Enhanced user listing with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to read users
    if (!canPerformAction(session.user.role, "read", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const activity = searchParams.get("activity");
    const twoFactor = searchParams.get("twoFactor");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Active status filter
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    // Two-factor authentication filter
    if (twoFactor !== null && twoFactor !== undefined && twoFactor !== "") {
      where.twoFactorEnabled = twoFactor === "true";
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with enhanced data
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        _count: {
          select: {
            inventoryItems: true,
            auditLogs: true,
            sessions: true,
            activities: true,
            securityAlerts: true,
          },
        },
        sessions: {
          where: {
            isActive: true,
          },
          select: {
            lastActivity: true,
          },
          orderBy: {
            lastActivity: "desc",
          },
          take: 1,
        },
        activities: {
          select: {
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Process users to add computed fields
    const processedUsers = users.map(user => {
      const lastActivity = user.sessions[0]?.lastActivity || user.activities[0]?.timestamp;
      
      // Filter by activity if specified
      if (activity && lastActivity) {
        const lastActivityDate = new Date(lastActivity);
        const now = new Date();
        const diffHours = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
        
        switch (activity) {
          case "active":
            if (diffHours >= 1) return null;
            break;
          case "recent":
            if (diffHours >= 24) return null;
            break;
          case "inactive":
            if (diffHours < 24 || diffHours >= 168) return null;
            break;
          case "dormant":
            if (diffHours < 168) return null;
            break;
        }
      } else if (activity === "active" || activity === "recent" || activity === "inactive") {
        // If no activity data but filtering by activity, exclude
        return null;
      }

      return {
        ...user,
        lastActivity: lastActivity?.toISOString(),
        sessions: undefined, // Remove from response
        activities: undefined, // Remove from response
      };
    }).filter(Boolean);

    // Recalculate total if activity filter was applied
    const finalTotal = activity ? processedUsers.length : total;
    const finalUsers = activity ? processedUsers.slice((page - 1) * limit, page * limit) : processedUsers;

    return NextResponse.json({
      success: true,
      data: finalUsers,
      meta: {
        page,
        limit,
        total: finalTotal,
        pages: Math.ceil(finalTotal / limit),
        filters: {
          search: search || null,
          role: role || null,
          isActive: isActive || null,
          activity: activity || null,
          twoFactor: twoFactor || null,
          dateRange: {
            start: startDate || null,
            end: endDate || null,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching enhanced users:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch users",
        },
      },
      { status: 500 }
    );
  }
}