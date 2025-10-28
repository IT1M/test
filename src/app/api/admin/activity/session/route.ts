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
    const { action } = body;

    const { ipAddress, userAgent } = getClientInfo(request);
    
    // Get session ID from cookies
    const sessionCookie = request.cookies.get("next-auth.session-token") || 
                         request.cookies.get("__Secure-next-auth.session-token");
    
    const sessionId = sessionCookie?.value || crypto.randomUUID();

    if (action === 'SESSION_START') {
      // Create or update session
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      await ActivityMonitoringService.createOrUpdateSession(
        session.user.id,
        sessionId,
        ipAddress,
        userAgent,
        expiresAt,
        undefined, // location - could be determined from IP
        undefined, // device - could be parsed from userAgent
        undefined  // browser - could be parsed from userAgent
      );
    } else if (action === 'SESSION_END') {
      // End session
      await ActivityMonitoringService.endSession(sessionId);
    }

    // Track the activity
    await ActivityMonitoringService.trackActivity(
      session.user.id,
      sessionId,
      action,
      'session',
      undefined,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Session tracked successfully",
    });
  } catch (error) {
    console.error("Failed to track session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}