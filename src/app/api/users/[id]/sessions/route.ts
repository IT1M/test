import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";

// GET /api/users/[id]/sessions - Get user sessions
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Build where clause
    const where: any = { userId: id };
    if (activeOnly) {
      where.isActive = true;
    }

    const sessions = await prisma.userSession.findMany({
      where,
      select: {
        id: true,
        sessionId: true,
        ipAddress: true,
        userAgent: true,
        location: true,
        device: true,
        browser: true,
        isActive: true,
        lastActivity: true,
        createdAt: true,
        expiresAt: true,
        endedAt: true,
      },
      orderBy: { lastActivity: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user sessions",
        },
      },
      { status: 500 }
    );
  }
}