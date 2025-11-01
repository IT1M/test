import { NextRequest, NextResponse } from 'next/server';
import { AIActivityLogger, ActivityLogFilter } from '@/services/ai/activity-logger';

/**
 * GET /api/ai-control/metrics
 * Get performance metrics and analytics for AI operations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const filter: ActivityLogFilter = {};

    // Date range filters
    const startDate = searchParams.get('start_date');
    if (startDate) {
      filter.startDate = new Date(startDate);
    } else {
      // Default to last 24 hours
      filter.startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      filter.endDate = new Date(endDate);
    }

    const modelName = searchParams.get('model_name');
    if (modelName) {
      filter.modelName = modelName;
    }

    const operationType = searchParams.get('operation_type');
    if (operationType) {
      filter.operationType = operationType;
    }

    // Get analytics
    const analytics = await AIActivityLogger.getActivityAnalytics(filter);

    // Get anomalous activity
    const lookbackHours = parseInt(searchParams.get('lookback_hours') || '24');
    const anomalies = await AIActivityLogger.detectAnomalousActivity(lookbackHours);

    return NextResponse.json({
      success: true,
      metrics: {
        total_operations: analytics.totalOperations,
        success_rate: analytics.successRate,
        error_rate: analytics.errorRate,
        average_confidence: analytics.averageConfidence,
        average_execution_time: analytics.averageExecutionTime,
        total_cost: analytics.totalCost,
      },
      breakdown: {
        by_operation_type: analytics.operationsByType,
        by_model: analytics.operationsByModel,
        confidence_distribution: analytics.confidenceDistribution,
      },
      errors: {
        top_errors: analytics.topErrors,
      },
      usage_patterns: {
        peak_usage_hours: analytics.peakUsageHours,
      },
      anomalies: anomalies.map(anomaly => ({
        id: anomaly.id,
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        affected_logs_count: anomaly.affectedLogs.length,
        detected_at: anomaly.detectedAt.toISOString(),
        recommendation: anomaly.recommendation,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
