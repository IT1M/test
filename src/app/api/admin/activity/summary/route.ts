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

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    const activitySummary = await ActivityMonitoringService.getActivitySummary(hours);

    return NextResponse.json({
      success: true,
      data: activitySummary,
    });
  } catch (error) {
    console.error("Failed to fetch activity summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}