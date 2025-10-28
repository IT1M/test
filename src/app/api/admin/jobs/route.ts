import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BackgroundJobService } from "@/services/backgroundJobs";

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
    const { jobType } = body;

    let result;

    switch (jobType) {
      case 'security-detection':
        result = await BackgroundJobService.runSecurityDetection();
        break;
      case 'cleanup':
        result = await BackgroundJobService.runCleanup();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid job type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to run background job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}