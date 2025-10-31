// Predictive Analytics Service
// Advanced forecasting and prediction models for business metrics

import { db } from '@/lib/db/schema';
import { GeminiService } from '@/services/gemini/client';

/**
 * Sales Forecast Interface
 */
export interface SalesForecast {
  period: string;
  forecastDate: Date;
  predictedRevenue: number;
  predictedOrders: number;
  confidence: number; // 0-1
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  factors: string[];
  methodology: string;
}

/**
 * Cash Flow Forecast Interface
 */
export interface CashFlowForecast {
  month: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  confidence: number;
  assumptions: string[];
  risks: string[];
}

/**
 * Inventory Requirement Forecast
 */
export interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedOrderQuantity: number;
  reorderDate: Date;
  confidence: number;
  reasoning: string;
}

/**
 * Employee Turnover Prediction
 */
export interface TurnoverPrediction {
  employeeId: string;
  employeeName: string;
  turnoverRisk: 'high' | 'medium' | 'low';
  riskScore: number; // 0-100
  riskFactors: string[];
  retentionStrategies: string[];
  confidence: number;
}

/**
 * Customer Churn Prediction
 */
export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnRisk: 'high' | 'medium' | 'low';
  churnProbability: number; // 0-1
  riskFactors: string[];
  retentionActions: string[];
  estimatedLifetimeValue: number;
  confidence: number;
}

/**
 * Scenario Planning Report
 */
export interface ScenarioReport {
  scenarioName: string;
  description: string;
  timeframe: string;
  assumptions: string[];
  projections: {
    revenue: number;
    profit: number;
    cashFlow: number;
    marketShare: number;
  };
  risks: Array<{
    risk: string;
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential: string;
    requirements: string[];
  }>;
  recommendation: string;
  confidence: number;
}

/**
 * Predictive Analytics Service Class
 */
export class PredictiveAnalyticsService {
  private gemini: GeminiService | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      this.gemini = new GeminiService({ apiKey });
    }
  }

  /**
   * Forecast sales for multiple periods
   */
  async forecastSales(
    periods: number = 6,
    periodType: 'month' | 'quarter' = 'month'
  ): Promise<SalesForecast[]> {
    // Get historical sales data
    const historicalSales = await this.getHistoricalSales(12); // Last 12 months

    if (!this.gemini) {
      // Fallback to simple linear regression if AI not available
      return this.simpleLinearForecast(historicalSales, periods, periodType);
    }

    const prompt = `
Analyze historical sales data and forecast future sales:

HISTORICAL SALES DATA (Last 12 Months):
${historicalSales.map(s => `${s.month}: Revenue ${s.revenue.toFixed(2)}, Orders ${s.orders}`).join('\n')}

Generate sales forecast for next ${periods} ${periodType}s using:
1. Trend analysis (growth rate, momentum)
2. Seasonality patterns
3. Moving averages
4. External factors (market conditions, economic indicators)

For each period provide:
- Predicted revenue
- Predicted order count
- Confidence level (0-1)
- Confidence interval (lower and upper bounds)
- Key factors influencing the forecast
- Methodology used

Return JSON array:
[
  {
    "period": "2024-01",
    "predictedRevenue": number,
    "predictedOrders": number,
    "confidence": number (0-1),
    "confidenceInterval": {
      "lower": number,
      "upper": number
    },
    "factors": ["factor1", "factor2"],
    "methodology": "methodology description"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const forecasts = await this.gemini.generateJSON<any[]>(prompt, false);

    return forecasts.map(f => ({
      ...f,
      forecastDate: new Date(),
    }));
  }

  /**
   * Forecast cash flow for next 6-12 months
   */
  async forecastCashFlow(months: number = 12): Promise<CashFlowForecast[]> {
    const [invoices, purchaseOrders, payroll, sales] = await Promise.all([
      db.invoices.toArray(),
      db.purchaseOrders.toArray(),
      db.payroll?.toArray() || Promise.resolve([]),
      db.sales.toArray(),
    ]);

    // Calculate historical cash flow patterns
    const historicalCashFlow = this.calculateHistoricalCashFlow(sales, invoices, purchaseOrders);

    if (!this.gemini) {
      return this.simpleCashFlowForecast(historicalCashFlow, months);
    }

    const prompt = `
Forecast cash flow for the next ${months} months:

HISTORICAL CASH FLOW (Last 6 Months):
${historicalCashFlow.map(cf => `${cf.month}: Inflow ${cf.inflow.toFixed(2)}, Outflow ${cf.outflow.toFixed(2)}, Net ${cf.net.toFixed(2)}`).join('\n')}

CURRENT SITUATION:
- Pending Invoices: ${invoices.filter(i => i.status !== 'paid').length}
- Pending POs: ${purchaseOrders.filter(po => po.status !== 'received').length}
- Average Monthly Revenue: ${(sales.reduce((sum, s) => sum + s.totalAmount, 0) / 12).toFixed(2)}

For each month provide:
- Projected cash inflow (from sales, collections)
- Projected cash outflow (purchases, payroll, expenses)
- Net cash flow
- Cumulative cash flow
- Confidence level
- Key assumptions
- Potential risks

Return JSON array:
[
  {
    "month": "2024-01",
    "projectedInflow": number,
    "projectedOutflow": number,
    "netCashFlow": number,
    "cumulativeCashFlow": number,
    "confidence": number (0-1),
    "assumptions": ["assumption1", "assumption2"],
    "risks": ["risk1", "risk2"]
  }
]

Return ONLY the JSON array, no additional text.
`;

    const forecasts = await this.gemini.generateJSON<CashFlowForecast[]>(prompt, false);
    return forecasts;
  }

  /**
   * Forecast inventory requirements
   */
  async forecastInventoryRequirements(): Promise<InventoryForecast[]> {
    const [products, inventory, orders] = await Promise.all([
      db.products.where('isActive').equals(1).toArray(),
      db.inventory.toArray(),
      db.orders.toArray(),
    ]);

    // Calculate demand patterns for each product
    const demandPatterns = this.calculateDemandPatterns(products, orders);

    if (!this.gemini) {
      return this.simpleInventoryForecast(products, inventory, demandPatterns);
    }

    const prompt = `
Forecast inventory requirements for products:

PRODUCT DEMAND PATTERNS (Last 90 Days):
${demandPatterns.slice(0, 20).map(p => `${p.productName}: Avg Daily Demand ${p.avgDailyDemand.toFixed(2)}, Trend ${p.trend}`).join('\n')}

CURRENT INVENTORY LEVELS:
${inventory.slice(0, 20).map(i => {
  const product = products.find(p => p.id === i.productId);
  return `${product?.name || 'Unknown'}: ${i.quantity} units`;
}).join('\n')}

For each product provide:
- Predicted demand for next 30 days
- Recommended order quantity
- Optimal reorder date
- Confidence level
- Reasoning for recommendation

Return JSON array:
[
  {
    "productId": "id",
    "productName": "name",
    "currentStock": number,
    "predictedDemand": number,
    "recommendedOrderQuantity": number,
    "reorderDate": "2024-01-15",
    "confidence": number (0-1),
    "reasoning": "reasoning text"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const forecasts = await this.gemini.generateJSON<any[]>(prompt, false);

    return forecasts.map(f => ({
      ...f,
      reorderDate: new Date(f.reorderDate),
    }));
  }

  /**
   * Predict employee turnover risk
   */
  async predictEmployeeTurnover(): Promise<TurnoverPrediction[]> {
    const employees = await db.employees?.toArray() || [];

    if (employees.length === 0 || !this.gemini) {
      return [];
    }

    // Analyze employee data for risk factors
    const employeeAnalysis = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      tenure: this.calculateTenure(emp.hireDate),
      performanceRating: emp.performanceRating || 0,
      lastReviewDate: emp.lastReviewDate,
      department: emp.departmentId,
      position: emp.positionId,
    }));

    const prompt = `
Predict employee turnover risk based on employee data:

EMPLOYEE DATA:
${employeeAnalysis.slice(0, 50).map(e => `${e.name}: Tenure ${e.tenure} months, Performance ${e.performanceRating}/5`).join('\n')}

Analyze risk factors including:
- Tenure (very short or very long tenure can indicate risk)
- Performance ratings (low ratings or declining performance)
- Time since last review
- Department turnover patterns
- Position level

For each at-risk employee provide:
- Turnover risk level (high/medium/low)
- Risk score (0-100)
- Specific risk factors
- Recommended retention strategies
- Confidence level

Return JSON array (only include employees with medium or high risk):
[
  {
    "employeeId": "id",
    "employeeName": "name",
    "turnoverRisk": "high|medium|low",
    "riskScore": number (0-100),
    "riskFactors": ["factor1", "factor2"],
    "retentionStrategies": ["strategy1", "strategy2"],
    "confidence": number (0-1)
  }
]

Return ONLY the JSON array, no additional text.
`;

    const predictions = await this.gemini.generateJSON<TurnoverPrediction[]>(prompt, false);
    return predictions;
  }

  /**
   * Predict customer churn risk
   */
  async predictCustomerChurn(): Promise<ChurnPrediction[]> {
    const [customers, orders] = await Promise.all([
      db.customers.toArray(),
      db.orders.toArray(),
    ]);

    // Analyze customer behavior
    const customerAnalysis = customers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id);
      const lastOrder = customerOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())[0];
      const daysSinceLastOrder = lastOrder 
        ? (Date.now() - lastOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      
      const totalRevenue = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const avgOrderValue = totalRevenue / (customerOrders.length || 1);

      return {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        segment: customer.segment,
        orderCount: customerOrders.length,
        totalRevenue,
        avgOrderValue,
        daysSinceLastOrder,
        lifetimeValue: customer.lifetimeValue || 0,
      };
    });

    if (!this.gemini) {
      return this.simpleChurnPrediction(customerAnalysis);
    }

    const prompt = `
Predict customer churn risk based on customer behavior:

CUSTOMER DATA:
${customerAnalysis.slice(0, 50).map(c => `${c.name} (${c.type}): ${c.orderCount} orders, Last order ${c.daysSinceLastOrder.toFixed(0)} days ago, LTV ${c.lifetimeValue.toFixed(2)}`).join('\n')}

Analyze churn risk factors including:
- Days since last order (>90 days is concerning)
- Order frequency decline
- Order value decline
- Customer segment changes
- Payment issues

For each at-risk customer provide:
- Churn risk level (high/medium/low)
- Churn probability (0-1)
- Specific risk factors
- Recommended retention actions
- Estimated lifetime value at risk
- Confidence level

Return JSON array (only include customers with medium or high risk):
[
  {
    "customerId": "id",
    "customerName": "name",
    "churnRisk": "high|medium|low",
    "churnProbability": number (0-1),
    "riskFactors": ["factor1", "factor2"],
    "retentionActions": ["action1", "action2"],
    "estimatedLifetimeValue": number,
    "confidence": number (0-1)
  }
]

Return ONLY the JSON array, no additional text.
`;

    const predictions = await this.gemini.generateJSON<ChurnPrediction[]>(prompt, false);
    return predictions;
  }

  /**
   * Generate scenario planning reports
   */
  async generateScenarioPlanning(
    scenarios: Array<{ name: string; description: string; assumptions: string[] }>
  ): Promise<ScenarioReport[]> {
    if (!this.gemini) {
      return [];
    }

    const [sales, orders, customers, products] = await Promise.all([
      db.sales.toArray(),
      db.orders.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
    ]);

    const currentMetrics = {
      monthlyRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0) / 12,
      monthlyProfit: sales.reduce((sum, s) => sum + s.profit, 0) / 12,
      avgOrderValue: orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length,
      customerCount: customers.length,
      productCount: products.length,
    };

    const reports: ScenarioReport[] = [];

    for (const scenario of scenarios) {
      const prompt = `
Generate detailed scenario planning report:

SCENARIO: ${scenario.name}
DESCRIPTION: ${scenario.description}
ASSUMPTIONS:
${scenario.assumptions.map(a => `- ${a}`).join('\n')}

CURRENT BASELINE METRICS:
- Monthly Revenue: ${currentMetrics.monthlyRevenue.toFixed(2)}
- Monthly Profit: ${currentMetrics.monthlyProfit.toFixed(2)}
- Average Order Value: ${currentMetrics.avgOrderValue.toFixed(2)}
- Customer Count: ${currentMetrics.customerCount}
- Product Count: ${currentMetrics.productCount}

Provide comprehensive scenario analysis including:
1. Projected metrics (revenue, profit, cash flow, market share)
2. Key risks with impact levels and mitigation strategies
3. Opportunities with potential and requirements
4. Overall recommendation
5. Confidence level

Return JSON format:
{
  "scenarioName": "${scenario.name}",
  "description": "${scenario.description}",
  "timeframe": "timeframe description",
  "assumptions": ${JSON.stringify(scenario.assumptions)},
  "projections": {
    "revenue": number,
    "profit": number,
    "cashFlow": number,
    "marketShare": number
  },
  "risks": [
    {
      "risk": "risk description",
      "impact": "high|medium|low",
      "mitigation": "mitigation strategy"
    }
  ],
  "opportunities": [
    {
      "opportunity": "opportunity description",
      "potential": "potential description",
      "requirements": ["req1", "req2"]
    }
  ],
  "recommendation": "recommendation text",
  "confidence": number (0-1)
}

Return ONLY the JSON object, no additional text.
`;

      const report = await this.gemini.generateJSON<ScenarioReport>(prompt, false);
      reports.push(report);
    }

    return reports;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getHistoricalSales(months: number): Promise<Array<{ month: string; revenue: number; orders: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const sales = await db.sales
      .where('saleDate')
      .between(startDate, endDate, true, true)
      .toArray();

    const orders = await db.orders
      .where('orderDate')
      .between(startDate, endDate, true, true)
      .toArray();

    const monthlyData = new Map<string, { revenue: number; orders: number }>();

    sales.forEach(sale => {
      const month = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(month) || { revenue: 0, orders: 0 };
      monthlyData.set(month, {
        revenue: current.revenue + sale.totalAmount,
        orders: current.orders,
      });
    });

    orders.forEach(order => {
      const month = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(month) || { revenue: 0, orders: 0 };
      monthlyData.set(month, {
        revenue: current.revenue,
        orders: current.orders + 1,
      });
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private simpleLinearForecast(
    historical: Array<{ month: string; revenue: number; orders: number }>,
    periods: number,
    periodType: 'month' | 'quarter'
  ): SalesForecast[] {
    // Simple linear regression forecast
    const revenues = historical.map(h => h.revenue);
    const avgRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
    const trend = revenues.length > 1 
      ? (revenues[revenues.length - 1] - revenues[0]) / revenues.length
      : 0;

    const forecasts: SalesForecast[] = [];
    const lastDate = new Date(historical[historical.length - 1].month);

    for (let i = 1; i <= periods; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const predictedRevenue = avgRevenue + (trend * i);
      const predictedOrders = Math.round(predictedRevenue / (avgRevenue / historical[historical.length - 1].orders));

      forecasts.push({
        period: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
        forecastDate: new Date(),
        predictedRevenue,
        predictedOrders,
        confidence: 0.7,
        confidenceInterval: {
          lower: predictedRevenue * 0.85,
          upper: predictedRevenue * 1.15,
        },
        factors: ['Linear trend analysis', 'Historical average'],
        methodology: 'Simple linear regression',
      });
    }

    return forecasts;
  }

  private calculateHistoricalCashFlow(
    sales: any[],
    invoices: any[],
    purchaseOrders: any[]
  ): Array<{ month: string; inflow: number; outflow: number; net: number }> {
    const monthlyData = new Map<string, { inflow: number; outflow: number }>();

    // Calculate inflows from sales
    sales.forEach(sale => {
      const month = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(month) || { inflow: 0, outflow: 0 };
      monthlyData.set(month, {
        inflow: current.inflow + sale.totalAmount,
        outflow: current.outflow,
      });
    });

    // Calculate outflows from purchase orders
    purchaseOrders.forEach(po => {
      if (po.receivedDate) {
        const month = `${po.receivedDate.getFullYear()}-${String(po.receivedDate.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyData.get(month) || { inflow: 0, outflow: 0 };
        monthlyData.set(month, {
          inflow: current.inflow,
          outflow: current.outflow + po.totalAmount,
        });
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        inflow: data.inflow,
        outflow: data.outflow,
        net: data.inflow - data.outflow,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }

  private simpleCashFlowForecast(
    historical: Array<{ month: string; inflow: number; outflow: number; net: number }>,
    months: number
  ): CashFlowForecast[] {
    const avgInflow = historical.reduce((sum, h) => sum + h.inflow, 0) / historical.length;
    const avgOutflow = historical.reduce((sum, h) => sum + h.outflow, 0) / historical.length;

    const forecasts: CashFlowForecast[] = [];
    let cumulativeCashFlow = 0;
    const lastDate = new Date(historical[historical.length - 1].month);

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const netCashFlow = avgInflow - avgOutflow;
      cumulativeCashFlow += netCashFlow;

      forecasts.push({
        month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
        projectedInflow: avgInflow,
        projectedOutflow: avgOutflow,
        netCashFlow,
        cumulativeCashFlow,
        confidence: 0.7,
        assumptions: ['Historical average inflow and outflow', 'No major changes in business operations'],
        risks: ['Unexpected expenses', 'Delayed payments from customers'],
      });
    }

    return forecasts;
  }

  private calculateDemandPatterns(
    products: any[],
    orders: any[]
  ): Array<{ productId: string; productName: string; avgDailyDemand: number; trend: string }> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentOrders = orders.filter(o => o.orderDate >= ninetyDaysAgo);

    return products.map(product => {
      const productOrders = recentOrders.flatMap(o => 
        o.items.filter((item: any) => item.productId === product.id)
      );

      const totalDemand = productOrders.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const avgDailyDemand = totalDemand / 90;

      // Simple trend detection
      const firstHalfDemand = productOrders
        .filter((item: any) => {
          const order = recentOrders.find(o => o.items.some((i: any) => i.productId === item.productId));
          return order && order.orderDate < new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
        })
        .reduce((sum: number, item: any) => sum + item.quantity, 0);

      const secondHalfDemand = totalDemand - firstHalfDemand;
      const trend = secondHalfDemand > firstHalfDemand * 1.1 ? 'increasing' : 
                    secondHalfDemand < firstHalfDemand * 0.9 ? 'decreasing' : 'stable';

      return {
        productId: product.id,
        productName: product.name,
        avgDailyDemand,
        trend,
      };
    });
  }

  private simpleInventoryForecast(
    products: any[],
    inventory: any[],
    demandPatterns: any[]
  ): InventoryForecast[] {
    return products.map(product => {
      const inv = inventory.find(i => i.productId === product.id);
      const demand = demandPatterns.find(d => d.productId === product.id);

      const currentStock = inv?.quantity || 0;
      const predictedDemand = (demand?.avgDailyDemand || 0) * 30; // 30 days
      const recommendedOrderQuantity = Math.max(0, predictedDemand - currentStock + product.reorderLevel);
      
      const daysUntilReorder = currentStock / (demand?.avgDailyDemand || 1);
      const reorderDate = new Date();
      reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysUntilReorder - 7)); // Reorder 7 days before stockout

      return {
        productId: product.id,
        productName: product.name,
        currentStock,
        predictedDemand,
        recommendedOrderQuantity,
        reorderDate,
        confidence: 0.7,
        reasoning: `Based on average daily demand of ${demand?.avgDailyDemand.toFixed(2)} units`,
      };
    }).filter(f => f.recommendedOrderQuantity > 0);
  }

  private simpleChurnPrediction(customerAnalysis: any[]): ChurnPrediction[] {
    return customerAnalysis
      .filter(c => c.daysSinceLastOrder > 90)
      .map(c => {
        const churnProbability = Math.min(1, c.daysSinceLastOrder / 365);
        const churnRisk: 'high' | 'medium' | 'low' = churnProbability > 0.7 ? 'high' : churnProbability > 0.4 ? 'medium' : 'low';

        return {
          customerId: c.id,
          customerName: c.name,
          churnRisk,
          churnProbability,
          riskFactors: [
            `${c.daysSinceLastOrder.toFixed(0)} days since last order`,
            c.orderCount < 5 ? 'Low order frequency' : '',
          ].filter(Boolean),
          retentionActions: [
            'Send personalized re-engagement email',
            'Offer special discount or promotion',
            'Schedule account review call',
          ],
          estimatedLifetimeValue: c.lifetimeValue,
          confidence: 0.7,
        };
      })
      .filter(p => p.churnRisk !== 'low');
  }

  private calculateTenure(hireDate: Date): number {
    const months = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.floor(months);
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsService();
