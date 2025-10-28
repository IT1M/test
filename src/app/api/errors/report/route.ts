import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

/**
 * Error Reporting Endpoint
 * Receives and stores error reports from the frontend
 */

export async function POST(request: Request) {
  try {
    const errorReport = await request.json();
    
    // Validate error report
    if (!errorReport.message || !errorReport.fingerprint) {
      return NextResponse.json(
        { error: 'Invalid error report' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store in database
    // 2. Send to error tracking service (Sentry, Rollbar, etc.)
    // 3. Alert team if critical
    // 4. Aggregate similar errors

    // For now, just log
    console.error('[Error Report]', {
      message: errorReport.message,
      level: errorReport.level,
      fingerprint: errorReport.fingerprint,
      timestamp: errorReport.context.timestamp,
    });

    // Store in database (example)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'ERROR_REPORTED',
          details: errorReport,
          timestamp: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to store error in database:', dbError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get recent errors from database
    const recentErrors = await prisma.auditLog.findMany({
      where: {
        action: 'ERROR_REPORTED',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    // Group by fingerprint
    const errorGroups = new Map<string, any[]>();
    
    recentErrors.forEach(log => {
      const details = log.details as any;
      const fingerprint = details.fingerprint || 'unknown';
      
      if (!errorGroups.has(fingerprint)) {
        errorGroups.set(fingerprint, []);
      }
      
      errorGroups.get(fingerprint)!.push({
        id: log.id,
        message: details.message,
        level: details.level,
        timestamp: log.timestamp,
        context: details.context,
      });
    });

    // Convert to array with counts
    const grouped = Array.from(errorGroups.entries()).map(([fingerprint, errors]) => ({
      fingerprint,
      count: errors.length,
      lastOccurrence: errors[0].timestamp,
      firstOccurrence: errors[errors.length - 1].timestamp,
      sample: errors[0],
    }));

    // Sort by count (most frequent first)
    grouped.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total: recentErrors.length,
      groups: grouped,
    });
  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error reports' },
      { status: 500 }
    );
  }
}
