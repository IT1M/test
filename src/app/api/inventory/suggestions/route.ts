import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { withSecurity } from "@/middleware/security";

interface SuggestionResponse {
  value: string;
  label: string;
  frequency: number;
  lastUsed: Date;
}

// GET handler for fetching smart suggestions
async function getHandler(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");
    const query = searchParams.get("query") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    if (!field) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Field parameter is required" } },
        { status: 400 }
      );
    }

    let suggestions: SuggestionResponse[] = [];

    switch (field) {
      case "itemName":
        suggestions = await getItemNameSuggestions(query, limit);
        break;
      case "category":
        suggestions = await getCategorySuggestions(query, limit);
        break;
      case "batch":
        suggestions = await getBatchSuggestions(query, limit);
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid field parameter" } },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching suggestions",
        },
      },
      { status: 500 }
    );
  }
}

// Get item name suggestions based on historical data
async function getItemNameSuggestions(query: string, limit: number): Promise<SuggestionResponse[]> {
  const results = await prisma.inventoryItem.groupBy({
    by: ['itemName'],
    where: {
      itemName: {
        contains: query,
        mode: 'insensitive',
      },
    },
    _count: {
      itemName: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _count: {
        itemName: 'desc',
      },
    },
    take: limit,
  });

  return results.map(result => ({
    value: result.itemName,
    label: result.itemName,
    frequency: result._count.itemName,
    lastUsed: result._max.createdAt || new Date(),
  }));
}

// Get category suggestions based on historical data
async function getCategorySuggestions(query: string, limit: number): Promise<SuggestionResponse[]> {
  const results = await prisma.inventoryItem.groupBy({
    by: ['category'],
    where: {
      category: {
        not: null,
        contains: query,
        mode: 'insensitive',
      },
    },
    _count: {
      category: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _count: {
        category: 'desc',
      },
    },
    take: limit,
  });

  return results
    .filter(result => result.category !== null)
    .map(result => ({
      value: result.category!,
      label: result.category!,
      frequency: result._count.category,
      lastUsed: result._max.createdAt || new Date(),
    }));
}

// Get batch suggestions (recent batches for similar items)
async function getBatchSuggestions(query: string, limit: number): Promise<SuggestionResponse[]> {
  const results = await prisma.inventoryItem.groupBy({
    by: ['batch'],
    where: {
      batch: {
        contains: query,
        mode: 'insensitive',
      },
    },
    _count: {
      batch: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _max: {
        createdAt: 'desc',
      },
    },
    take: limit,
  });

  return results.map(result => ({
    value: result.batch,
    label: result.batch,
    frequency: result._count.batch,
    lastUsed: result._max.createdAt || new Date(),
  }));
}

// Export secured handler with rate limiting
export const GET = withSecurity(getHandler);