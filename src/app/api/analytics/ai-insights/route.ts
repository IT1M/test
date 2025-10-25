import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { geminiService } from "@/services/gemini";

// POST handler for AI-generated insights
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - MANAGER role or higher
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Check if Gemini is initialized
    if (!geminiService.isInitialized()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "AI service is not available. Please check configuration.",
          },
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { dateFrom, dateTo, query } = body;

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDate;
      }
    }

    // Fetch inventory data
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: dateFilter,
      select: {
        itemName: true,
        batch: true,
        quantity: true,
        reject: true,
        destination: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000, // Limit to most recent 1000 items for performance
    });

    if (inventoryItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          findings: ["No inventory data available for the selected period."],
          alerts: [],
          recommendations: ["Add inventory items to get AI-powered insights."],
          predictions: [],
          cached: false,
        },
      });
    }

    // If there's a specific query, use natural language handler
    if (query && query.trim()) {
      const response = await geminiService.handleNaturalLanguageQuery(
        query,
        inventoryItems
      );

      return NextResponse.json({
        success: true,
        data: {
          query,
          response,
          cached: false,
        },
      });
    }

    // Otherwise, generate comprehensive insights
    const insights = await geminiService.generateInsights(inventoryItems);

    return NextResponse.json({
      success: true,
      data: {
        ...insights,
        cached: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating AI insights:", error);
    
    // Handle rate limit errors
    if (error.message?.includes("Rate limit")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: error.message,
          },
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while generating AI insights",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
