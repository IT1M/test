import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookService } from '@/services/webhookService';

/**
 * POST /api/v1/webhooks/[id]/test - Test webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await webhookService.testWebhook(params.id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook test successful',
      response: result.response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
