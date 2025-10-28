import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { canPerformAction } from "@/utils/rbac";
import { z } from "zod";

// Validation schema for updating a setting
const UpdateSettingSchema = z.object({
  value: z.any(),
  category: z.enum(["theme", "api", "notifications", "backup", "general"]).optional(),
});

// GET /api/settings/[key] - Get a specific setting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to read settings
    if (!canPerformAction(session.user.role, "read", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        value: true,
        category: true,
        updatedAt: true,
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Setting not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch setting",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/[key] - Update a specific setting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to update settings
    if (!canPerformAction(session.user.role, "update", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = UpdateSettingSchema.safeParse(body);
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

    // Get existing setting
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Setting not found",
          },
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      value: validation.data.value,
      updatedById: session.user.id,
    };

    if (validation.data.category) {
      updateData.category = validation.data.category;
    }

    // Update setting
    const updatedSetting = await prisma.systemSettings.update({
      where: { key },
      data: updateData,
      select: {
        id: true,
        key: true,
        value: true,
        category: true,
        updatedAt: true,
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "SystemSettings",
      entityId: updatedSetting.id,
      oldValue: { value: existingSetting.value },
      newValue: { value: updatedSetting.value },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedSetting,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update setting",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/[key] - Delete a specific setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to delete settings
    if (!canPerformAction(session.user.role, "delete", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Get existing setting
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Setting not found",
          },
        },
        { status: 404 }
      );
    }

    // Delete setting
    await prisma.systemSettings.delete({
      where: { key },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "SystemSettings",
      entityId: existingSetting.id,
      oldValue: { key: existingSetting.key, value: existingSetting.value },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: "Setting deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete setting",
        },
      },
      { status: 500 }
    );
  }
}
