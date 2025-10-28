import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { getDefaultDashboard } from "@/utils/rbac";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user for audit logging
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true },
    });

    const { ipAddress, userAgent } = getClientInfo(request);

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Get full user data for password verification
    const fullUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!fullUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, fullUser.password);

    if (!isPasswordValid) {
      // Create audit log for failed login attempt
      await createAuditLog({
        userId: user.id,
        action: "LOGIN",
        entityType: "User",
        // Don't pass entityId for User operations as it's linked to InventoryItem
        ipAddress,
        userAgent,
        newValue: { success: false, reason: "Invalid credentials" },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Create audit log for successful login
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      // Don't pass entityId for User operations as it's linked to InventoryItem
      ipAddress,
      userAgent,
      newValue: { success: true },
    });

    // Get the appropriate dashboard for the user's role
    const defaultDashboard = getDefaultDashboard(fullUser.role);

    return NextResponse.json({
      success: true,
      data: { 
        message: "Login successful",
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          role: fullUser.role,
        },
        redirectTo: defaultDashboard
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during login",
        },
      },
      { status: 500 }
    );
  }
}
