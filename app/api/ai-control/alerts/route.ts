import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual database queries
export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from database/monitoring service
    const mockAlerts = [
      {
        id: 'alert-001',
        type: 'performance' as const,
        severity: 'warning' as const,
        title: 'High response time detected',
        description: 'Medical NLP model response time exceeded 500ms threshold',
        model_name: 'medical-nlp-v3',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        acknowledged: false
      },
      {
        id: 'alert-002',
        type: 'cost' as const,
        severity: 'info' as const,
        title: 'Budget threshold approaching',
        description: 'Daily budget usage at 75% ($37.50 of $50.00)',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        acknowledged: false
      },
      {
        id: 'alert-003',
        type: 'error' as const,
        severity: 'critical' as const,
        title: 'Elevated error rate',
        description: 'OCR Extractor error rate increased to 8% (threshold: 5%)',
        model_name: 'ocr-extractor-v1',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'active',
        acknowledged: false
      }
    ];

    return NextResponse.json({
      alerts: mockAlerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
