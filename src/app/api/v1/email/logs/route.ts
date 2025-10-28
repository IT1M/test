import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/services/emailService';
import { EmailStatus } from '@prisma/client';
import { z } from 'zod';

const logsQuerySchema = z.object({
  status: z.nativeEnum(EmailStatus).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
});

/**
 * GET /api/v1/email/logs - Get email logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = logsQuerySchema.parse(Object.fromEntries(searchParams));

    const logs = await emailService.getEmailLogs(query);

    return NextResponse.json({ data: logs });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
