import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ActivityMonitoringService } from "@/services/activityMonitoring";
import { getClientInfo } from "@/utils/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, resource, details, duration } = body;

    const { ipAddress, userAgent } = getClientInfo(request);
    
    // Get session ID from cookies
    const sessionCookie = request.cookies.get("next-auth.session-token") || 
                         request.cookies.get("__Secure-next-auth.session-token");
    
    const sessionId = sessionCookie?.value || null;

    // Track the activity
    await ActivityMonitoringService.trackActivity(
      session.user.id,
      sessionId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      duration
    );

    return NextResponse.json({
      success: true,
      message: "Activity tracked successfully",
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}