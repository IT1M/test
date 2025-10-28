import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/apiAuth';
import { prisma } from '@/services/prisma';
import { z } from 'zod';

const createInventorySchema = z.object({
  itemName: z.string().min(1),
  batch: z.string().min(1),
  quantity: z.number().int().positive(),
  reject: z.number().int().min(0).default(0),
  destination: z.enum(['MAIS', 'FOZAN']),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  search: z.string().optional(),
  destination: z.enum(['MAIS', 'FOZAN']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/v1/inventory - List inventory items
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const { searchParams } = new URL(req.url);
        const query = querySchema.parse(Object.fromEntries(searchParams));

        const where: any = {};

        if (query.search) {
          where.OR = [
            { itemName: { contains: query.search, mode: 'insensitive' } },
            { batch: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        if (query.destination) {
          where.destination = query.destination;
        }

        if (query.category) {
          where.category = query.category;
        }

        if (query.startDate || query.endDate) {
          where.createdAt = {};
          if (query.startDate) {
            where.createdAt.gte = new Date(query.startDate);
          }
          if (query.endDate) {
            where.createdAt.lte = new Date(query.endDate);
          }
        }

        const [items, total] = await Promise.all([
          prisma.inventoryItem.findMany({
            where,
            include: {
              enteredBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.inventoryItem.count({ where }),
        ]);

        return NextResponse.json({
          data: items,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to fetch inventory items' },
          { status: 400 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'read' } }
  );
}

/**
 * POST /api/v1/inventory - Create inventory item
 */
export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const body = await req.json();
        const data = createInventorySchema.parse(body);

        const item = await prisma.inventoryItem.create({
          data: {
            ...data,
            enteredById: context.apiKey.user.id,
          },
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
            action: 'CREATE',
            entityType: 'InventoryItem',
            entityId: item.id,
            newValue: item,
          },
        });

        return NextResponse.json({ data: item }, { status: 201 });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: error.message || 'Failed to create inventory item' },
          { status: 400 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'write' } }
  );
}
