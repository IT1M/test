import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { z } from "zod";

// Validation schema for inventory item update
const InventoryItemUpdateSchema = z.object({
  itemName: z.string().min(2).max(100).trim().optional(),
  batch: z.string().min(3).max(50).regex(/^[A-Z0-9]+$/).optional(),
  quantity: z.number().int().positive().max(1000000).optional(),
  reject: z.number().int().min(0).optional(),
  destination: z.enum(["MAIS", "FOZAN"]).optional(),
  category: z.string().min(2).max(50).trim().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => {
    // If both quantity and reject are provided, validate reject <= quantity
    if (data.quantity !== undefined && data.reject !== undefined) {
      return data.reject <= data.quantity;
    }
    return true;
  },
  {
    message: "Reject quantity cannot exceed total quantity",
    path: ["reject"],
  }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Inventory item not found" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = InventoryItemUpdateSchema.safeParse(body);

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

    // Additional validation: if only reject is being updated, check against existing quantity
    if (data.reject !== undefined && data.quantity === undefined) {
      if (data.reject > existingItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Reject quantity cannot exceed total quantity",
            },
          },
          { status: 400 }
        );
      }
    }

    // Update inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data,
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
      action: "UPDATE",
      entityType: "InventoryItem",
      entityId: id,
      oldValue: existingItem,
      newValue: updatedItem,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while updating the inventory item",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - SUPERVISOR role or higher only
    const allowedRoles = ["SUPERVISOR", "MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTHORIZATION_ERROR",
            message: "Only SUPERVISOR role or higher can delete inventory items",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Inventory item not found" } },
        { status: 404 }
      );
    }

    // Delete inventory item
    await prisma.inventoryItem.delete({
      where: { id },
    });

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "InventoryItem",
      entityId: id,
      oldValue: existingItem,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the inventory item",
        },
      },
      { status: 500 }
    );
  }
}
