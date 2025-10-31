// Predefined Reports Service
// Generates standard business reports with data from the database

import { db } from '@/lib/db/schema';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/formatters';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// ============================================================================
// MONTHLY SALES REPORT
// ============================================================================

export interface MonthlySalesReport {
  period: {
    start: Date;
    end: Date;
    month: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalProfit: number;
    profitMargin: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    orderCount: number;
    percentage: number;
  }>;
  salesByCustomer: Array<{
    customerId: string;
    customerName: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  dailyTrend: Array<{
    date: Date;
    revenue: number;
    orders: number;
  }>;
}

export async function generateMonthlySalesReport(
  month?: Date
): Promise<MonthlySalesReport> {
  const targetMonth = month || new Date();
  const periodStart = startOfMonth(targetMonth);
  const periodEnd = endOfMonth(targetMonth);

  // Get all orders for the period
  const orders = await db.orders
    .where('orderDate')
    .between(periodStart, periodEnd, true, true)
    .toArray();

  // Get all sales for the period
  const sales = await db.sales
    .where('saleDate')
    .between(periodStart, periodEnd, true, true)
    .toArray();

  // Calculate summary
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  // Calculate top products
  const productSales = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();
  
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productSales.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
        cost: 0
      };
      
      const product = await db.products.get(item.productId);
      const itemCost = product ? product.costPrice * item.quantity : 0;
      
      productSales.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.total,
        cost: existing.cost + itemCost
      });
    }
  }

  const topProducts = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: data.revenue,
      profit: data.revenue - data.cost
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Calculate sales by category
  const categorySales = new Map<string, { revenue: number; orderCount: number }>();
  
  for (const order of orders) {
    for (const item of order.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        const category = product.category;
        const existing = categorySales.get(category) || { revenue: 0, orderCount: 0 };
        categorySales.set(category, {
          revenue: existing.revenue + item.total,
          orderCount: existing.orderCount + 1
        });
      }
    }
  }

  const salesByCategory = Array.from(categorySales.entries())
    .map(([category, data]) => ({
      category,
      revenue: data.revenue,
      orderCount: data.orderCount,
      percentage: totalRevenue > 0 ? data.revenue / totalRevenue : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Calculate sales by customer
  const customerSales = new Map<string, { name: string; orderCount: number; revenue: number }>();
  
  for (const order of orders) {
    const customer = await db.customers.get(order.customerId);
    if (customer) {
      const existing = customerSales.get(order.customerId) || {
        name: customer.name,
        orderCount: 0,
        revenue: 0
      };
      customerSales.set(order.customerId, {
        name: customer.name,
        orderCount: existing.orderCount + 1,
        revenue: existing.revenue + order.totalAmount
      });
    }
  }

  const salesByCustomer = Array.from(customerSales.entries())
    .map(([customerId, data]) => ({
      customerId,
      customerName: data.name,
      orderCount: data.orderCount,
      totalRevenue: data.revenue
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Calculate daily trend
  const dailySales = new Map<string, { revenue: number; orders: number }>();
  
  for (const order of orders) {
    const dateKey = formatDate(order.orderDate);
    const existing = dailySales.get(dateKey) || { revenue: 0, orders: 0 };
    dailySales.set(dateKey, {
      revenue: existing.revenue + order.totalAmount,
      orders: existing.orders + 1
    });
  }

  const dailyTrend = Array.from(dailySales.entries())
    .map(([dateStr, data]) => ({
      date: new Date(dateStr),
      revenue: data.revenue,
      orders: data.orders
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      month: periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })
    },
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProfit,
      profitMargin
    },
    topProducts,
    salesByCategory,
    salesByCustomer,
    dailyTrend
  };
}

// ============================================================================
// INVENTORY VALUATION REPORT
// ============================================================================

export interface InventoryValuationReport {
  generatedAt: Date;
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    totalCost: number;
    potentialProfit: number;
  };
  byCategory: Array<{
    category: string;
    itemCount: number;
    quantity: number;
    value: number;
    percentage: number;
  }>;
  byLocation: Array<{
    location: string;
    itemCount: number;
    quantity: number;
    value: number;
  }>;
  lowStockItems: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    reorderLevel: number;
    value: number;
  }>;
  expiringItems: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    expiryDate: Date;
    daysUntilExpiry: number;
    value: number;
  }>;
  agingAnalysis: {
    lessThan30Days: { items: number; value: number };
    days30To60: { items: number; value: number };
    days60To90: { items: number; value: number };
    moreThan90Days: { items: number; value: number };
  };
}

export async function generateInventoryValuationReport(): Promise<InventoryValuationReport> {
  const products = await db.products.where('isActive').equals(1).toArray();
  const inventory = await db.inventory.toArray();

  // Create inventory map
  const inventoryMap = new Map(inventory.map(inv => [inv.productId, inv]));

  // Calculate summary
  let totalItems = 0;
  let totalQuantity = 0;
  let totalValue = 0;
  let totalCost = 0;

  const categoryData = new Map<string, { itemCount: number; quantity: number; value: number }>();
  const locationData = new Map<string, { itemCount: number; quantity: number; value: number }>();
  const lowStockItems: any[] = [];
  const expiringItems: any[] = [];

  const today = new Date();
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (const product of products) {
    const inv = inventoryMap.get(product.id);
    const quantity = inv?.quantity || 0;
    const value = quantity * product.unitPrice;
    const cost = quantity * product.costPrice;

    totalItems++;
    totalQuantity += quantity;
    totalValue += value;
    totalCost += cost;

    // By category
    const catData = categoryData.get(product.category) || { itemCount: 0, quantity: 0, value: 0 };
    categoryData.set(product.category, {
      itemCount: catData.itemCount + 1,
      quantity: catData.quantity + quantity,
      value: catData.value + value
    });

    // By location
    if (inv) {
      const locData = locationData.get(inv.warehouseLocation) || { itemCount: 0, quantity: 0, value: 0 };
      locationData.set(inv.warehouseLocation, {
        itemCount: locData.itemCount + 1,
        quantity: locData.quantity + quantity,
        value: locData.value + value
      });
    }

    // Low stock items
    if (quantity <= product.reorderLevel) {
      lowStockItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        reorderLevel: product.reorderLevel,
        value
      });
    }

    // Expiring items
    if (product.expiryDate && product.expiryDate <= ninetyDaysFromNow) {
      const daysUntilExpiry = Math.ceil((product.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      expiringItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        expiryDate: product.expiryDate,
        daysUntilExpiry,
        value
      });
    }
  }

  const byCategory = Array.from(categoryData.entries())
    .map(([category, data]) => ({
      category,
      itemCount: data.itemCount,
      quantity: data.quantity,
      value: data.value,
      percentage: totalValue > 0 ? data.value / totalValue : 0
    }))
    .sort((a, b) => b.value - a.value);

  const byLocation = Array.from(locationData.entries())
    .map(([location, data]) => ({
      location,
      itemCount: data.itemCount,
      quantity: data.quantity,
      value: data.value
    }))
    .sort((a, b) => b.value - a.value);

  // Aging analysis (simplified - based on last restocked date)
  const agingAnalysis = {
    lessThan30Days: { items: 0, value: 0 },
    days30To60: { items: 0, value: 0 },
    days60To90: { items: 0, value: 0 },
    moreThan90Days: { items: 0, value: 0 }
  };

  for (const inv of inventory) {
    const product = products.find(p => p.id === inv.productId);
    if (!product) continue;

    const daysSinceRestock = Math.ceil((today.getTime() - inv.lastRestocked.getTime()) / (24 * 60 * 60 * 1000));
    const value = inv.quantity * product.unitPrice;

    if (daysSinceRestock < 30) {
      agingAnalysis.lessThan30Days.items++;
      agingAnalysis.lessThan30Days.value += value;
    } else if (daysSinceRestock < 60) {
      agingAnalysis.days30To60.items++;
      agingAnalysis.days30To60.value += value;
    } else if (daysSinceRestock < 90) {
      agingAnalysis.days60To90.items++;
      agingAnalysis.days60To90.value += value;
    } else {
      agingAnalysis.moreThan90Days.items++;
      agingAnalysis.moreThan90Days.value += value;
    }
  }

  return {
    generatedAt: new Date(),
    summary: {
      totalItems,
      totalQuantity,
      totalValue,
      totalCost,
      potentialProfit: totalValue - totalCost
    },
    byCategory,
    byLocation,
    lowStockItems: lowStockItems.sort((a, b) => a.quantity - b.quantity),
    expiringItems: expiringItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    agingAnalysis
  };
}

// ============================================================================
// CUSTOMER PURCHASE HISTORY REPORT
// ============================================================================

export interface CustomerPurchaseHistoryReport {
  customerId: string;
  customerName: string;
  customerType: string;
  generatedAt: Date;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    firstOrderDate: Date;
    lastOrderDate: Date;
    daysSinceLastOrder: number;
  };
  orders: Array<{
    orderId: string;
    orderDate: Date;
    status: string;
    totalAmount: number;
    itemCount: number;
  }>;
  topProducts: Array<{
    productName: string;
    quantityPurchased: number;
    totalSpent: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    orderCount: number;
    revenue: number;
  }>;
}

export async function generateCustomerPurchaseHistoryReport(
  customerId: string
): Promise<CustomerPurchaseHistoryReport> {
  const customer = await db.customers.get(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const orders = await db.orders
    .where('customerId')
    .equals(customerId)
    .toArray();

  orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

  // Calculate summary
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].orderDate : new Date();
  const lastOrderDate = orders.length > 0 ? orders[0].orderDate : new Date();
  const daysSinceLastOrder = Math.ceil((new Date().getTime() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate top products
  const productPurchases = new Map<string, { quantity: number; spent: number }>();
  
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productPurchases.get(item.productName) || { quantity: 0, spent: 0 };
      productPurchases.set(item.productName, {
        quantity: existing.quantity + item.quantity,
        spent: existing.spent + item.total
      });
    }
  }

  const topProducts = Array.from(productPurchases.entries())
    .map(([productName, data]) => ({
      productName,
      quantityPurchased: data.quantity,
      totalSpent: data.spent
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Calculate monthly trend
  const monthlyData = new Map<string, { orderCount: number; revenue: number }>();
  
  for (const order of orders) {
    const monthKey = order.orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    const existing = monthlyData.get(monthKey) || { orderCount: 0, revenue: 0 };
    monthlyData.set(monthKey, {
      orderCount: existing.orderCount + 1,
      revenue: existing.revenue + order.totalAmount
    });
  }

  const monthlyTrend = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      orderCount: data.orderCount,
      revenue: data.revenue
    }));

  return {
    customerId: customer.id,
    customerName: customer.name,
    customerType: customer.type,
    generatedAt: new Date(),
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      firstOrderDate,
      lastOrderDate,
      daysSinceLastOrder
    },
    orders: orders.map(order => ({
      orderId: order.orderId,
      orderDate: order.orderDate,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.length
    })),
    topProducts,
    monthlyTrend
  };
}

// ============================================================================
// PROFIT & LOSS STATEMENT
// ============================================================================

export interface ProfitLossStatement {
  period: {
    start: Date;
    end: Date;
    description: string;
  };
  revenue: {
    grossSales: number;
    returns: number;
    discounts: number;
    netSales: number;
  };
  costOfGoodsSold: {
    beginningInventory: number;
    purchases: number;
    endingInventory: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  operatingIncome: number;
  netIncome: number;
  netProfitMargin: number;
}

export async function generateProfitLossStatement(
  startDate: Date,
  endDate: Date
): Promise<ProfitLossStatement> {
  // Get all sales for the period
  const sales = await db.sales
    .where('saleDate')
    .between(startDate, endDate, true, true)
    .toArray();

  // Get all orders for the period
  const orders = await db.orders
    .where('orderDate')
    .between(startDate, endDate, true, true)
    .toArray();

  // Calculate revenue
  const grossSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const discounts = orders.reduce((sum, order) => sum + order.discount, 0);
  const returns = 0; // Would need a returns table in real implementation
  const netSales = grossSales - returns - discounts;

  // Calculate COGS (simplified)
  const totalCOGS = sales.reduce((sum, sale) => sum + sale.costAmount, 0);
  
  // For beginning and ending inventory, we'd need historical data
  // This is a simplified calculation
  const beginningInventory = 0;
  const purchases = 0;
  const endingInventory = 0;

  // Calculate gross profit
  const grossProfit = netSales - totalCOGS;
  const grossProfitMargin = netSales > 0 ? grossProfit / netSales : 0;

  // Operating expenses (would come from an expenses table in real implementation)
  const operatingExpenses = {
    salaries: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    other: 0,
    total: 0
  };

  // Calculate operating income and net income
  const operatingIncome = grossProfit - operatingExpenses.total;
  const netIncome = operatingIncome;
  const netProfitMargin = netSales > 0 ? netIncome / netSales : 0;

  return {
    period: {
      start: startDate,
      end: endDate,
      description: `${formatDate(startDate)} - ${formatDate(endDate)}`
    },
    revenue: {
      grossSales,
      returns,
      discounts,
      netSales
    },
    costOfGoodsSold: {
      beginningInventory,
      purchases,
      endingInventory,
      totalCOGS
    },
    grossProfit,
    grossProfitMargin,
    operatingExpenses,
    operatingIncome,
    netIncome,
    netProfitMargin
  };
}

// ============================================================================
// MEDICAL RECORDS SUMMARY REPORT
// ============================================================================

export interface MedicalRecordsSummaryReport {
  generatedAt: Date;
  summary: {
    totalPatients: number;
    totalRecords: number;
    recordsThisMonth: number;
    averageRecordsPerPatient: number;
  };
  patientDemographics: {
    byGender: Array<{ gender: string; count: number; percentage: number }>;
    byAgeGroup: Array<{ ageGroup: string; count: number; percentage: number }>;
  };
  commonDiagnoses: Array<{
    diagnosis: string;
    count: number;
    percentage: number;
  }>;
  medicationUsage: Array<{
    medication: string;
    prescriptionCount: number;
    patientCount: number;
  }>;
  recordsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  visitFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export async function generateMedicalRecordsSummaryReport(): Promise<MedicalRecordsSummaryReport> {
  const patients = await db.patients.toArray();
  const records = await db.medicalRecords.toArray();

  const thisMonth = startOfMonth(new Date());
  const recordsThisMonth = records.filter(r => r.visitDate >= thisMonth).length;

  // Patient demographics
  const genderCounts = new Map<string, number>();
  const ageGroups = new Map<string, number>();

  for (const patient of patients) {
    // Gender
    genderCounts.set(patient.gender, (genderCounts.get(patient.gender) || 0) + 1);

    // Age groups
    const age = patient.age || 0;
    let ageGroup = '';
    if (age < 18) ageGroup = '0-17';
    else if (age < 30) ageGroup = '18-29';
    else if (age < 45) ageGroup = '30-44';
    else if (age < 60) ageGroup = '45-59';
    else ageGroup = '60+';
    
    ageGroups.set(ageGroup, (ageGroups.get(ageGroup) || 0) + 1);
  }

  const byGender = Array.from(genderCounts.entries()).map(([gender, count]) => ({
    gender,
    count,
    percentage: patients.length > 0 ? count / patients.length : 0
  }));

  const byAgeGroup = Array.from(ageGroups.entries()).map(([ageGroup, count]) => ({
    ageGroup,
    count,
    percentage: patients.length > 0 ? count / patients.length : 0
  }));

  // Common diagnoses
  const diagnosisCounts = new Map<string, number>();
  for (const record of records) {
    if (record.diagnosis) {
      diagnosisCounts.set(record.diagnosis, (diagnosisCounts.get(record.diagnosis) || 0) + 1);
    }
  }

  const commonDiagnoses = Array.from(diagnosisCounts.entries())
    .map(([diagnosis, count]) => ({
      diagnosis,
      count,
      percentage: records.length > 0 ? count / records.length : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Medication usage
  const medicationCounts = new Map<string, Set<string>>();
  for (const record of records) {
    if (record.medications) {
      for (const med of record.medications) {
        if (!medicationCounts.has(med.name)) {
          medicationCounts.set(med.name, new Set());
        }
        medicationCounts.get(med.name)!.add(record.patientId);
      }
    }
  }

  const medicationUsage = Array.from(medicationCounts.entries())
    .map(([medication, patientSet]) => ({
      medication,
      prescriptionCount: patientSet.size,
      patientCount: patientSet.size
    }))
    .sort((a, b) => b.prescriptionCount - a.prescriptionCount)
    .slice(0, 10);

  // Records by type
  const typeCounts = new Map<string, number>();
  for (const record of records) {
    typeCounts.set(record.recordType, (typeCounts.get(record.recordType) || 0) + 1);
  }

  const recordsByType = Array.from(typeCounts.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: records.length > 0 ? count / records.length : 0
  }));

  // Visit frequency (simplified)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = subMonths(now, 1);

  const visitFrequency = {
    daily: records.filter(r => r.visitDate >= oneDayAgo).length,
    weekly: records.filter(r => r.visitDate >= oneWeekAgo).length,
    monthly: records.filter(r => r.visitDate >= oneMonthAgo).length
  };

  return {
    generatedAt: new Date(),
    summary: {
      totalPatients: patients.length,
      totalRecords: records.length,
      recordsThisMonth,
      averageRecordsPerPatient: patients.length > 0 ? records.length / patients.length : 0
    },
    patientDemographics: {
      byGender,
      byAgeGroup
    },
    commonDiagnoses,
    medicationUsage,
    recordsByType,
    visitFrequency
  };
}
