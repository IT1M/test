import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  query: z.string().min(1).max(1000),
  filters: z.record(z.any()),
  isShared: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  sharedUserIds: z.array(z.string()).optional()
});

const updateSavedSearchSchema = createSavedSearchSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeShared = searchParams.get('includeShared') === 'true';
    const includePublic = searchParams.get('includePublic') === 'true';

    // Get user's own saved searches
    const ownSearches = await prisma.savedSearch.findMany({
      where: {
        createdById: session.user.id
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
        },
        _count: {
          select: {
            sharedWith: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    let sharedSearches: any[] = [];
    let publicSearches: any[] = [];

    // Get searches shared with the user
    if (includeShared) {
      sharedSearches = await prisma.savedSearch.findMany({
        where: {
          sharedWith: {
            some: {
              userId: session.user.id
            }
          }
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
            where: {
              userId: session.user.id
            },
            select: {
              canEdit: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    // Get public searches (excluding user's own)
    if (includePublic) {
      publicSearches = await prisma.savedSearch.findMany({
        where: {
          isPublic: true,
          createdById: {
            not: session.user.id
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 20 // Limit public searches
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        own: ownSearches,
        shared: sharedSearches,
        public: publicSearches
      }
    });

  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch saved searches',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSavedSearchSchema.parse(body);

    // Check if name already exists for this user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        name: validatedData.name,
        createdById: session.user.id
      }
    });

    if (existingSearch) {
      return NextResponse.json(
        { success: false, error: { message: 'A saved search with this name already exists' } },
        { status: 400 }
      );
    }

    // Create the saved search
    const savedSearch = await prisma.savedSearch.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        query: validatedData.query,
        filters: validatedData.filters,
        isShared: validatedData.isShared,
        isPublic: validatedData.isPublic,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Share with specified users if provided
    if (validatedData.isShared && validatedData.sharedUserIds?.length) {
      await prisma.savedSearchShare.createMany({
        data: validatedData.sharedUserIds.map(userId => ({
          savedSearchId: savedSearch.id,
          userId,
          canEdit: false
        }))
      });
    }

    return NextResponse.json({
      success: true,
      data: savedSearch
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    console.error('Create saved search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to create saved search',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}