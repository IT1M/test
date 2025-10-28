import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { canPerformAction } from "@/utils/rbac";
import { z } from "zod";

// Validation schema for settings
const SettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.any(),
  category: z.enum(["theme", "api", "notifications", "backup", "general"]),
});

// GET /api/settings - Get all settings or filter by category
export async function GET(request: NextRequest) {
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    // Build where clause
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (key) {
      where.key = key;
    }

    const settings = await prisma.systemSettings.findMany({
      where,
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
      orderBy: { category: "asc" },
    });

    // If a specific key is requested, return just that setting
    if (key && settings.length === 1) {
      return NextResponse.json({
        success: true,
        data: settings[0],
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch settings",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create a new setting
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to create settings
    if (!canPerformAction(session.user.role, "create", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = SettingSchema.safeParse(body);
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

    const { key, value, category } = validation.data;

    // Check if setting already exists
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (existingSetting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Setting with this key already exists",
          },
        },
        { status: 400 }
      );
    }

    // Create setting
    const newSetting = await prisma.systemSettings.create({
      data: {
        key,
        value,
        category,
        updatedById: session.user.id,
      },
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
      action: "CREATE",
      entityType: "SystemSettings",
      entityId: newSetting.id,
      newValue: { key, value, category },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: newSetting,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create setting",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update settings (bulk update)
export async function PATCH(request: NextRequest) {
  try {
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

    // Expect an array of settings to update
    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Expected an array of settings",
          },
        },
        { status: 400 }
      );
    }

    const updatedSettings = [];
    const { ipAddress, userAgent } = getClientInfo(request);

    for (const setting of body) {
      const validation = SettingSchema.safeParse(setting);
      if (!validation.success) {
        continue; // Skip invalid settings
      }

      const { key, value, category } = validation.data;

      // Get existing setting
      const existingSetting = await prisma.systemSettings.findUnique({
        where: { key },
      });

      let updatedSetting;

      if (existingSetting) {
        // Update existing setting
        updatedSetting = await prisma.systemSettings.update({
          where: { key },
          data: {
            value,
            category,
            updatedById: session.user.id,
          },
          select: {
            id: true,
            key: true,
            value: true,
            category: true,
            updatedAt: true,
          },
        });

        // Create audit log
        await createAuditLog({
          userId: session.user.id,
          action: "UPDATE",
          entityType: "SystemSettings",
          entityId: updatedSetting.id,
          oldValue: { value: existingSetting.value },
          newValue: { value },
          ipAddress,
          userAgent,
        });
      } else {
        // Create new setting
        updatedSetting = await prisma.systemSettings.create({
          data: {
            key,
            value,
            category,
            updatedById: session.user.id,
          },
          select: {
            id: true,
            key: true,
            value: true,
            category: true,
            updatedAt: true,
          },
        });

        // Create audit log
        await createAuditLog({
          userId: session.user.id,
          action: "CREATE",
          entityType: "SystemSettings",
          entityId: updatedSetting.id,
          newValue: { key, value, category },
          ipAddress,
          userAgent,
        });
      }

      updatedSettings.push(updatedSetting);
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update settings",
        },
      },
      { status: 500 }
    );
  }
}
