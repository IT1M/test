import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { AuthError } from "next-auth";

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

    // Find user for audit logging
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    const { ipAddress, userAgent } = getClientInfo(request);

    try {
      // Attempt to sign in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Create audit log for successful login
      if (user) {
        await createAuditLog({
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          ipAddress,
          userAgent,
        });
      }

      return NextResponse.json({
        success: true,
        data: { message: "Login successful" },
      });
    } catch (error) {
      // Create audit log for failed login attempt
      if (user) {
        await createAuditLog({
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          ipAddress,
          userAgent,
          newValue: { success: false, reason: "Invalid credentials" },
        });
      }

      if (error instanceof AuthError) {
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

      throw error;
    }
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
