// Executive AI-Powered Business Insights Service
// Provides strategic recommendations, opportunity identification, and risk analysis

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import { FinancialAnalyticsService } from '@/services/analytics/financial';

/**
 * Executive Summary Interface
 */
export interface ExecutiveSummary {
  date: Date;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number; // 0-100
  keyMetrics: {
    revenue: number;
    revenueGrowth: number;
    profit: number;
    profitMargin: number;
    orderCount: number;
    customerCount: number;
  };
  topOpportunities: Opportunity[];
  topRisks: Risk[];
  strategicRecommendations: string[];
  competitivePositioning: CompetitiveAnalysis;
  quarterlyForecast: QuarterlyForecast;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  potentialImpact: 'high' | 'medium' | 'low';
  estimatedRevenue?: number;
  timeframe: string;
  actionItems: string[];
  confidence: number;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number; // 0-1
  potentialImpact: string;
  mitigationStrategies: string[];
  owner?: string;
}

export interface CompetitiveAnalysis {
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  marketTrends: string[];
  recommendations: string[];
}

export interface QuarterlyForecast {
  quarter: string;
  projectedRevenue: number;
  projectedProfit: number;
  confidence: number;
  assumptions: string[];
  risks: string[];
}

export interface WhatIfScenario {
  scenarioName: string;
  description: string;
  assumptions: string[];
  projectedOutcome: {
    revenue: number;
    profit: number;
    customerImpact: string;
    operationalImpact: string;
  };
  probability: number;
  recommendation: string;
}

/**
 * Executive Insights Service Class
 */
export class ExecutiveInsightsService {
  constructor(private gemini: GeminiService) {}

  /**
   * Create a new instance with API key
   */
  static create(apiKey: string): ExecutiveInsightsService {
    const gemini = new GeminiService({ apiKey });
    return new ExecutiveInsightsService(gemini);
  }

  /**
   * Generate comprehensive daily executive summary
   */
  async generateExecutiveSummary(): Promise<ExecutiveSummary> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Gather comprehensive business data
    const [
      financialMetrics,
      orders,
      customers,
      products,
      inventory,
      sales,
    ] = await Promise.all([
      FinancialAnalyticsService.getFinancialMetrics(thirtyDaysAgo, today),
      db.orders.where('orderDate').above(thirtyDaysAgo).toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.inventory.toArray(),
      db.sales.where('saleDate').above(thirtyDaysAgo).toArray(),
    ]);

    const prompt = `
You are an executive business advisor analyzing a medical products company. Generate a comprehensive executive summary.

BUSINESS DATA (Last 30 Days):
Revenue: ${financialMetrics.revenue.toFixed(2)}
Revenue Growth: ${financialMetrics.revenueGrowth.toFixed(2)}%
Net Profit: ${financialMetrics.netProfit.toFixed(2)}
Profit Margin: ${financialMetrics.profitMargin.toFixed(2)}%
Orders: ${orders.length}
Active Customers: ${customers.filter(c => c.isActive).length}
Total Products: ${products.length}
Low Stock Items: ${products.filter(p => p.stockQuantity <= p.reorderLevel).length}

SALES BREAKDOWN:
${sales.slice(0, 10).map(s => `- ${s.saleId}: ${s.totalAmount.toFixed(2)} (Profit: ${s.profit.toFixed(2)})`).join('\n')}

TOP PRODUCTS BY REVENUE:
${this.getTopProducts(orders, products).map(p => `- ${p.name}: ${p.revenue.toFixed(2)}`).join('\n')}

CUSTOMER SEGMENTS:
${this.getCustomerSegments(customers).map(s => `- ${s.segment}: ${s.count} customers`).join('\n')}

Provide a comprehensive executive summary with:

1. Overall Business Health Assessment (excellent/good/fair/poor) with score 0-100
2. Top 5 Opportunities (with potential revenue impact and timeframe)
3. Top 5 Risks (with severity and mitigation strategies)
4. 5 Strategic Recommendations (actionable and specific)
5. Competitive Positioning Analysis
6. Quarterly Performance Forecast

Return JSON format:
{
  "overallHealth": "excellent|good|fair|poor",
  "healthScore": number (0-100),
  "topOpportunities": [
    {
      "id": "opp-1",
      "title": "opportunity title",
      "description": "detailed description",
      "potentialImpact": "high|medium|low",
      "estimatedRevenue": number,
      "timeframe": "timeframe description",
      "actionItems": ["action1", "action2"],
      "confidence": number (0-1)
    }
  ],
  "topRisks": [
    {
      "id": "risk-1",
      "title": "risk title",
      "description": "detailed description",
      "severity": "critical|high|medium|low",
      "probability": number (0-1),
      "potentialImpact": "impact description",
      "mitigationStrategies": ["strategy1", "strategy2"]
    }
  ],
  "strategicRecommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "competitivePositioning": {
    "positioning": "market position description",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "marketTrends": ["trend1", "trend2"],
    "recommendations": ["rec1", "rec2"]
  },
  "quarterlyForecast": {
    "quarter": "Q1 2024",
    "projectedRevenue": number,
    "projectedProfit": number,
    "confidence": number (0-1),
    "assumptions": ["assumption1", "assumption2"],
    "risks": ["risk1", "risk2"]
  }
}

Return ONLY the JSON object, no additional text.
`;

    const result = await this.gemini.generateJSON<any>(prompt, false);

    return {
      date: today,
      overallHealth: result.overallHealth,
      healthScore: result.healthScore,
      keyMetrics: {
        revenue: financialMetrics.revenue,
        revenueGrowth: financialMetrics.revenueGrowth,
        profit: financialMetrics.netProfit,
        profitMargin: financialMetrics.profitMargin,
        orderCount: orders.length,
        customerCount: customers.filter(c => c.isActive).length,
      },
      topOpportunities: result.topOpportunities,
      topRisks: result.topRisks,
      strategicRecommendations: result.strategicRecommendations,
      competitivePositioning: result.competitivePositioning,
      quarterlyForecast: result.quarterlyForecast,
    };
  }

  /**
   * Identify top business opportunities
   */
  async identifyOpportunities(): Promise<Opportunity[]> {
    const [orders, customers, products, sales] = await Promise.all([
      db.orders.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.sales.toArray(),
    ]);

    // Analyze data for opportunities
    const customerData = this.analyzeCustomerOpportunities(customers, orders);
    const productData = this.analyzeProductOpportunities(products, sales);
    const marketData = this.analyzeMarketOpportunities(orders, sales);

    const prompt = `
Analyze business data and identify top opportunities for growth:

CUSTOMER INSIGHTS:
${JSON.stringify(customerData, null, 2)}

PRODUCT INSIGHTS:
${JSON.stringify(productData, null, 2)}

MARKET INSIGHTS:
${JSON.stringify(marketData, null, 2)}

Identify 5-10 specific opportunities including:
- New market segments to target
- Product expansion opportunities
- Customer upsell/cross-sell opportunities
- Operational efficiency improvements
- Strategic partnerships
- Geographic expansion

For each opportunity provide:
- Title and description
- Potential impact (high/medium/low)
- Estimated revenue impact
- Timeframe for implementation
- Specific action items
- Confidence level

Return JSON array:
[
  {
    "id": "unique-id",
    "title": "opportunity title",
    "description": "detailed description",
    "potentialImpact": "high|medium|low",
    "estimatedRevenue": number,
    "timeframe": "3-6 months",
    "actionItems": ["action1", "action2", "action3"],
    "confidence": number (0-1)
  }
]

Return ONLY the JSON array, no additional text.
`;

    const opportunities = await this.gemini.generateJSON<Opportunity[]>(prompt, false);
    return opportunities;
  }

  /**
   * Analyze and identify business risks
   */
  async identifyRisks(): Promise<Risk[]> {
    const [orders, customers, products, inventory, invoices] = await Promise.all([
      db.orders.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.inventory.toArray(),
      db.invoices.toArray(),
    ]);

    // Analyze risk indicators
    const financialRisks = this.analyzeFinancialRisks(invoices, orders);
    const operationalRisks = this.analyzeOperationalRisks(inventory, products);
    const customerRisks = this.analyzeCustomerRisks(customers, orders);

    const prompt = `
Analyze business data and identify potential risks:

FINANCIAL RISK INDICATORS:
${JSON.stringify(financialRisks, null, 2)}

OPERATIONAL RISK INDICATORS:
${JSON.stringify(operationalRisks, null, 2)}

CUSTOMER RISK INDICATORS:
${JSON.stringify(customerRisks, null, 2)}

Identify 5-10 specific risks including:
- Financial risks (cash flow, receivables, profitability)
- Operational risks (inventory, supply chain, quality)
- Customer risks (churn, concentration, satisfaction)
- Market risks (competition, regulation, trends)
- Strategic risks (execution, resources, capabilities)

For each risk provide:
- Title and description
- Severity level (critical/high/medium/low)
- Probability of occurrence (0-1)
- Potential impact description
- Mitigation strategies
- Recommended owner/responsible party

Return JSON array:
[
  {
    "id": "unique-id",
    "title": "risk title",
    "description": "detailed description",
    "severity": "critical|high|medium|low",
    "probability": number (0-1),
    "potentialImpact": "impact description",
    "mitigationStrategies": ["strategy1", "strategy2", "strategy3"],
    "owner": "department or role"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const risks = await this.gemini.generateJSON<Risk[]>(prompt, false);
    return risks;
  }

  /**
   * Predict quarterly performance
   */
  async predictQuarterlyPerformance(): Promise<QuarterlyForecast> {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [sales, orders, customers] = await Promise.all([
      db.sales.where('saleDate').above(ninetyDaysAgo).toArray(),
      db.orders.where('orderDate').above(ninetyDaysAgo).toArray(),
      db.customers.toArray(),
    ]);

    // Calculate trends
    const monthlyRevenue = this.calculateMonthlyRevenue(sales);
    const growthRate = this.calculateGrowthRate(monthlyRevenue);
    const seasonality = this.detectSeasonality(sales);

    const prompt = `
Predict quarterly performance based on historical data:

HISTORICAL REVENUE (Last 3 Months):
${monthlyRevenue.map(m => `${m.month}: ${m.revenue.toFixed(2)}`).join('\n')}

GROWTH RATE: ${growthRate.toFixed(2)}%
SEASONALITY PATTERN: ${seasonality}

CURRENT METRICS:
- Total Orders (90 days): ${orders.length}
- Active Customers: ${customers.filter(c => c.isActive).length}
- Average Order Value: ${(sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length).toFixed(2)}

Provide quarterly forecast including:
- Projected revenue for next quarter
- Projected profit
- Confidence level
- Key assumptions
- Potential risks to forecast

Return JSON format:
{
  "quarter": "Q1 2024",
  "projectedRevenue": number,
  "projectedProfit": number,
  "confidence": number (0-1),
  "assumptions": ["assumption1", "assumption2", "assumption3"],
  "risks": ["risk1", "risk2", "risk3"]
}

Return ONLY the JSON object, no additional text.
`;

    const forecast = await this.gemini.generateJSON<QuarterlyForecast>(prompt, false);
    return forecast;
  }

  /**
   * Analyze competitive positioning
   */
  async analyzeCompetitivePositioning(): Promise<CompetitiveAnalysis> {
    const [products, customers, sales] = await Promise.all([
      db.products.toArray(),
      db.customers.toArray(),
      db.sales.toArray(),
    ]);

    const productCategories = this.groupByCategory(products);
    const customerTypes = this.groupByType(customers);
    const profitMargins = this.calculateProfitMargins(sales);

    const prompt = `
Analyze competitive positioning for a medical products company:

PRODUCT PORTFOLIO:
${Object.entries(productCategories).map(([cat, count]) => `- ${cat}: ${count} products`).join('\n')}

CUSTOMER BASE:
${Object.entries(customerTypes).map(([type, count]) => `- ${type}: ${count} customers`).join('\n')}

PROFIT MARGINS:
Average: ${profitMargins.average.toFixed(2)}%
Range: ${profitMargins.min.toFixed(2)}% - ${profitMargins.max.toFixed(2)}%

Provide competitive analysis including:
- Current market positioning
- Key competitive strengths
- Areas of weakness
- Relevant market trends
- Strategic recommendations

Return JSON format:
{
  "positioning": "market position description",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "marketTrends": ["trend1", "trend2", "trend3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Return ONLY the JSON object, no additional text.
`;

    const analysis = await this.gemini.generateJSON<CompetitiveAnalysis>(prompt, false);
    return analysis;
  }

  /**
   * Generate what-if scenarios
   */
  async generateWhatIfScenarios(scenarioType: string): Promise<WhatIfScenario[]> {
    const [sales, orders, products, customers] = await Promise.all([
      db.sales.toArray(),
      db.orders.toArray(),
      db.products.toArray(),
      db.customers.toArray(),
    ]);

    const currentMetrics = {
      avgRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length,
      avgProfit: sales.reduce((sum, s) => sum + s.profit, 0) / sales.length,
      avgOrderValue: orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length,
      customerCount: customers.length,
    };

    const prompt = `
Generate what-if scenarios for: ${scenarioType}

CURRENT METRICS:
- Average Monthly Revenue: ${currentMetrics.avgRevenue.toFixed(2)}
- Average Monthly Profit: ${currentMetrics.avgProfit.toFixed(2)}
- Average Order Value: ${currentMetrics.avgOrderValue.toFixed(2)}
- Customer Count: ${currentMetrics.customerCount}

Generate 3-5 realistic scenarios showing potential outcomes of:
- Price changes (increase/decrease by 5%, 10%, 15%)
- Market expansion (new customer segments, geographic expansion)
- Product line changes (new products, discontinuations)
- Operational improvements (efficiency gains, cost reductions)
- Customer acquisition strategies

For each scenario provide:
- Scenario name and description
- Key assumptions
- Projected outcomes (revenue, profit, customer impact, operational impact)
- Probability of success
- Recommendation (pursue, consider, avoid)

Return JSON array:
[
  {
    "scenarioName": "scenario name",
    "description": "detailed description",
    "assumptions": ["assumption1", "assumption2"],
    "projectedOutcome": {
      "revenue": number,
      "profit": number,
      "customerImpact": "impact description",
      "operationalImpact": "impact description"
    },
    "probability": number (0-1),
    "recommendation": "recommendation text"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const scenarios = await this.gemini.generateJSON<WhatIfScenario[]>(prompt, false);
    return scenarios;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getTopProducts(orders: any[], products: any[]): Array<{ name: string; revenue: number }> {
    const productRevenue = new Map<string, number>();

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const current = productRevenue.get(item.productId) || 0;
        productRevenue.set(item.productId, current + item.total);
      });
    });

    return Array.from(productRevenue.entries())
      .map(([productId, revenue]) => {
        const product = products.find(p => p.id === productId);
        return { name: product?.name || 'Unknown', revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private getCustomerSegments(customers: any[]): Array<{ segment: string; count: number }> {
    const segments = new Map<string, number>();

    customers.forEach(customer => {
      const segment = customer.segment || 'Unknown';
      segments.set(segment, (segments.get(segment) || 0) + 1);
    });

    return Array.from(segments.entries()).map(([segment, count]) => ({ segment, count }));
  }

  private analyzeCustomerOpportunities(customers: any[], orders: any[]): any {
    const inactiveCustomers = customers.filter(c => {
      const lastOrder = orders
        .filter(o => o.customerId === c.id)
        .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())[0];
      
      if (!lastOrder) return true;
      
      const daysSinceLastOrder = (Date.now() - lastOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastOrder > 90;
    });

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive).length,
      inactiveCustomers: inactiveCustomers.length,
      vipCustomers: customers.filter(c => c.segment === 'VIP').length,
      reactivationOpportunity: inactiveCustomers.length,
    };
  }

  private analyzeProductOpportunities(products: any[], sales: any[]): any {
    const productSales = new Map<string, number>();

    sales.forEach(sale => {
      const orderId = sale.orderId;
      // Would need to get order items here
    });

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      lowStockProducts: products.filter(p => p.stockQuantity <= p.reorderLevel).length,
      highMarginProducts: products.filter(p => {
        const margin = ((p.unitPrice - p.costPrice) / p.unitPrice) * 100;
        return margin > 30;
      }).length,
    };
  }

  private analyzeMarketOpportunities(orders: any[], sales: any[]): any {
    const recentOrders = orders.filter(o => {
      const daysSince = (Date.now() - o.orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    return {
      recentOrderCount: recentOrders.length,
      averageOrderValue: recentOrders.reduce((sum, o) => sum + o.totalAmount, 0) / recentOrders.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      averageProfit: sales.reduce((sum, s) => sum + s.profit, 0) / sales.length,
    };
  }

  private analyzeFinancialRisks(invoices: any[], orders: any[]): any {
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status !== 'paid' && inv.dueDate < today
    );

    return {
      totalInvoices: invoices.length,
      overdueInvoices: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
    };
  }

  private analyzeOperationalRisks(inventory: any[], products: any[]): any {
    const lowStock = products.filter(p => p.stockQuantity <= p.reorderLevel);
    const expiringSoon = products.filter(p => {
      if (!p.expiryDate) return false;
      const daysUntilExpiry = (p.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return {
      lowStockCount: lowStock.length,
      expiringSoonCount: expiringSoon.length,
      totalInventoryValue: inventory.reduce((sum, inv) => {
        const product = products.find(p => p.id === inv.productId);
        return sum + (product ? product.costPrice * inv.quantity : 0);
      }, 0),
    };
  }

  private analyzeCustomerRisks(customers: any[], orders: any[]): any {
    const customerOrderCounts = new Map<string, number>();

    orders.forEach(order => {
      customerOrderCounts.set(
        order.customerId,
        (customerOrderCounts.get(order.customerId) || 0) + 1
      );
    });

    const topCustomers = Array.from(customerOrderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCustomerPercentage = topCustomers.reduce((sum, [_, count]) => sum + count, 0) / orders.length;

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive).length,
      customerConcentration: topCustomerPercentage,
      atRiskCustomers: customers.filter(c => !c.isActive).length,
    };
  }

  private calculateMonthlyRevenue(sales: any[]): Array<{ month: string; revenue: number }> {
    const monthlyData = new Map<string, number>();

    sales.forEach(sale => {
      const month = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(month, (monthlyData.get(month) || 0) + sale.totalAmount);
    });

    return Array.from(monthlyData.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateGrowthRate(monthlyRevenue: Array<{ month: string; revenue: number }>): number {
    if (monthlyRevenue.length < 2) return 0;

    const latest = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const previous = monthlyRevenue[monthlyRevenue.length - 2].revenue;

    return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  }

  private detectSeasonality(sales: any[]): string {
    // Simple seasonality detection
    const monthlyData = new Map<number, number>();

    sales.forEach(sale => {
      const month = sale.saleDate.getMonth();
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    const avgSales = Array.from(monthlyData.values()).reduce((sum, count) => sum + count, 0) / monthlyData.size;
    const peakMonths = Array.from(monthlyData.entries())
      .filter(([_, count]) => count > avgSales * 1.2)
      .map(([month]) => month);

    if (peakMonths.length > 0) {
      return `Peak months: ${peakMonths.map(m => new Date(2024, m).toLocaleString('default', { month: 'long' })).join(', ')}`;
    }

    return 'No clear seasonality pattern detected';
  }

  private groupByCategory(products: any[]): Record<string, number> {
    const categories: Record<string, number> = {};

    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    return categories;
  }

  private groupByType(customers: any[]): Record<string, number> {
    const types: Record<string, number> = {};

    customers.forEach(customer => {
      types[customer.type] = (types[customer.type] || 0) + 1;
    });

    return types;
  }

  private calculateProfitMargins(sales: any[]): { average: number; min: number; max: number } {
    if (sales.length === 0) return { average: 0, min: 0, max: 0 };

    const margins = sales.map(s => s.profitMargin);
    const average = margins.reduce((sum, m) => sum + m, 0) / margins.length;
    const min = Math.min(...margins);
    const max = Math.max(...margins);

    return { average, min, max };
  }
}
