import { NextRequest, NextResponse } from 'next/server';
import { AlertManager } from '@/services/ai/alert-manager';

/**
 * GET /api/ai-control/alerts
 * Get active alerts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alert_type');
    const modelName = searchParams.get('model_name');
    const status = searchParams.get('status');

    let alerts;

    if (status === 'all') {
      // Get all alerts (history)
      alerts = await AlertManager.getAlertHistory({
        severity: severity as any,
        alertType: alertType as any,
        modelName: modelName || undefined,
        limit: 100,
      });
    } else {
      // Get active alerts only
      alerts = await AlertManager.getActiveAlerts({
        severity: severity as any,
        alertType: alertType as any,
        modelName: modelName || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      alerts: alerts.map(alert => ({
        id: alert.alertId,
        alert_type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        model_name: alert.modelName,
        status: alert.status,
        acknowledged: alert.status === 'acknowledged',
        acknowledged_by: alert.acknowledgedBy,
        acknowledged_at: alert.acknowledgedAt?.toISOString(),
        resolved_by: alert.resolvedBy,
        resolved_at: alert.resolvedAt?.toISOString(),
        resolution_notes: alert.resolutionNotes,
        created_at: alert.createdAt.toISOString(),
        updated_at: alert.updatedAt.toISOString(),
        affected_operations: alert.affectedOperations,
        metadata: alert.metadata,
      })),
      total: alerts.length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-control/alerts
 * Acknowledge or resolve an alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.alert_id || !body.action) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'alert_id and action are required'
        },
        { status: 400 }
      );
    }

    const userId = body.user_id || 'system';
    const userName = body.user_name || 'System User';

    switch (body.action) {
      case 'acknowledge':
        await AlertManager.acknowledgeAlert(body.alert_id, userId, userName);
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged successfully',
        });

      case 'resolve':
        await AlertManager.resolveAlert(
          body.alert_id,
          userId,
          userName,
          body.resolution_notes
        );
        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully',
        });

      case 'snooze':
        const snoozeDuration = body.snooze_duration || 60; // Default 60 minutes
        await AlertManager.snoozeAlert(body.alert_id, userId, userName, snoozeDuration);
        return NextResponse.json({
          success: true,
          message: `Alert snoozed for ${snoozeDuration} minutes`,
        });

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid action',
            message: 'Action must be one of: acknowledge, resolve, snooze'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing alert:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to manage alert',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
