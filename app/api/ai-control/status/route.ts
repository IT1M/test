import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/schema';
import { AIControlConfigManager } from '@/services/ai/ai-control-config';
import { AlertManager } from '@/services/ai/alert-manager';

/**
 * GET /api/ai-control/status
 * Get comprehensive AI Control Center dashboard status
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get logs for different time periods
    const logsLast24h = await db.aiActivityLogs
      .where('timestamp')
      .above(oneDayAgo)
      .toArray();

    const logsLast7d = await db.aiActivityLogs
      .where('timestamp')
      .above(sevenDaysAgo)
      .toArray();

    const logsToday = await db.aiActivityLogs
      .where('timestamp')
      .above(startOfToday)
      .toArray();

    // Calculate model-specific metrics
    const modelStats = new Map<string, {
      modelName: string;
      version?: string;
      callsToday: number;
      avgResponseTime: number;
      errorRate: number;
      avgConfidence: number;
      lastCall?: Date;
      costToday: number;
    }>();

    logsToday.forEach(log => {
      const key = log.modelName;
      if (!modelStats.has(key)) {
        modelStats.set(key, {
          modelName: log.modelName,
          version: log.modelVersion,
          callsToday: 0,
          avgResponseTime: 0,
          errorRate: 0,
          avgConfidence: 0,
          costToday: 0,
        });
      }

      const stats = modelStats.get(key)!;
      stats.callsToday++;
      stats.avgResponseTime += log.executionTime;
      if (log.status === 'error') {
        stats.errorRate++;
      }
      if (log.confidenceScore !== undefined) {
        stats.avgConfidence += log.confidenceScore;
      }
      if (!stats.lastCall || log.timestamp > stats.lastCall) {
        stats.lastCall = log.timestamp;
      }
      stats.costToday += log.estimatedCost || 0;
    });

    // Calculate averages and determine health status
    const models = Array.from(modelStats.values()).map(stats => {
      const avgResponseTime = stats.callsToday > 0 ? stats.avgResponseTime / stats.callsToday : 0;
      const errorRate = stats.callsToday > 0 ? stats.errorRate / stats.callsToday : 0;
      const avgConfidence = stats.callsToday > 0 ? stats.avgConfidence / stats.callsToday : 0;

      // Determine health status
      let health: 'healthy' | 'warning' | 'critical' = 'healthy';
      const config = AIControlConfigManager.getConfig();
      const thresholds = config.performanceThresholds;

      if (errorRate > thresholds.maxErrorRate / 100) {
        health = 'critical';
      } else if (avgResponseTime > thresholds.maxResponseTime || avgConfidence < thresholds.minConfidenceScore) {
        health = 'warning';
      }

      return {
        model_id: stats.modelName.toLowerCase().replace(/\s+/g, '-'),
        model_name: stats.modelName,
        version: stats.version || '1.0.0',
        status: 'active' as const,
        health,
        avg_response_ms: Math.round(avgResponseTime),
        error_rate: errorRate,
        avg_confidence: avgConfidence / 100, // Convert to 0-1 scale
        last_call: stats.lastCall?.toISOString(),
        calls_today: stats.callsToday,
        cost_today: stats.costToday,
      };
    });

    // Calculate aggregate metrics
    const totalCalls24h = logsLast24h.length;
    const totalCalls7d = logsLast7d.length;
    
    const logsWithConfidence = logsLast24h.filter(log => log.confidenceScore !== undefined);
    const avgConfidence = logsWithConfidence.length > 0
      ? logsWithConfidence.reduce((sum, log) => sum + (log.confidenceScore || 0), 0) / logsWithConfidence.length / 100
      : 0;

    const totalCostToday = logsToday.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
    
    const errorCount24h = logsLast24h.filter(log => log.status === 'error').length;
    const errorRate = totalCalls24h > 0 ? errorCount24h / totalCalls24h : 0;

    const activeModels = new Set(logsToday.map(log => log.modelName)).size;

    // Get active alerts
    const activeAlerts = await AlertManager.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;

    // Determine overall system health
    let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (criticalAlerts > 0 || errorRate > 0.2) {
      systemHealth = 'unhealthy';
    } else if (models.some(m => m.health === 'warning') || errorRate > 0.1) {
      systemHealth = 'degraded';
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      systemHealth,
      models,
      aggregates: {
        total_calls_24h: totalCalls24h,
        total_calls_7d: totalCalls7d,
        avg_confidence: avgConfidence,
        total_cost_today: totalCostToday,
        active_models: activeModels,
        error_rate: errorRate,
      },
      alerts: {
        active_count: activeAlerts.length,
        critical_count: criticalAlerts,
      },
    });
  } catch (error) {
    console.error('Error fetching AI control status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
