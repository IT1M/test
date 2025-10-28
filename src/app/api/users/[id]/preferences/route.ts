import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { z } from "zod";

// Schema for updating user preferences
const PreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["en", "ar"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
});

// PATCH /api/users/[id]/preferences - Update user preferences
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const userId = id;

    // Users can only update their own preferences unless they're an admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Get current user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Merge new preferences with existing ones
    const currentPreferences = (user.preferences as Record<string, any>) || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...validationResult.data,
    };

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPreferences,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferences: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update user preferences",
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/preferences - Get user preferences
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const userId = id;

    // Users can only view their own preferences unless they're an admin
    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: user.preferences || {},
      },
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user preferences",
        },
      },
      { status: 500 }
    );
  }
}
