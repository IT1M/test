import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { withSecurity } from "@/middleware/security";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema for inventory item creation
const InventoryItemSchema = z.object({
  itemName: z.string().min(2, "Item name must be at least 2 characters").max(100, "Item name must not exceed 100 characters").trim(),
  batch: z.string().min(3, "Batch number must be at least 3 characters").max(50, "Batch number must not exceed 50 characters").regex(/^[A-Z0-9]+$/, "Batch number must contain only uppercase letters and numbers"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be positive").max(1000000, "Quantity must not exceed 1,000,000"),
  reject: z.number().int("Reject quantity must be an integer").min(0, "Reject quantity cannot be negative"),
  destination: z.enum(["MAIS", "FOZAN"], { message: "Destination must be either MAIS or FOZAN" }),
  category: z.string().min(2).max(50).trim().optional(),
  notes: z.string().max(500, "Notes must not exceed 500 characters").optional(),
}).refine(data => data.reject <= data.quantity, {
  message: "Reject quantity cannot exceed total quantity",
  path: ["reject"],
});

// GET handler for listing inventory items with filtering, search, and pagination
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const destinations = searchParams.get("destinations")?.split(",").filter(Boolean) || [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause for filtering
    const where: Prisma.InventoryItemWhereInput = {};

    // Search filter (item name or batch)
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: "insensitive" } },
        { batch: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Destination filter
    if (destinations.length > 0) {
      where.destination = { in: destinations as ("MAIS" | "FOZAN")[] };
    }

    // Category filter
    if (categories.length > 0) {
      where.category = { in: categories };
    }

    // Build orderBy clause
    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = {};
    if (sortBy === "itemName") {
      orderBy.itemName = sortOrder as "asc" | "desc";
    } else if (sortBy === "batch") {
      orderBy.batch = sortOrder as "asc" | "desc";
    } else if (sortBy === "quantity") {
      orderBy.quantity = sortOrder as "asc" | "desc";
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder as "asc" | "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch data with pagination
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          enteredBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Calculate pagination metadata
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching inventory items",
        },
      },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - DATA_ENTRY role or higher
    const allowedRoles = ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = InventoryItemSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        itemName: data.itemName,
        batch: data.batch,
        quantity: data.quantity,
        reject: data.reject,
        destination: data.destination,
        category: data.category,
        notes: data.notes,
        enteredById: session.user.id,
      },
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "InventoryItem",
      entityId: inventoryItem.id,
      newValue: inventoryItem,
      ipAddress,
      userAgent,
    });

    // Check for high reject rate and create notification if needed
    const { checkHighRejectRate } = await import("@/utils/notifications");
    await checkHighRejectRate({
      id: inventoryItem.id,
      itemName: inventoryItem.itemName,
      batch: inventoryItem.batch,
      quantity: inventoryItem.quantity,
      reject: inventoryItem.reject,
    }).catch((error) => {
      console.error("Error checking reject rate:", error);
      // Don't fail the request if notification fails
    });

    return NextResponse.json(
      {
        success: true,
        data: inventoryItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while creating the inventory item",
        },
      },
      { status: 500 }
    );
  }
}

// Export secured handlers with rate limiting and sanitization
export const GET = withSecurity(getHandler);
export const POST = withSecurity(postHandler);
