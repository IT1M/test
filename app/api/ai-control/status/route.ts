import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual database queries
export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from database/monitoring service
    const mockStatus = {
      timestamp: new Date().toISOString(),
      systemHealth: 'healthy' as const,
      models: [
        {
          model_id: 'doc-classifier-v2',
          model_name: 'Document Classifier',
          version: '2.1.0',
          status: 'active' as const,
          health: 'healthy' as const,
          avg_response_ms: 120,
          error_rate: 0.02,
          avg_confidence: 0.87,
          last_call: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          calls_today: 1247,
          cost_today: 2.45
        },
        {
          model_id: 'ocr-extractor-v1',
          model_name: 'OCR Extractor',
          version: '1.5.0',
          status: 'active' as const,
          health: 'healthy' as const,
          avg_response_ms: 340,
          error_rate: 0.05,
          avg_confidence: 0.82,
          last_call: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          calls_today: 892,
          cost_today: 3.21
        },
        {
          model_id: 'medical-nlp-v3',
          model_name: 'Medical NLP',
          version: '3.0.1',
          status: 'active' as const,
          health: 'warning' as const,
          avg_response_ms: 890,
          error_rate: 0.08,
          avg_confidence: 0.71,
          last_call: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          calls_today: 456,
          cost_today: 1.89
        }
      ],
      aggregates: {
        total_calls_24h: 5432,
        total_calls_7d: 38901,
        avg_confidence: 0.84,
        total_cost_today: 12.45,
        active_models: 5,
        error_rate: 0.03
      }
    };

    return NextResponse.json(mockStatus);
  } catch (error) {
    console.error('Error fetching AI control status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}
