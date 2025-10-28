import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookService, WEBHOOK_EVENTS } from '@/services/webhookService';
import { z } from 'zod';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  retryCount: z.number().int().min(0).max(5).optional(),
  timeout: z.number().int().min(1000).max(60000).optional(),
});

/**
 * GET /api/v1/webhooks - List webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await webhookService.listWebhooks(session.user.id);

    return NextResponse.json({
      data: webhooks,
      availableEvents: Object.values(WEBHOOK_EVENTS),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/webhooks - Create webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = data.events.filter(e => !validEvents.includes(e as any));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const webhook = await webhookService.createWebhook({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        data: webhook,
        message: 'Webhook created successfully. Save the secret securely.',
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
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
