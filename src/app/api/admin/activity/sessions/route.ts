import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ActivityMonitoringService } from "@/services/activityMonitoring";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const activeSessions = await ActivityMonitoringService.getActiveSessions();

    return NextResponse.json({
      success: true,
      data: activeSessions,
    });
  } catch (error) {
    console.error("Failed to fetch active sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}