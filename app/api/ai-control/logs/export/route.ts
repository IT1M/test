import { NextRequest, NextResponse } from 'next/server';
import { AIActivityLogger, ActivityLogFilter, ExportFormat } from '@/services/ai/activity-logger';

/**
 * POST /api/ai-control/logs/export
 * Export AI activity logs in specified format
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse export format
    const format: ExportFormat = body.format || 'csv';
    
    if (!['csv', 'json', 'excel'].includes(format)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid export format',
          message: 'Format must be one of: csv, json, excel'
        },
        { status: 400 }
      );
    }

    // Parse filter parameters
    const filter: ActivityLogFilter = {};

    if (body.start_date) {
      filter.startDate = new Date(body.start_date);
    }

    if (body.end_date) {
      filter.endDate = new Date(body.end_date);
    }

    if (body.model_name) {
      filter.modelName = body.model_name;
    }

    if (body.operation_type) {
      filter.operationType = body.operation_type;
    }

    if (body.user_id) {
      filter.userId = body.user_id;
    }

    if (body.status) {
      filter.status = body.status;
    }

    if (body.min_confidence !== undefined) {
      filter.minConfidence = body.min_confidence;
    }

    if (body.max_confidence !== undefined) {
      filter.maxConfidence = body.max_confidence;
    }

    if (body.entity_type) {
      filter.entityType = body.entity_type;
    }

    if (body.entity_id) {
      filter.entityId = body.entity_id;
    }

    // Export logs
    const exportData = await AIActivityLogger.exportActivityLogs(filter, format);

    // Set appropriate content type and filename
    let contentType: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        filename = `ai-activity-logs-${timestamp}.csv`;
        break;
      case 'json':
        contentType = 'application/json';
        filename = `ai-activity-logs-${timestamp}.json`;
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `ai-activity-logs-${timestamp}.xlsx`;
        break;
      default:
        contentType = 'text/plain';
        filename = `ai-activity-logs-${timestamp}.txt`;
    }

    // Return file as download
    if (exportData instanceof Blob) {
      // For Excel format
      const buffer = await exportData.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // For CSV and JSON formats
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting AI logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
