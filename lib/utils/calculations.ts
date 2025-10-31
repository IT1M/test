// ============================================================================
// Order Calculations
// ============================================================================

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
}

/**
 * Calculates item total (quantity * unitPrice - discount)
 */
export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  const subtotal = quantity * unitPrice;
  return Math.max(0, subtotal - discount);
}

/**
 * Calculates order subtotal (sum of all item totals before discount and tax)
 */
export function calculateOrderSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

/**
 * Calculates discount amount based on type
 */
export function calculateDiscountAmount(
  subtotal: number,
  discount: number,
  discountType: 'percentage' | 'fixed' = 'fixed'
): number {
  if (discountType === 'percentage') {
    return (subtotal * discount) / 100;
  }
  return discount;
}

/**
 * Calculates tax amount
 */
export function calculateTaxAmount(
  subtotal: number,
  taxRate: number
): number {
  return (subtotal * taxRate) / 100;
}

/**
 * Calculates complete order totals
 */
export function calculateOrderTotal(
  items: OrderItem[],
  discount: number = 0,
  discountType: 'percentage' | 'fixed' = 'fixed',
  taxRate: number = 0
): OrderTotals {
  const subtotal = calculateOrderSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, discount, discountType);
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = calculateTaxAmount(amountAfterDiscount, taxRate);
  const totalAmount = amountAfterDiscount + taxAmount;
  
  return {
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    totalAmount,
  };
}

// ============================================================================
// Profit Calculations
// ============================================================================

/**
 * Calculates profit (revenue - cost)
 */
export function calculateProfit(revenue: number, cost: number): number {
  return revenue - cost;
}

/**
 * Calculates profit margin as percentage
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  const profit = calculateProfit(revenue, cost);
  return (profit / revenue) * 100;
}

/**
 * Calculates markup percentage
 */
export function calculateMarkup(sellingPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculates selling price from cost and desired margin
 */
export function calculateSellingPriceFromMargin(
  costPrice: number,
  desiredMarginPercent: number
): number {
  return costPrice / (1 - desiredMarginPercent / 100);
}

/**
 * Calculates selling price from cost and desired markup
 */
export function calculateSellingPriceFromMarkup(
  costPrice: number,
  desiredMarkupPercent: number
): number {
  return costPrice * (1 + desiredMarkupPercent / 100);
}

/**
 * Calculates gross profit for an order
 */
export function calculateOrderProfit(
  items: Array<{ quantity: number; unitPrice: number; costPrice: number }>
): number {
  return items.reduce((total, item) => {
    const revenue = item.quantity * item.unitPrice;
    const cost = item.quantity * item.costPrice;
    return total + (revenue - cost);
  }, 0);
}

// ============================================================================
// Discount Calculations
// ============================================================================

/**
 * Calculates final price after percentage discount
 */
export function applyPercentageDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

/**
 * Calculates final price after fixed discount
 */
export function applyFixedDiscount(price: number, discountAmount: number): number {
  return Math.max(0, price - discountAmount);
}

/**
 * Calculates discount percentage from original and discounted price
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice === 0) return 0;
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
}

/**
 * Calculates bulk discount based on quantity tiers
 */
export function calculateBulkDiscount(
  quantity: number,
  tiers: Array<{ minQuantity: number; discountPercent: number }>
): number {
  // Sort tiers by minQuantity descending
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  
  // Find applicable tier
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return tier.discountPercent;
    }
  }
  
  return 0;
}

// ============================================================================
// Inventory Calculations
// ============================================================================

/**
 * Calculates inventory value using FIFO method
 */
export function calculateInventoryValueFIFO(
  batches: Array<{ quantity: number; costPrice: number }>
): number {
  return batches.reduce((total, batch) => {
    return total + (batch.quantity * batch.costPrice);
  }, 0);
}

/**
 * Calculates average cost per unit
 */
export function calculateAverageCost(
  batches: Array<{ quantity: number; costPrice: number }>
): number {
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = calculateInventoryValueFIFO(batches);
  
  if (totalQuantity === 0) return 0;
  return totalValue / totalQuantity;
}

/**
 * Calculates reorder point (lead time demand + safety stock)
 */
export function calculateReorderPoint(
  averageDailyDemand: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  return Math.ceil(averageDailyDemand * (leadTimeDays + safetyStockDays));
}

/**
 * Calculates economic order quantity (EOQ)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  if (holdingCostPerUnit === 0) return 0;
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
}

/**
 * Calculates inventory turnover ratio
 */
export function calculateInventoryTurnover(
  costOfGoodsSold: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue === 0) return 0;
  return costOfGoodsSold / averageInventoryValue;
}

/**
 * Calculates days inventory outstanding (DIO)
 */
export function calculateDaysInventoryOutstanding(
  averageInventoryValue: number,
  costOfGoodsSold: number,
  days: number = 365
): number {
  if (costOfGoodsSold === 0) return 0;
  return (averageInventoryValue / costOfGoodsSold) * days;
}

/**
 * Calculates stock availability percentage
 */
export function calculateStockAvailability(
  currentStock: number,
  reorderLevel: number
): number {
  if (reorderLevel === 0) return 100;
  return Math.min(100, (currentStock / reorderLevel) * 100);
}

// ============================================================================
// Financial Calculations
// ============================================================================

/**
 * Calculates days sales outstanding (DSO)
 */
export function calculateDaysSalesOutstanding(
  accountsReceivable: number,
  totalCreditSales: number,
  days: number = 365
): number {
  if (totalCreditSales === 0) return 0;
  return (accountsReceivable / totalCreditSales) * days;
}

/**
 * Calculates return on investment (ROI)
 */
export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
}

/**
 * Calculates break-even point in units
 */
export function calculateBreakEvenUnits(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  if (contributionMargin === 0) return 0;
  return Math.ceil(fixedCosts / contributionMargin);
}

/**
 * Calculates break-even point in revenue
 */
export function calculateBreakEvenRevenue(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number {
  const units = calculateBreakEvenUnits(fixedCosts, pricePerUnit, variableCostPerUnit);
  return units * pricePerUnit;
}

/**
 * Calculates contribution margin
 */
export function calculateContributionMargin(
  revenue: number,
  variableCosts: number
): number {
  return revenue - variableCosts;
}

/**
 * Calculates contribution margin ratio
 */
export function calculateContributionMarginRatio(
  revenue: number,
  variableCosts: number
): number {
  if (revenue === 0) return 0;
  const contributionMargin = calculateContributionMargin(revenue, variableCosts);
  return (contributionMargin / revenue) * 100;
}

// ============================================================================
// Customer Analytics Calculations
// ============================================================================

/**
 * Calculates customer lifetime value (CLV)
 */
export function calculateCustomerLifetimeValue(
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespanYears: number
): number {
  return averageOrderValue * purchaseFrequency * customerLifespanYears;
}

/**
 * Calculates customer acquisition cost (CAC)
 */
export function calculateCustomerAcquisitionCost(
  totalMarketingCost: number,
  newCustomersAcquired: number
): number {
  if (newCustomersAcquired === 0) return 0;
  return totalMarketingCost / newCustomersAcquired;
}

/**
 * Calculates customer retention rate
 */
export function calculateRetentionRate(
  customersAtStart: number,
  customersAtEnd: number,
  newCustomers: number
): number {
  if (customersAtStart === 0) return 0;
  return ((customersAtEnd - newCustomers) / customersAtStart) * 100;
}

/**
 * Calculates churn rate
 */
export function calculateChurnRate(
  customersAtStart: number,
  customersLost: number
): number {
  if (customersAtStart === 0) return 0;
  return (customersLost / customersAtStart) * 100;
}

/**
 * Calculates average order value
 */
export function calculateAverageOrderValue(
  totalRevenue: number,
  numberOfOrders: number
): number {
  if (numberOfOrders === 0) return 0;
  return totalRevenue / numberOfOrders;
}

/**
 * Calculates purchase frequency
 */
export function calculatePurchaseFrequency(
  numberOfOrders: number,
  numberOfCustomers: number
): number {
  if (numberOfCustomers === 0) return 0;
  return numberOfOrders / numberOfCustomers;
}

// ============================================================================
// Payment Calculations
// ============================================================================

/**
 * Calculates payment due date from invoice date and terms
 */
export function calculatePaymentDueDate(
  invoiceDate: Date,
  paymentTerms: string
): Date {
  const dueDate = new Date(invoiceDate);
  
  // Parse payment terms (e.g., "Net 30", "Net 60")
  const match = paymentTerms.match(/Net (\d+)/i);
  if (match) {
    const days = parseInt(match[1], 10);
    dueDate.setDate(dueDate.getDate() + days);
  }
  
  return dueDate;
}

/**
 * Calculates days overdue
 */
export function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  if (today <= due) return 0;
  
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates late payment fee
 */
export function calculateLateFee(
  invoiceAmount: number,
  daysOverdue: number,
  feePercentPerMonth: number = 1.5
): number {
  if (daysOverdue <= 0) return 0;
  
  const months = daysOverdue / 30;
  return (invoiceAmount * feePercentPerMonth * months) / 100;
}

/**
 * Calculates outstanding balance
 */
export function calculateOutstandingBalance(
  invoiceAmount: number,
  paidAmount: number
): number {
  return Math.max(0, invoiceAmount - paidAmount);
}

// ============================================================================
// Statistical Calculations
// ============================================================================

/**
 * Calculates average (mean)
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates median
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculates standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculates percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculates growth rate
 */
export function calculateGrowthRate(
  startValue: number,
  endValue: number,
  periods: number
): number {
  if (startValue === 0 || periods === 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

/**
 * Calculates compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  beginningValue: number,
  endingValue: number,
  years: number
): number {
  if (beginningValue === 0 || years === 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
}

// ============================================================================
// Forecasting Calculations
// ============================================================================

/**
 * Calculates simple moving average
 */
export function calculateMovingAverage(values: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      result.push(calculateAverage(slice));
    }
  }
  
  return result;
}

/**
 * Calculates exponential moving average
 */
export function calculateExponentialMovingAverage(
  values: number[],
  period: number
): number[] {
  if (values.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const result: number[] = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }
  
  return result;
}

/**
 * Calculates linear trend forecast
 */
export function calculateLinearTrend(values: number[], periodsAhead: number = 1): number {
  if (values.length < 2) return values[0] || 0;
  
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  // Calculate slope and intercept
  const xMean = calculateAverage(xValues);
  const yMean = calculateAverage(values);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  // Forecast
  return slope * (n + periodsAhead - 1) + intercept;
}

// ============================================================================
// Utility Calculation Functions
// ============================================================================

/**
 * Rounds to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamps value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates percentage of total
 */
export function calculatePercentageOfTotal(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}
