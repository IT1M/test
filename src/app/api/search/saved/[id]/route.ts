import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  query: z.string().min(1).max(1000).optional(),
  filters: z.record(z.any()).optional(),
  isShared: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sharedUserIds: z.array(z.string()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.user.id },
          { isPublic: true },
          {
            sharedWith: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!savedSearch) {
      return NextResponse.json(
        { success: false, error: { message: 'Saved search not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: savedSearch
    });

  } catch (error) {
    console.error('Get saved search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch saved search',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateSavedSearchSchema.parse(body);

    // Check if user owns the search or has edit permission
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.user.id },
          {
            sharedWith: {
              some: {
                userId: session.user.id,
                canEdit: true
              }
            }
          }
        ]
      },
      include: {
        sharedWith: true
      }
    });

    if (!existingSearch) {
      return NextResponse.json(
        { success: false, error: { message: 'Saved search not found or no edit permission' } },
        { status: 404 }
      );
    }

    // Check for name conflicts if name is being changed
    if (validatedData.name && validatedData.name !== existingSearch.name) {
      const nameConflict = await prisma.savedSearch.findFirst({
        where: {
          name: validatedData.name,
          createdById: existingSearch.createdById,
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: { message: 'A saved search with this name already exists' } },
          { status: 400 }
        );
      }
    }

    // Update the saved search
    const updatedSearch = await prisma.savedSearch.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.query && { query: validatedData.query }),
        ...(validatedData.filters && { filters: validatedData.filters }),
        ...(validatedData.isShared !== undefined && { isShared: validatedData.isShared }),
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Update sharing if provided and user is owner
    if (validatedData.sharedUserIds && existingSearch.createdById === session.user.id) {
      // Remove existing shares
      await prisma.savedSearchShare.deleteMany({
        where: { savedSearchId: params.id }
      });

      // Add new shares
      if (validatedData.sharedUserIds.length > 0) {
        await prisma.savedSearchShare.createMany({
          data: validatedData.sharedUserIds.map(userId => ({
            savedSearchId: params.id,
            userId,
            canEdit: false
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSearch
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    console.error('Update saved search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to update saved search',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if user owns the search
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        createdById: session.user.id
      }
    });

    if (!existingSearch) {
      return NextResponse.json(
        { success: false, error: { message: 'Saved search not found or no delete permission' } },
        { status: 404 }
      );
    }

    // Delete the saved search (shares will be deleted via cascade)
    await prisma.savedSearch.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully'
    });

  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to delete saved search',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}