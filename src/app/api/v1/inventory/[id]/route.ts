import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/apiAuth';
import { prisma } from '@/services/prisma';
import { z } from 'zod';

const updateInventorySchema = z.object({
  itemName: z.string().min(1).optional(),
  batch: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  reject: z.number().int().min(0).optional(),
  destination: z.enum(['MAIS', 'FOZAN']).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/v1/inventory/[id] - Get single inventory item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const item = await prisma.inventoryItem.findUnique({
          where: { id: params.id },
          include: {
            enteredBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!item) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ data: item });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to fetch inventory item' },
          { status: 400 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'read' } }
  );
}

/**
 * PATCH /api/v1/inventory/[id] - Update inventory item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const body = await req.json();
        const data = updateInventorySchema.parse(body);

        const oldItem = await prisma.inventoryItem.findUnique({
          where: { id: params.id },
        });

        if (!oldItem) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          );
        }

        const item = await prisma.inventoryItem.update({
          where: { id: params.id },
          data,
          include: {
            enteredBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: context.apiKey.user.id,
            action: 'UPDATE',
            entityType: 'InventoryItem',
            entityId: item.id,
            oldValue: oldItem,
            newValue: item,
          },
        });

        return NextResponse.json({ data: item });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: error.message || 'Failed to update inventory item' },
          { status: 400 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'write' } }
  );
}

/**
 * DELETE /api/v1/inventory/[id] - Delete inventory item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const item = await prisma.inventoryItem.findUnique({
          where: { id: params.id },
        });

        if (!item) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          );
        }

        await prisma.inventoryItem.delete({
          where: { id: params.id },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: context.apiKey.user.id,
            action: 'DELETE',
            entityType: 'InventoryItem',
            entityId: item.id,
            oldValue: item,
          },
        });

        return NextResponse.json({ message: 'Inventory item deleted successfully' });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to delete inventory item' },
          { status: 400 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'delete' } }
  );
}
