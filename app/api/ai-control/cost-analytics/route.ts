import { NextRequest, NextResponse } from 'next/server';
import { AIActivityLogger } from '@/services/ai/activity-logger';
import { AIControlConfigManager } from '@/services/ai/ai-control-config';
import { db } from '@/lib/db/schema';

/**
 * GET /api/ai-control/cost-analytics
 * Get cost analytics and spending data for AI operations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse time period
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const modelName = searchParams.get('model_name');

    // Calculate date range based on period
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Get logs for the period
    let logs = await db.aiActivityLogs
      .where('timestamp')
      .between(startDate, endDate, true, true)
      .toArray();

    // Filter by model if specified
    if (modelName) {
      logs = logs.filter(log => log.modelName === modelName);
    }

    // Calculate total cost
    const totalCost = logs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);

    // Calculate cost by model
    const costByModel: Record<string, number> = {};
    logs.forEach(log => {
      const model = log.modelName;
      costByModel[model] = (costByModel[model] || 0) + (log.estimatedCost || 0);
    });

    // Calculate cost by operation type
    const costByOperationType: Record<string, number> = {};
    logs.forEach(log => {
      const opType = log.operationType;
      costByOperationType[opType] = (costByOperationType[opType] || 0) + (log.estimatedCost || 0);
    });

    // Calculate cost by user
    const costByUser: Record<string, number> = {};
    logs.forEach(log => {
      const user = log.userId;
      costByUser[user] = (costByUser[user] || 0) + (log.estimatedCost || 0);
    });

    // Calculate daily cost trend
    const dailyCosts: Record<string, number> = {};
    logs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + (log.estimatedCost || 0);
    });

    const costTrend = Object.entries(dailyCosts)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate token usage
    const totalInputTokens = logs.reduce((sum, log) => sum + (log.inputTokens || 0), 0);
    const totalOutputTokens = logs.reduce((sum, log) => sum + (log.outputTokens || 0), 0);

    // Get cost configuration
    const costSettings = AIControlConfigManager.getCostSettings();
    const monthlyLimit = costSettings.monthlyCostLimit;

    // Calculate projected monthly cost
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const avgDailyCost = totalCost / Math.max(daysInPeriod, 1);
    const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    const projectedMonthlyCost = avgDailyCost * daysInMonth;

    // Get top expensive operations
    const topExpensiveOps = logs
      .sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0))
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        model_name: log.modelName,
        operation_type: log.operationType,
        cost: log.estimatedCost,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
      }));

    // Calculate cost efficiency metrics
    const avgCostPerOperation = totalCost / Math.max(logs.length, 1);
    const successfulOps = logs.filter(log => log.status === 'success').length;
    const costPerSuccessfulOp = totalCost / Math.max(successfulOps, 1);

    return NextResponse.json({
      success: true,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        period_type: period,
      },
      summary: {
        total_cost: totalCost,
        total_operations: logs.length,
        avg_cost_per_operation: avgCostPerOperation,
        cost_per_successful_operation: costPerSuccessfulOp,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
      },
      budget: {
        monthly_limit: monthlyLimit,
        current_month_cost: period === 'month' ? totalCost : null,
        projected_monthly_cost: projectedMonthlyCost,
        budget_utilization_percent: monthlyLimit ? (totalCost / monthlyLimit) * 100 : null,
        days_until_limit: monthlyLimit && avgDailyCost > 0 
          ? Math.floor((monthlyLimit - totalCost) / avgDailyCost) 
          : null,
      },
      breakdown: {
        by_model: Object.entries(costByModel)
          .map(([model, cost]) => ({ model, cost }))
          .sort((a, b) => b.cost - a.cost),
        by_operation_type: Object.entries(costByOperationType)
          .map(([operation_type, cost]) => ({ operation_type, cost }))
          .sort((a, b) => b.cost - a.cost),
        by_user: Object.entries(costByUser)
          .map(([user_id, cost]) => ({ user_id, cost }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 20), // Top 20 users
      },
      trends: {
        daily_costs: costTrend,
        avg_daily_cost: avgDailyCost,
      },
      top_expensive_operations: topExpensiveOps,
      recommendations: generateCostRecommendations({
        totalCost,
        avgCostPerOperation,
        projectedMonthlyCost,
        monthlyLimit,
        costByModel,
        logs,
      }),
    });
  } catch (error) {
    console.error('Error fetching cost analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch cost analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate cost optimization recommendations
 */
function generateCostRecommendations(data: {
  totalCost: number;
  avgCostPerOperation: number;
  projectedMonthlyCost: number;
  monthlyLimit?: number;
  costByModel: Record<string, number>;
  logs: any[];
}): string[] {
  const recommendations: string[] = [];

  // Check if approaching budget limit
  if (data.monthlyLimit && data.projectedMonthlyCost > data.monthlyLimit * 0.8) {
    recommendations.push(
      `Projected monthly cost ($${data.projectedMonthlyCost.toFixed(2)}) is approaching or exceeding budget limit ($${data.monthlyLimit.toFixed(2)}). Consider implementing cost controls.`
    );
  }

  // Check for high-cost models
  const sortedModels = Object.entries(data.costByModel).sort((a, b) => b[1] - a[1]);
  if (sortedModels.length > 0 && sortedModels[0][1] > data.totalCost * 0.5) {
    recommendations.push(
      `Model "${sortedModels[0][0]}" accounts for ${((sortedModels[0][1] / data.totalCost) * 100).toFixed(1)}% of total costs. Consider optimizing prompts or using a more cost-effective model.`
    );
  }

  // Check for caching opportunities
  const duplicateInputs = new Map<string, number>();
  data.logs.forEach(log => {
    const key = `${log.modelName}-${log.operationType}`;
    duplicateInputs.set(key, (duplicateInputs.get(key) || 0) + 1);
  });

  const cachingOpportunities = Array.from(duplicateInputs.entries())
    .filter(([_, count]) => count > 5)
    .length;

  if (cachingOpportunities > 0) {
    recommendations.push(
      `Detected ${cachingOpportunities} operation types with repeated calls. Enable caching to reduce costs by up to 50%.`
    );
  }

  // Check for failed operations wasting money
  const failedOps = data.logs.filter(log => log.status === 'error');
  const wastedCost = failedOps.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
  
  if (wastedCost > data.totalCost * 0.1) {
    recommendations.push(
      `Failed operations cost $${wastedCost.toFixed(2)} (${((wastedCost / data.totalCost) * 100).toFixed(1)}% of total). Improve error handling and input validation.`
    );
  }

  // Check for high token usage
  const avgInputTokens = data.logs.reduce((sum, log) => sum + (log.inputTokens || 0), 0) / data.logs.length;
  if (avgInputTokens > 1000) {
    recommendations.push(
      `Average input token count is ${avgInputTokens.toFixed(0)}. Consider reducing prompt size or implementing prompt compression.`
    );
  }

  // General recommendations if no specific issues
  if (recommendations.length === 0) {
    recommendations.push('Cost usage is within normal parameters. Continue monitoring for optimization opportunities.');
  }

  return recommendations;
}
