import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";

// GET /api/users/[id]/security-alerts - Get user security alerts
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
    const severity = searchParams.get("severity");
    const resolved = searchParams.get("resolved");
    const alertType = searchParams.get("alertType");

    // Build where clause
    const where: any = { userId: id };

    if (severity) {
      where.severity = severity;
    }

    if (resolved !== null && resolved !== undefined && resolved !== "") {
      where.isResolved = resolved === "true";
    }

    if (alertType) {
      where.alertType = alertType;
    }

    const securityAlerts = await prisma.securityAlert.findMany({
      where,
      select: {
        id: true,
        alertType: true,
        severity: true,
        title: true,
        description: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        isResolved: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: securityAlerts,
    });
  } catch (error) {
    console.error("Error fetching security alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch security alerts",
        },
      },
      { status: 500 }
    );
  }
}