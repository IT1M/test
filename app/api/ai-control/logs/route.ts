import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual database queries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '50');

    // In production, this would fetch from database
    const mockLogs = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      model_name: ['Document Classifier', 'OCR Extractor', 'Medical NLP'][i % 3],
      model_version: ['2.1.0', '1.5.0', '3.0.1'][i % 3],
      operation_type: ['classify', 'extract', 'analyze'][i % 3],
      user_id: `user-${100 + i}`,
      input_hash: `sha256:${Math.random().toString(36).substring(7)}`,
      output_summary: 'Operation completed successfully',
      confidence_score: 0.75 + Math.random() * 0.2,
      execution_time: 100 + Math.floor(Math.random() * 400),
      status: i % 10 === 0 ? 'error' : 'success',
      sensitive_flag: false,
      cost_estimate: 0.001 + Math.random() * 0.005
    }));

    return NextResponse.json({
      logs: mockLogs,
      pagination: {
        total: 1523,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(1523 / pageSize),
        has_next: page < Math.ceil(1523 / pageSize),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
