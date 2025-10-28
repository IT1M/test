import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";

// GET /api/users/[id]/export - Export individual user data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        inventoryItems: {
          select: {
            id: true,
            itemName: true,
            batchNumber: true,
            quantity: true,
            category: true,
            destination: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            timestamp: true,
            ipAddress: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
        sessions: {
          select: {
            id: true,
            isActive: true,
            lastActivity: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        activities: {
          select: {
            id: true,
            action: true,
            entityType: true,
            timestamp: true,
            ipAddress: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
        securityAlerts: {
          select: {
            id: true,
            type: true,
            severity: true,
            message: true,
            timestamp: true,
            resolved: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Prepare export data
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        preferences: user.preferences,
      },
      statistics: user._count,
      inventoryItems: user.inventoryItems,
      auditLogs: user.auditLogs,
      sessions: user.sessions,
      activities: user.activities,
      securityAlerts: user.securityAlerts,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        version: "1.0",
      },
    };

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "EXPORT",
      entityType: "User",
      entityId: userId,
      newValue: { exportType: "individual_user_data" },
      ipAddress,
      userAgent,
    });

    // Return JSON data
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-${user.email}-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export user data",
        },
      },
      { status: 500 }
    );
  }
}