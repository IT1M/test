import { NextRequest, NextResponse } from 'next/server';
import { AIActivityLogger, ActivityLogFilter } from '@/services/ai/activity-logger';

/**
 * GET /api/ai-control/logs
 * Get AI activity logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '50');
    const offset = (page - 1) * pageSize;

    // Parse filter parameters
    const filter: ActivityLogFilter = {
      limit: pageSize,
      offset,
    };

    // Date range filters
    const startDate = searchParams.get('start_date');
    if (startDate) {
      filter.startDate = new Date(startDate);
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      filter.endDate = new Date(endDate);
    }

    // Model and operation filters
    const modelName = searchParams.get('model_name');
    if (modelName) {
      filter.modelName = modelName;
    }

    const operationType = searchParams.get('operation_type');
    if (operationType) {
      filter.operationType = operationType;
    }

    const userId = searchParams.get('user_id');
    if (userId) {
      filter.userId = userId;
    }

    const status = searchParams.get('status');
    if (status && ['success', 'error', 'timeout', 'rate-limited'].includes(status)) {
      filter.status = status as any;
    }

    // Confidence range filters
    const minConfidence = searchParams.get('min_confidence');
    if (minConfidence) {
      filter.minConfidence = parseFloat(minConfidence);
    }

    const maxConfidence = searchParams.get('max_confidence');
    if (maxConfidence) {
      filter.maxConfidence = parseFloat(maxConfidence);
    }

    // Entity filters
    const entityType = searchParams.get('entity_type');
    if (entityType) {
      filter.entityType = entityType;
    }

    const entityId = searchParams.get('entity_id');
    if (entityId) {
      filter.entityId = entityId;
    }

    // Fetch logs
    const logs = await AIActivityLogger.getActivityLogs(filter);
    
    // Get total count for pagination
    const totalCount = await AIActivityLogger.getLogCount(filter.startDate, filter.endDate);

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        model_name: log.modelName,
        model_version: log.modelVersion,
        operation_type: log.operationType,
        operation_description: log.operationDescription,
        user_id: log.userId,
        confidence_score: log.confidenceScore,
        execution_time: log.executionTime,
        status: log.status,
        error_message: log.errorMessage,
        error_code: log.errorCode,
        entity_type: log.entityType,
        entity_id: log.entityId,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
        cost_estimate: log.estimatedCost,
        metadata: log.metadata,
      })),
      pagination: {
        total: totalCount,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(totalCount / pageSize),
        has_next: page < Math.ceil(totalCount / pageSize),
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
