import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiKeyService } from '@/services/apiKeyManagement';
import { z } from 'zod';

const updateApiKeySchema = z.object({
  name: z.string().min(1).optional(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.enum(['read', 'write', 'delete'])),
    })
  ).optional(),
  rateLimit: z.number().int().positive().optional(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

/**
 * PATCH /api/v1/api-keys/[id] - Update API key
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateApiKeySchema.parse(body);

    const apiKey = await apiKeyService.updateApiKey(params.id, session.user.id, data);

    return NextResponse.json({ data: apiKey });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/api-keys/[id] - Delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await apiKeyService.deleteApiKey(params.id, session.user.id);

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
