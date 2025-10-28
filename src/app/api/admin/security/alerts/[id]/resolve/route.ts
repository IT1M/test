import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ActivityMonitoringService } from "@/services/activityMonitoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const alertId = params.id;
    
    await ActivityMonitoringService.resolveSecurityAlert(alertId, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Security alert resolved successfully",
    });
  } catch (error) {
    console.error("Failed to resolve security alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}