import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";

// GET handler for listing backups
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

    // Check authorization - ADMIN or MANAGER only
    const allowedRoles = ["ADMIN", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch backups with pagination
    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.backup.count(),
    ]);

    // Calculate pagination metadata
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: backups,
      meta: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching backups:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching backups",
        },
      },
      { status: 500 }
    );
  }
}
