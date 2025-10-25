import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";

// GET handler to fetch a single report
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

    // Check authorization - MANAGER role or higher
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found" } },
        { status: 404 }
      );
    }

    // Create audit log for viewing
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "VIEW",
      entityType: "Report",
      entityId: report.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching the report",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a report
export async function DELETE(
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

    // Check authorization - ADMIN only
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found" } },
        { status: 404 }
      );
    }

    await prisma.report.delete({
      where: { id },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Report",
      entityId: id,
      oldValue: { title: report.title, type: report.type },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the report",
        },
      },
      { status: 500 }
    );
  }
}
