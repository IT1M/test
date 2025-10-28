import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction, canManageUser } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema for updating a user
const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER", "AUDITOR"]).optional(),
  isActive: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

// GET /api/users/[id] - Get user details
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

    // Get user with detailed information
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
        sessions: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            isActive: true,
            lastActivity: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
          orderBy: {
            lastActivity: "desc",
          },
          take: 10,
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
          take: 20,
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
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Add computed fields
    const lastActivity = user.sessions[0]?.lastActivity || user.activities[0]?.timestamp;
    
    const userWithDetails = {
      ...user,
      lastActivity: lastActivity?.toISOString(),
      recentActivities: user.activities,
    };

    return NextResponse.json({
      success: true,
      data: userWithDetails,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user details",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
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

    // Check if user has permission to update users
    if (!canPerformAction(session.user.role, "update", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();

    // Validate input
    const validation = UpdateUserSchema.safeParse(body);
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

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Check if current user can manage the target user
    if (!canManageUser(session.user.role, existingUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Cannot manage user with this role" } },
        { status: 403 }
      );
    }

    // Prevent users from modifying their own account through this endpoint
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Cannot modify your own account through this endpoint" } },
        { status: 400 }
      );
    }

    const updateData: any = {};
    const { email, name, password, role, isActive, twoFactorEnabled } = validation.data;

    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Email is already taken by another user",
            },
          },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      oldValue: existingUser,
      newValue: updatedUser,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update user",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(
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

    // Check if user has permission to delete users
    if (!canPerformAction(session.user.role, "delete", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Check if current user can manage the target user
    if (!canManageUser(session.user.role, existingUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Cannot delete user with this role" } },
        { status: 403 }
      );
    }

    // Prevent users from deleting their own account
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Cannot delete your own account" } },
        { status: 400 }
      );
    }

    // Soft delete by deactivating the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "User",
      entityId: userId,
      oldValue: existingUser,
      newValue: updatedUser,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete user",
        },
      },
      { status: 500 }
    );
  }
}