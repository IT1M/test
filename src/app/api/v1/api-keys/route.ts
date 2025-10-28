import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiKeyService } from '@/services/apiKeyManagement';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.enum(['read', 'write', 'delete'])),
    })
  ),
  rateLimit: z.number().int().positive().optional(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

/**
 * GET /api/v1/api-keys - List user's API keys
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await apiKeyService.listApiKeys(session.user.id);

    // Mask API keys (show only last 8 characters)
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: `sk_live_...${key.key.slice(-8)}`,
    }));

    return NextResponse.json({ data: maskedKeys });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/api-keys - Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createApiKeySchema.parse(body);

    const apiKey = await apiKeyService.createApiKey({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        data: apiKey,
        message: 'API key created successfully. Make sure to save it securely as it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}
