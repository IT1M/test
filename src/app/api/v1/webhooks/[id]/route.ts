import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookService } from '@/services/webhookService';
import { z } from 'zod';

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
  retryCount: z.number().int().min(0).max(5).optional(),
  timeout: z.number().int().min(1000).max(60000).optional(),
});

/**
 * PATCH /api/v1/webhooks/[id] - Update webhook
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
    const data = updateWebhookSchema.parse(body);

    const webhook = await webhookService.updateWebhook(params.id, session.user.id, data);

    return NextResponse.json({ data: webhook });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/webhooks/[id] - Delete webhook
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

    await webhookService.deleteWebhook(params.id, session.user.id);

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
