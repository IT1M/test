import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";

const BulkOperationSchema = z.object({
  userIds: z.array(z.string().uuid()),
  operation: z.enum(["activate", "deactivate", "changeRole", "delete"]),
  data: z.object({
    isActive: z.boolean().optional(),
    role: z.enum(["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER", "AUDITOR"]).optional(),
  }).optional(),
});

// POST /api/users/bulk - Perform bulk operations on users
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to update users
    if (!canPerformAction(session.user.role, "update", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = BulkOperationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { userIds, operation, data } = validation.data;

    // Prevent users from performing operations on themselves
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "You cannot perform bulk operations on your own account",
          },
        },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let auditAction = "UPDATE";

    switch (operation) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "changeRole":
        if (!data?.role) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Role is required for changeRole operation",
              },
            },
            { status: 400 }
          );
        }
        updateData = { role: data.role };
        break;
      case "delete":
        if (!canPerformAction(session.user.role, "delete", "user")) {
          return NextResponse.json(
            { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions for delete operation" } },
            { status: 403 }
          );
        }
        updateData = { isActive: false };
        auditAction = "DELETE";
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid operation",
            },
          },
          { status: 400 }
        );
    }

    // Get existing users for audit trail
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData,
    });

    // Create audit logs for each user
    const { ipAddress, userAgent } = getClientInfo(request);
    const auditPromises = existingUsers.map(user => {
      const oldValue = {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      };
      const newValue = { ...oldValue, ...updateData };

      return createAuditLog({
        userId: session.user.id,
        action: auditAction,
        entityType: "User",
        entityId: user.id,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      });
    });

    await Promise.all(auditPromises);

    return NextResponse.json({
      success: true,
      data: {
        operation,
        affectedUsers: result.count,
        userIds,
      },
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to perform bulk operation",
        },
      },
      { status: 500 }
    );
  }
}