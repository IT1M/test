import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";

// GET /api/users/export - Export users to CSV
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

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inventoryItems: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Create CSV content
    const csvHeaders = [
      "ID",
      "Name",
      "Email", 
      "Role",
      "Status",
      "Inventory Items",
      "Audit Logs",
      "Created At",
      "Updated At"
    ];

    const csvRows = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.isActive ? "Active" : "Inactive",
      user._count.inventoryItems.toString(),
      user._count.auditLogs.toString(),
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "EXPORT",
      entityType: "User",
      entityId: "bulk",
      newValue: { count: users.length },
      ipAddress,
      userAgent,
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting users:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export users",
        },
      },
      { status: 500 }
    );
  }
}