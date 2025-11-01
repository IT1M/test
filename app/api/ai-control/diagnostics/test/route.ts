import { NextRequest, NextResponse } from 'next/server';
import { AIControlConfigManager } from '@/services/ai/ai-control-config';
import { db } from '@/lib/db/schema';

/**
 * POST /api/ai-control/diagnostics/test
 * Run health checks and diagnostics on AI Control Center
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testType = body.test_type || 'all';

    const results: any = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      tests: {},
    };

    // Test 1: Configuration Check
    if (testType === 'all' || testType === 'config') {
      try {
        const config = await AIControlConfigManager.loadConfig();
        results.tests.configuration = {
          status: 'passed',
          message: 'Configuration loaded successfully',
          details: {
            logging_enabled: config.enableActivityLogging,
            rate_limiting_enabled: config.enableRateLimiting,
            cost_tracking_enabled: config.enableCostTracking,
          },
        };
      } catch (error) {
        results.tests.configuration = {
          status: 'failed',
          message: 'Failed to load configuration',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.overall_status = 'unhealthy';
      }
    }

    // Test 2: Database Connectivity
    if (testType === 'all' || testType === 'database') {
      try {
        // Test database read
        const logCount = await db.aiActivityLogs.count();
        const alertCount = await db.aiAlerts.count();
        
        // Test database write
        const testLog = {
          id: `test-${Date.now()}`,
          timestamp: new Date(),
          userId: 'system',
          modelName: 'diagnostics',
          operationType: 'other' as const,
          inputData: 'test',
          outputData: 'test',
          executionTime: 0,
          status: 'success' as const,
          createdAt: new Date(),
        };
        
        await db.aiActivityLogs.add(testLog);
        await db.aiActivityLogs.delete(testLog.id);

        results.tests.database = {
          status: 'passed',
          message: 'Database connectivity verified',
          details: {
            activity_logs_count: logCount,
            alerts_count: alertCount,
            read_test: 'passed',
            write_test: 'passed',
          },
        };
      } catch (error) {
        results.tests.database = {
          status: 'failed',
          message: 'Database connectivity issues',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.overall_status = 'unhealthy';
      }
    }

    // Test 3: API Key Validation
    if (testType === 'all' || testType === 'api_key') {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        
        if (!apiKey) {
          results.tests.api_key = {
            status: 'failed',
            message: 'Gemini API key not configured',
          };
          results.overall_status = 'degraded';
        } else {
          // Basic validation (check format)
          const isValidFormat = apiKey.length > 20 && apiKey.startsWith('AIzaSy');
          
          results.tests.api_key = {
            status: isValidFormat ? 'passed' : 'warning',
            message: isValidFormat 
              ? 'API key format is valid' 
              : 'API key format may be invalid',
            details: {
              key_length: apiKey.length,
              key_prefix: apiKey.substring(0, 6) + '...',
            },
          };

          if (!isValidFormat) {
            results.overall_status = 'degraded';
          }
        }
      } catch (error) {
        results.tests.api_key = {
          status: 'failed',
          message: 'Failed to validate API key',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.overall_status = 'unhealthy';
      }
    }

    // Test 4: Rate Limiting Check
    if (testType === 'all' || testType === 'rate_limit') {
      try {
        const config = AIControlConfigManager.getConfig();
        const rateLimit = config.rateLimitPerMinute;
        
        // Check recent activity
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentLogs = await db.aiActivityLogs
          .where('timestamp')
          .above(oneMinuteAgo)
          .count();

        const utilizationPercent = (recentLogs / rateLimit) * 100;

        results.tests.rate_limiting = {
          status: utilizationPercent < 80 ? 'passed' : 'warning',
          message: `Rate limit utilization: ${utilizationPercent.toFixed(1)}%`,
          details: {
            rate_limit: rateLimit,
            current_usage: recentLogs,
            utilization_percent: utilizationPercent,
          },
        };

        if (utilizationPercent >= 80) {
          results.overall_status = 'degraded';
        }
      } catch (error) {
        results.tests.rate_limiting = {
          status: 'failed',
          message: 'Failed to check rate limiting',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test 5: Cost Tracking Check
    if (testType === 'all' || testType === 'cost') {
      try {
        const costCheck = await AIControlConfigManager.checkCostLimit();
        
        results.tests.cost_tracking = {
          status: costCheck.exceeded ? 'warning' : 'passed',
          message: costCheck.exceeded 
            ? 'Monthly cost limit exceeded' 
            : 'Cost tracking operational',
          details: {
            current_cost: costCheck.currentCost,
            monthly_limit: costCheck.limit,
            exceeded: costCheck.exceeded,
          },
        };

        if (costCheck.exceeded) {
          results.overall_status = 'degraded';
        }
      } catch (error) {
        results.tests.cost_tracking = {
          status: 'failed',
          message: 'Failed to check cost tracking',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test 6: Alert System Check
    if (testType === 'all' || testType === 'alerts') {
      try {
        const activeAlerts = await db.aiAlerts
          .where('status')
          .equals('active')
          .count();

        const criticalAlerts = await db.aiAlerts
          .where('severity')
          .equals('critical')
          .and(a => a.status === 'active')
          .count();

        results.tests.alert_system = {
          status: criticalAlerts > 0 ? 'warning' : 'passed',
          message: `Alert system operational`,
          details: {
            active_alerts: activeAlerts,
            critical_alerts: criticalAlerts,
          },
        };

        if (criticalAlerts > 0) {
          results.overall_status = 'degraded';
        }
      } catch (error) {
        results.tests.alert_system = {
          status: 'failed',
          message: 'Failed to check alert system',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Test 7: Performance Check
    if (testType === 'all' || testType === 'performance') {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentLogs = await db.aiActivityLogs
          .where('timestamp')
          .above(oneHourAgo)
          .toArray();

        if (recentLogs.length > 0) {
          const avgExecutionTime = recentLogs.reduce((sum, log) => sum + log.executionTime, 0) / recentLogs.length;
          const errorRate = (recentLogs.filter(log => log.status === 'error').length / recentLogs.length) * 100;

          const config = AIControlConfigManager.getConfig();
          const thresholds = config.performanceThresholds;

          const performanceIssues = [];
          if (avgExecutionTime > thresholds.maxResponseTime) {
            performanceIssues.push('High average response time');
          }
          if (errorRate > thresholds.maxErrorRate) {
            performanceIssues.push('High error rate');
          }

          results.tests.performance = {
            status: performanceIssues.length === 0 ? 'passed' : 'warning',
            message: performanceIssues.length === 0 
              ? 'Performance within acceptable limits' 
              : `Performance issues detected: ${performanceIssues.join(', ')}`,
            details: {
              avg_execution_time: avgExecutionTime,
              error_rate: errorRate,
              operations_last_hour: recentLogs.length,
              thresholds: {
                max_response_time: thresholds.maxResponseTime,
                max_error_rate: thresholds.maxErrorRate,
              },
            },
          };

          if (performanceIssues.length > 0) {
            results.overall_status = 'degraded';
          }
        } else {
          results.tests.performance = {
            status: 'passed',
            message: 'No recent operations to analyze',
            details: {
              operations_last_hour: 0,
            },
          };
        }
      } catch (error) {
        results.tests.performance = {
          status: 'failed',
          message: 'Failed to check performance',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Determine overall status based on test results
    const testStatuses = Object.values(results.tests).map((test: any) => test.status);
    if (testStatuses.includes('failed')) {
      results.overall_status = 'unhealthy';
    } else if (testStatuses.includes('warning')) {
      results.overall_status = 'degraded';
    }

    return NextResponse.json({
      success: true,
      diagnostics: results,
    });
  } catch (error) {
    console.error('Error running diagnostics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run diagnostics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
