import { NextRequest, NextResponse } from "next/server";
import { auth, signOut } from "@/services/auth";
import { createAuditLog, getClientInfo } from "@/utils/audit";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Not authenticated",
          },
        },
        { status: 401 }
      );
    }

    // Create audit log before signing out
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "LOGOUT",
      entityType: "User",
      entityId: session.user.id,
      ipAddress,
      userAgent,
    });

    // Sign out
    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during logout",
        },
      },
      { status: 500 }
    );
  }
}
