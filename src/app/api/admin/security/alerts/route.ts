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
    const limit = parseInt(searchParams.get('limit') || '50');
    const onlyUnresolved = searchParams.get('unresolved') === 'true';

    const alerts = await ActivityMonitoringService.getSecurityAlerts(limit, onlyUnresolved);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Failed to fetch security alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alertType, severity, title, description, userId, metadata, ipAddress, userAgent } = body;

    if (!alertType || !severity || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await ActivityMonitoringService.createSecurityAlert(
      alertType,
      severity,
      title,
      description,
      userId,
      metadata,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Security alert created successfully",
    });
  } catch (error) {
    console.error("Failed to create security alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}