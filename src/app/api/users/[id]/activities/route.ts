import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";

// GET /api/users/[id]/activities - Get user activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to read user data
    if (!canPerformAction(session.user.role, "read", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = { userId: id };

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    if (resource) {
      where.resource = { contains: resource, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const activities = await prisma.userActivity.findMany({
      where,
      select: {
        id: true,
        action: true,
        resource: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        duration: true,
        timestamp: true,
        session: {
          select: {
            device: true,
            browser: true,
            location: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user activities",
        },
      },
      { status: 500 }
    );
  }
}