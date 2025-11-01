import { NextRequest } from 'next/server';
import { db } from '@/lib/db/schema';
import { AlertManager } from '@/services/ai/alert-manager';

/**
 * GET /api/ai-control/live
 * Server-Sent Events (SSE) endpoint for real-time AI Control Center updates
 * 
 * This endpoint provides real-time streaming of:
 * - New activity logs
 * - Alert notifications
 * - System status changes
 * - Performance metrics
 */
export async function GET(request: NextRequest) {
  // Set up SSE headers
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to AI Control Center live feed',
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

      // Track last seen IDs to avoid duplicates
      let lastLogId: string | null = null;
      let lastAlertId: string | null = null;

      // Polling interval (every 2 seconds)
      const intervalId = setInterval(async () => {
        try {
          // Get recent activity logs (last 10 seconds)
          const tenSecondsAgo = new Date(Date.now() - 10000);
          const recentLogs = await db.aiActivityLogs
            .where('timestamp')
            .above(tenSecondsAgo)
            .toArray();

          // Filter out logs we've already sent
          const newLogs = lastLogId 
            ? recentLogs.filter(log => log.id > lastLogId!)
            : recentLogs;

          if (newLogs.length > 0) {
            // Update last seen ID
            lastLogId = newLogs[newLogs.length - 1].id;

            // Send new logs
            const logsMessage = {
              type: 'activity_logs',
              timestamp: new Date().toISOString(),
              data: newLogs.map(log => ({
                id: log.id,
                timestamp: log.timestamp.toISOString(),
                model_name: log.modelName,
                operation_type: log.operationType,
                status: log.status,
                execution_time: log.executionTime,
                confidence_score: log.confidenceScore,
                cost: log.estimatedCost,
              })),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(logsMessage)}\n\n`));
          }

          // Get recent alerts
          const recentAlerts = await AlertManager.getActiveAlerts();
          
          // Filter out alerts we've already sent
          const newAlerts = lastAlertId
            ? recentAlerts.filter(alert => alert.alertId > lastAlertId!)
            : recentAlerts.slice(0, 5); // Send last 5 on initial connection

          if (newAlerts.length > 0) {
            // Update last seen ID
            lastAlertId = newAlerts[newAlerts.length - 1].alertId;

            // Send new alerts
            const alertsMessage = {
              type: 'alerts',
              timestamp: new Date().toISOString(),
              data: newAlerts.map(alert => ({
                id: alert.alertId,
                alert_type: alert.alertType,
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                model_name: alert.modelName,
                created_at: alert.createdAt.toISOString(),
              })),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(alertsMessage)}\n\n`));
          }

          // Send periodic status updates (every 10 seconds)
          if (Date.now() % 10000 < 2000) {
            const statusMessage = {
              type: 'status_update',
              timestamp: new Date().toISOString(),
              data: {
                active_operations: recentLogs.length,
                active_alerts: recentAlerts.length,
                critical_alerts: recentAlerts.filter(a => a.severity === 'critical').length,
              },
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(statusMessage)}\n\n`));
          }

          // Send heartbeat to keep connection alive
          const heartbeat = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));

        } catch (error) {
          console.error('Error in live feed:', error);
          const errorMessage = {
            type: 'error',
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : 'Unknown error',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
        }
      }, 2000);

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

/**
 * POST /api/ai-control/live
 * Send a test event to the live feed (for testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This could be used to trigger manual events or test the live feed
    // For now, just acknowledge the request
    
    return Response.json({
      success: true,
      message: 'Test event acknowledged',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling live feed POST:', error);
    return Response.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
