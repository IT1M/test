import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookService } from '@/services/webhookService';
import { prisma } from '@/services/prisma';

/**
 * GET /api/v1/webhooks/[id]/logs - Get webhook logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify webhook belongs to user
    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id, userId: session.user.id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await webhookService.getWebhookLogs(params.id, limit);

    return NextResponse.json({ data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}
