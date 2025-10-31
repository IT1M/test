// Business Intelligence Service
// AI-powered insights, anomaly detection, and business question answering

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import type { DailyBriefing, Anomaly } from '@/types/database';

/**
 * Business metrics for analysis
 */
interface BusinessMetrics {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; sales: number }>;
  lowStockCount: number;
  overduePayments: number;
}

/**
 * Insights Service Class
 * Provides AI-powered business intelligence and insights
 */
export class InsightsService {
  constructor(private gemini: GeminiService) {}

  /**
   * Generate morning briefing with key insights and actions
   */
  async generateMorningBriefing(): Promise<DailyBriefing> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Gather all relevant data
    const [
      yesterdaySales,
      newOrders,
      lowStock,
      overduePayments,
      expiringProducts,
      topCustomers,
    ] = await Promise.all([
      this.getYesterdaySales(),
      this.getNewOrders(yesterday),
      this.getLowStockProducts(),
      this.getOverduePayments(),
      this.getExpiringProducts(90),
      this.getTopCustomers(30),
    ]);

    const prompt = `
Generate a comprehensive morning briefing report for a medical products company:

Yesterday's Performance:
- Total Revenue: $${yesterdaySales.revenue.toFixed(2)}
- Orders Completed: ${yesterdaySales.orders}
- Average Order Value: $${yesterdaySales.avgOrderValue.toFixed(2)}

New Orders (Last 24 Hours):
${newOrders.map(o => `- Order ${o.orderId}: ${o.customerName} - $${o.totalAmount.toFixed(2)}`).join('\n')}

Alerts:
- Low Stock Items: ${lowStock.length} products
- Overdue Payments: ${overduePayments.length} invoices ($${overduePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)})
- Products Expiring Soon: ${expiringProducts.length} items

Top Customers (Last 30 Days):
${topCustomers.map(c => `- ${c.name}: $${c.revenue.toFixed(2)}`).join('\n')}

Provide a structured briefing with:
1. Key Highlights (3-5 most important points)
2. Actions Needed Today (prioritized list)
3. Opportunities Identified (growth or improvement areas)
4. Risks and Concerns (potential issues to address)
5. Strategic Recommendations (actionable insights)

Return JSON format:
{
  "date": "${today.toISOString()}",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "actionsNeeded": ["action1", "action2", "action3"],
  "opportunities": ["opportunity1", "opportunity2"],
  "risks": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Return ONLY the JSON object, no additional text.
`;

    const briefing = await this.gemini.generateJSON<DailyBriefing>(prompt, false);
    return briefing;
  }

  /**
   * Detect anomalies in business data
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const recentData = await this.getRecentBusinessMetrics(30);

    const prompt = `
Analyze these business metrics and detect anomalies or unusual patterns:

Daily Metrics (Last 30 Days):
${JSON.stringify(recentData, null, 2)}

Identify anomalies in:
1. Sales volumes (sudden spikes or drops)
2. Order values (unusually high or low orders)
3. Customer behavior (changes in purchase patterns)
4. Inventory movements (unexpected stock changes)
5. Payment delays (increasing overdue amounts)

For each anomaly detected, provide:
- Type of anomaly
- Severity level (low, medium, high, critical)
- Description of what's unusual
- Affected entity (product, customer, etc.)
- Recommended action

Return JSON array:
[
  {
    "type": "anomaly_type",
    "severity": "low|medium|high|critical",
    "description": "what's unusual",
    "affectedEntity": "entity name or ID",
    "recommendedAction": "what to do",
    "detectedAt": "${new Date().toISOString()}"
  }
]

Return ONLY the JSON array, no additional text. If no anomalies detected, return empty array.
`;

    const anomalies = await this.gemini.generateJSON<Anomaly[]>(prompt, false);
    return anomalies;
  }

  /**
   * Answer business questions using conversational AI
   */
  async answerBusinessQuestion(question: string): Promise<string> {
    // Get relevant context based on the question
    const context = await this.getRelevantContext(question);

    const prompt = `
Answer this business question using the provided data:

Question: ${question}

Available Data:
${JSON.stringify(context, null, 2)}

Provide a clear, data-driven answer with:
1. Direct answer to the question
2. Supporting data and numbers
3. Relevant insights or trends
4. Actionable recommendations if applicable

Format the response in a conversational, professional tone.
`;

    const answer = await this.gemini.generateContent(prompt, false);
    return answer;
  }

  /**
   * Identify hidden patterns in customer behavior
   */
  async identifyCustomerPatterns(): Promise<{
    segments: Array<{ name: string; characteristics: string[]; size: number }>;
    insights: string[];
    recommendations: string[];
  }> {
    const customers = await db.customers.toArray();
    const orders = await db.orders.toArray();

    // Aggregate customer data
    const customerData = customers.map(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id);
      const totalRevenue = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const avgOrderValue = totalRevenue / (customerOrders.length || 1);
      const lastOrderDate = customerOrders.length > 0
        ? Math.max(...customerOrders.map(o => o.orderDate.getTime()))
        : 0;
      const daysSinceLastOrder = (Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24);

      return {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        segment: customer.segment,
        orderCount: customerOrders.length,
        totalRevenue,
        avgOrderValue,
        daysSinceLastOrder,
      };
    });

    const prompt = `
Analyze customer data and identify hidden patterns and segments:

Customer Data Summary:
${JSON.stringify(customerData.slice(0, 50), null, 2)}

Total Customers: ${customers.length}
Total Orders: ${orders.length}

Identify:
1. Natural customer segments based on behavior patterns
2. Common characteristics within each segment
3. Insights about customer behavior
4. Recommendations for each segment

Return JSON format:
{
  "segments": [
    {
      "name": "segment name",
      "characteristics": ["char1", "char2"],
      "size": number
    }
  ],
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"]
}

Return ONLY the JSON object, no additional text.
`;

    const result = await this.gemini.generateJSON<{
      segments: Array<{ name: string; characteristics: string[]; size: number }>;
      insights: string[];
      recommendations: string[];
    }>(prompt);

    return result;
  }

  /**
   * Analyze product performance across multiple dimensions
   */
  async analyzeProductPerformance(): Promise<Array<{
    product: string;
    profitabilityScore: number;
    turnoverScore: number;
    overallRank: number;
    insights: string[];
  }>> {
    const products = await db.products.where('isActive').equals(1).toArray();
    const orders = await db.orders.toArray();

    // Calculate metrics for each product
    const productMetrics = products.map(product => {
      const productOrders = orders.flatMap(o => 
        o.items.filter(item => item.productId === product.id)
      );

      const totalRevenue = productOrders.reduce((sum, item) => sum + item.total, 0);
      const totalQuantity = productOrders.reduce((sum, item) => sum + item.quantity, 0);
      const profitMargin = ((product.unitPrice - product.costPrice) / product.unitPrice) * 100;
      const turnoverRate = totalQuantity / (product.stockQuantity || 1);

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        totalRevenue,
        totalQuantity,
        profitMargin,
        turnoverRate,
        stockQuantity: product.stockQuantity,
      };
    });

    const prompt = `
Analyze product performance and provide rankings:

Product Metrics:
${JSON.stringify(productMetrics, null, 2)}

Evaluate each product on:
1. Profitability (profit margin and total profit)
2. Turnover rate (how quickly it sells)
3. Overall business value

Return JSON array with rankings:
[
  {
    "product": "product name",
    "profitabilityScore": number (0-100),
    "turnoverScore": number (0-100),
    "overallRank": number,
    "insights": ["insight1", "insight2"]
  }
]

Sort by overallRank ascending (1 is best).
Return ONLY the JSON array, no additional text.
`;

    const rankings = await this.gemini.generateJSON<Array<{
      product: string;
      profitabilityScore: number;
      turnoverScore: number;
      overallRank: number;
      insights: string[];
    }>>(prompt);

    return rankings;
  }

  /**
   * Predict potential supply chain disruptions
   */
  async predictSupplyChainRisks(): Promise<Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    affectedProducts: string[];
    probability: number;
    mitigation: string[];
  }>> {
    const [products, inventory, purchaseOrders] = await Promise.all([
      db.products.toArray(),
      db.inventory.toArray(),
      db.purchaseOrders.toArray(),
    ]);

    const prompt = `
Analyze supply chain data and predict potential disruptions:

Products: ${products.length} items
Inventory Levels: ${JSON.stringify(inventory.slice(0, 20), null, 2)}
Recent Purchase Orders: ${JSON.stringify(purchaseOrders.slice(0, 10), null, 2)}

Identify potential risks:
1. Stock-out risks (products likely to run out)
2. Supplier delays (based on PO patterns)
3. Demand spikes (products with increasing orders)
4. Quality issues (if any patterns suggest problems)

Return JSON array:
[
  {
    "risk": "description of risk",
    "severity": "low|medium|high",
    "affectedProducts": ["product1", "product2"],
    "probability": number (0-1),
    "mitigation": ["action1", "action2"]
  }
]

Return ONLY the JSON array, no additional text.
`;

    const risks = await this.gemini.generateJSON<Array<{
      risk: string;
      severity: 'low' | 'medium' | 'high';
      affectedProducts: string[];
      probability: number;
      mitigation: string[];
    }>>(prompt);

    return risks;
  }

  /**
   * Provide root cause analysis for negative trends
   */
  async analyzeNegativeTrend(
    metric: 'revenue' | 'orders' | 'customers',
    period: number = 30
  ): Promise<{
    trend: string;
    rootCauses: string[];
    recommendations: string[];
    confidence: number;
  }> {
    const metrics = await this.getRecentBusinessMetrics(period);

    const prompt = `
Analyze the declining trend in ${metric} and identify root causes:

Recent Metrics (Last ${period} Days):
${JSON.stringify(metrics, null, 2)}

Perform root cause analysis:
1. Identify the trend pattern
2. List potential root causes
3. Provide actionable recommendations
4. Estimate confidence in the analysis

Return JSON format:
{
  "trend": "description of the trend",
  "rootCauses": ["cause1", "cause2", "cause3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "confidence": number (0-1)
}

Return ONLY the JSON object, no additional text.
`;

    const analysis = await this.gemini.generateJSON<{
      trend: string;
      rootCauses: string[];
      recommendations: string[];
      confidence: number;
    }>(prompt);

    return analysis;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get yesterday's sales data
   */
  private async getYesterdaySales(): Promise<{
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await db.orders
      .where('orderDate')
      .between(yesterday, today)
      .and(o => o.status !== 'cancelled')
      .toArray();

    const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

    return {
      revenue,
      orders: orders.length,
      avgOrderValue,
    };
  }

  /**
   * Get new orders since a specific date
   */
  private async getNewOrders(since: Date): Promise<Array<{
    orderId: string;
    customerName: string;
    totalAmount: number;
  }>> {
    const orders = await db.orders
      .where('orderDate')
      .above(since)
      .toArray();

    const ordersWithCustomers = await Promise.all(
      orders.map(async (order) => {
        const customer = await db.customers.get(order.customerId);
        return {
          orderId: order.orderId,
          customerName: customer?.name || 'Unknown',
          totalAmount: order.totalAmount,
        };
      })
    );

    return ordersWithCustomers;
  }

  /**
   * Get low stock products
   */
  private async getLowStockProducts(): Promise<Array<{
    name: string;
    currentStock: number;
    reorderLevel: number;
  }>> {
    const products = await db.products
      .where('isActive')
      .equals(1)
      .and(p => p.stockQuantity <= p.reorderLevel)
      .toArray();

    return products.map(p => ({
      name: p.name,
      currentStock: p.stockQuantity,
      reorderLevel: p.reorderLevel,
    }));
  }

  /**
   * Get overdue payments
   */
  private async getOverduePayments(): Promise<Array<{
    invoiceId: string;
    customerName: string;
    amount: number;
    daysOverdue: number;
  }>> {
    const today = new Date();
    const invoices = await db.invoices
      .where('status')
      .anyOf(['unpaid', 'partially-paid'])
      .and(inv => inv.dueDate < today)
      .toArray();

    const overdueWithCustomers = await Promise.all(
      invoices.map(async (invoice) => {
        const customer = await db.customers.get(invoice.customerId);
        const daysOverdue = Math.floor(
          (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          invoiceId: invoice.invoiceId,
          customerName: customer?.name || 'Unknown',
          amount: invoice.balanceAmount,
          daysOverdue,
        };
      })
    );

    return overdueWithCustomers;
  }

  /**
   * Get products expiring soon
   */
  private async getExpiringProducts(days: number): Promise<Array<{
    name: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const products = await db.products
      .where('isActive')
      .equals(1)
      .and(p => p.expiryDate !== undefined && p.expiryDate <= futureDate)
      .toArray();

    const today = new Date();
    return products
      .filter(p => p.expiryDate !== undefined)
      .map(p => ({
        name: p.name,
        expiryDate: p.expiryDate!,
        daysUntilExpiry: Math.floor(
          (p.expiryDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
  }

  /**
   * Get top customers by revenue
   */
  private async getTopCustomers(days: number): Promise<Array<{
    name: string;
    revenue: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db.orders
      .where('orderDate')
      .above(startDate)
      .and(o => o.status !== 'cancelled')
      .toArray();

    const customerRevenue = new Map<string, number>();

    orders.forEach(order => {
      const current = customerRevenue.get(order.customerId) || 0;
      customerRevenue.set(order.customerId, current + order.totalAmount);
    });

    const topCustomerIds = Array.from(customerRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topCustomers = await Promise.all(
      topCustomerIds.map(async (id) => {
        const customer = await db.customers.get(id);
        return {
          name: customer?.name || 'Unknown',
          revenue: customerRevenue.get(id) || 0,
        };
      })
    );

    return topCustomers;
  }

  /**
   * Get recent business metrics
   */
  private async getRecentBusinessMetrics(days: number): Promise<BusinessMetrics[]> {
    const metrics: BusinessMetrics[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await db.orders
        .where('orderDate')
        .between(date, nextDate)
        .and(o => o.status !== 'cancelled')
        .toArray();

      const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const avgOrderValue = dayOrders.length > 0 ? revenue / dayOrders.length : 0;

      metrics.push({
        revenue,
        orders: dayOrders.length,
        customers: new Set(dayOrders.map(o => o.customerId)).size,
        avgOrderValue,
        topProducts: [],
        lowStockCount: 0,
        overduePayments: 0,
      });
    }

    return metrics.reverse();
  }

  /**
   * Get relevant context for answering questions
   */
  private async getRelevantContext(question: string): Promise<any> {
    const lowerQuestion = question.toLowerCase();

    const context: any = {};

    // Determine what data to include based on question keywords
    if (lowerQuestion.includes('revenue') || lowerQuestion.includes('sales')) {
      const recentOrders = await db.orders
        .orderBy('orderDate')
        .reverse()
        .limit(50)
        .toArray();
      context.recentOrders = recentOrders;
    }

    if (lowerQuestion.includes('customer')) {
      const customers = await db.customers.limit(50).toArray();
      context.customers = customers;
    }

    if (lowerQuestion.includes('product') || lowerQuestion.includes('inventory')) {
      const products = await db.products.limit(50).toArray();
      context.products = products;
    }

    if (lowerQuestion.includes('stock') || lowerQuestion.includes('inventory')) {
      const inventory = await db.inventory.limit(50).toArray();
      context.inventory = inventory;
    }

    // Always include summary statistics
    context.summary = {
      totalProducts: await db.products.count(),
      totalCustomers: await db.customers.count(),
      totalOrders: await db.orders.count(),
      activeOrders: await db.orders.where('status').notEqual('completed').count(),
    };

    return context;
  }
}
