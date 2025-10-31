// System Optimization Service
// AI-powered system monitoring, predictive maintenance, and optimization

import { getGeminiService } from './client';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Type Definitions
// ============================================

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  databaseSize: number;
  cacheSize: number;
  apiCallsToday: number;
  errorRate: number;
  averageQueryTime: number;
  slowQueries: SlowQuery[];
  memoryUsage?: number;
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  entityType: string;
}

/**
 * Database growth prediction
 */
interface DatabaseGrowthPrediction {
  currentSize: number;
  predictedSizeIn30Days: number;
  predictedSizeIn90Days: number;
  growthRate: number; // bytes per day
  alertLevel: 'normal' | 'warning' | 'critical';
  recommendation: string;
}

/**
 * Query optimization suggestion
 */
interface QueryOptimization {
  query: string;
  currentPerformance: string;
  issue: string;
  suggestedOptimization: string;
  expectedImprovement: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Error pattern analysis
 */
interface ErrorPattern {
  errorType: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedEntities: string[];
  rootCause: string;
  suggestedFix: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * System health report
 */
export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  metrics: PerformanceMetrics;
  databaseGrowth: DatabaseGrowthPrediction;
  queryOptimizations: QueryOptimization[];
  errorPatterns: ErrorPattern[];
  recommendations: string[];
  proactiveActions: string[];
}

/**
 * Data inconsistency interface
 */
interface DataInconsistency {
  entityType: string;
  entityId: string;
  inconsistencyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

/**
 * Duplicate detection result
 */
interface DuplicateDetection {
  entityType: string;
  duplicates: Array<{
    ids: string[];
    matchScore: number;
    matchingFields: string[];
    suggestedAction: string;
  }>;
}

/**
 * Missing relationship
 */
interface MissingRelationship {
  entityType: string;
  entityId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  relationshipType: string;
  impact: string;
  suggestedFix: string;
}

/**
 * Data cleanup action
 */
interface DataCleanupAction {
  actionType: string;
  description: string;
  affectedEntities: number;
  priority: 'low' | 'medium' | 'high';
  automatable: boolean;
  steps: string[];
}

/**
 * User behavior pattern
 */
interface UserBehaviorPattern {
  userId: string;
  mostUsedFeatures: Array<{ feature: string; usageCount: number }>;
  peakUsageHours: number[];
  averageSessionDuration: number;
  commonWorkflows: string[];
  strugglingAreas: string[];
}

/**
 * UI/UX improvement suggestion
 */
interface UIUXImprovement {
  area: string;
  currentIssue: string;
  suggestedImprovement: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high';
  implementationComplexity: 'easy' | 'medium' | 'complex';
}

/**
 * System load prediction
 */
interface SystemLoadPrediction {
  currentLoad: {
    activeUsers: number;
    requestsPerMinute: number;
    databaseOperations: number;
  };
  predictedPeakLoad: {
    time: Date;
    expectedUsers: number;
    expectedRequests: number;
  };
  scalingRecommendations: string[];
  resourceOptimizations: string[];
}

// ============================================
// System Optimization Service Class
// ============================================

/**
 * System Optimization Service Class
 * Provides AI-powered system monitoring and optimization
 */
export class SystemOptimizationService {
  private gemini = getGeminiService();

  /**
   * Analyze system performance metrics
   * Requirement 22.1: Use Gemini to analyze system performance metrics
   */
  async analyzePerformanceMetrics(): Promise<{
    analysis: string;
    recommendations: string[];
    optimizationActions: string[];
  }> {
    try {
      // Gather performance metrics
      const metrics = await this.collectPerformanceMetrics();

      // Create prompt for Gemini
      const prompt = `You are a system performance analyst. Analyze the following system metrics and provide optimization recommendations.

System Performance Metrics:
- Database Size: ${this.formatBytes(metrics.databaseSize)}
- Cache Size: ${metrics.cacheSize} entries
- API Calls Today: ${metrics.apiCallsToday}
- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
- Average Query Time: ${metrics.averageQueryTime}ms
- Slow Queries: ${metrics.slowQueries.length}

Slow Queries Details:
${metrics.slowQueries.map(q => `- ${q.entityType}: ${q.duration}ms`).join('\n')}

Provide a JSON response with:
{
  "analysis": "Brief analysis of system performance",
  "recommendations": ["List of specific recommendations"],
  "optimizationActions": ["List of immediate actions to take"]
}`;

      const result = await this.gemini.generateJSON<{
        analysis: string;
        recommendations: string[];
        optimizationActions: string[];
      }>(prompt);

      // Log the analysis
      await this.logSystemEvent('performance_analysis', 'success', {
        metrics,
        analysis: result.analysis,
      });

      return result;
    } catch (error) {
      await this.logSystemEvent('performance_analysis', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Predict database size growth
   * Requirement 22.2: Predict database size growth and alert before limits
   */
  async predictDatabaseGrowth(): Promise<DatabaseGrowthPrediction> {
    try {
      // Get historical database size data from logs
      const historicalData = await this.getHistoricalDatabaseSize();
      const currentSize = await this.getCurrentDatabaseSize();

      // Create prompt for Gemini
      const prompt = `You are a database capacity planner. Analyze the database growth pattern and predict future size.

Current Database Size: ${this.formatBytes(currentSize)}

Historical Growth Data (last 30 days):
${historicalData.map(d => `- ${d.date}: ${this.formatBytes(d.size)}`).join('\n')}

Browser IndexedDB typical limits: 
- Chrome: ~60% of available disk space
- Firefox: ~50% of available disk space
- Safari: ~1GB

Provide a JSON response with:
{
  "predictedSizeIn30Days": <size in bytes>,
  "predictedSizeIn90Days": <size in bytes>,
  "growthRate": <bytes per day>,
  "alertLevel": "normal|warning|critical",
  "recommendation": "Detailed recommendation for capacity management"
}`;

      const prediction = await this.gemini.generateJSON<Omit<DatabaseGrowthPrediction, 'currentSize'>>(prompt);

      const result: DatabaseGrowthPrediction = {
        currentSize,
        ...prediction,
      };

      // Log the prediction
      await this.logSystemEvent('database_growth_prediction', 'success', result);

      // Create alert if needed
      if (result.alertLevel === 'warning' || result.alertLevel === 'critical') {
        await this.createAlert('database_capacity', result.alertLevel, result.recommendation);
      }

      return result;
    } catch (error) {
      await this.logSystemEvent('database_growth_prediction', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Detect slow queries and suggest optimizations
   * Requirement 22.4: Detect slow queries and suggest index optimizations
   */
  async analyzeSlowQueries(): Promise<QueryOptimization[]> {
    try {
      // Get slow queries from logs
      const slowQueries = await this.getSlowQueries();

      if (slowQueries.length === 0) {
        return [];
      }

      // Create prompt for Gemini
      const prompt = `You are a database performance expert. Analyze these slow queries and suggest optimizations.

Slow Queries:
${slowQueries.map((q, i) => `
Query ${i + 1}:
- Entity Type: ${q.entityType}
- Duration: ${q.duration}ms
- Query: ${q.query}
- Timestamp: ${q.timestamp.toISOString()}
`).join('\n')}

Database Schema Information:
- Products: indexed on id, sku, name, category, manufacturer, stockQuantity, expiryDate
- Customers: indexed on id, customerId, name, type, email, phone, segment
- Orders: indexed on id, orderId, customerId, orderDate, status, paymentStatus
- Inventory: indexed on id, productId, warehouseLocation, quantity

Provide a JSON array of optimizations:
[
  {
    "query": "Description of the query",
    "currentPerformance": "Current performance description",
    "issue": "What's causing the slowness",
    "suggestedOptimization": "Specific optimization suggestion (e.g., add compound index, restructure query)",
    "expectedImprovement": "Expected performance improvement",
    "priority": "low|medium|high"
  }
]`;

      const optimizations = await this.gemini.generateJSON<QueryOptimization[]>(prompt);

      // Log the analysis
      await this.logSystemEvent('slow_query_analysis', 'success', {
        queriesAnalyzed: slowQueries.length,
        optimizationsFound: optimizations.length,
      });

      return optimizations;
    } catch (error) {
      await this.logSystemEvent('slow_query_analysis', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Analyze error logs for recurring issues
   * Requirement 22.6: Analyze error logs and identify recurring issues
   */
  async analyzeErrorPatterns(): Promise<ErrorPattern[]> {
    try {
      // Get error logs from last 7 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const errorLogs = await db.systemLogs
        .where('status')
        .equals('error')
        .and(log => log.timestamp >= startDate)
        .toArray();

      if (errorLogs.length === 0) {
        return [];
      }

      // Group errors by type
      const errorGroups = this.groupErrorsByType(errorLogs);

      // Create prompt for Gemini
      const prompt = `You are a system reliability engineer. Analyze these error patterns and identify root causes.

Error Patterns (last 7 days):
${Object.entries(errorGroups).map(([type, errors]) => `
Error Type: ${type}
- Occurrences: ${errors.length}
- First Seen: ${errors[0].timestamp.toISOString()}
- Last Seen: ${errors[errors.length - 1].timestamp.toISOString()}
- Affected Entities: ${[...new Set(errors.map(e => e.entityType))].join(', ')}
- Sample Error Messages:
${errors.slice(0, 3).map(e => `  - ${e.errorMessage?.substring(0, 100) || 'No message'}`).join('\n')}
`).join('\n')}

Provide a JSON array of error patterns with root cause analysis:
[
  {
    "errorType": "Error type name",
    "occurrences": <number>,
    "firstSeen": "<ISO date>",
    "lastSeen": "<ISO date>",
    "affectedEntities": ["entity1", "entity2"],
    "rootCause": "Detailed root cause analysis",
    "suggestedFix": "Specific fix recommendation",
    "priority": "low|medium|high|critical"
  }
]`;

      const patterns = await this.gemini.generateJSON<ErrorPattern[]>(prompt);

      // Convert date strings to Date objects
      const patternsWithDates = patterns.map(p => ({
        ...p,
        firstSeen: new Date(p.firstSeen),
        lastSeen: new Date(p.lastSeen),
      }));

      // Log the analysis
      await this.logSystemEvent('error_pattern_analysis', 'success', {
        errorsAnalyzed: errorLogs.length,
        patternsFound: patterns.length,
      });

      // Create alerts for critical patterns
      for (const pattern of patternsWithDates) {
        if (pattern.priority === 'critical' || pattern.priority === 'high') {
          await this.createAlert('error_pattern', pattern.priority, 
            `${pattern.errorType}: ${pattern.suggestedFix}`);
        }
      }

      return patternsWithDates;
    } catch (error) {
      await this.logSystemEvent('error_pattern_analysis', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate comprehensive system health report
   * Requirement 22.11: Generate automated system health reports
   */
  async generateSystemHealthReport(): Promise<SystemHealthReport> {
    try {
      // Collect all metrics and analyses
      const [
        metrics,
        databaseGrowth,
        queryOptimizations,
        errorPatterns,
        performanceAnalysis,
      ] = await Promise.all([
        this.collectPerformanceMetrics(),
        this.predictDatabaseGrowth(),
        this.analyzeSlowQueries(),
        this.analyzeErrorPatterns(),
        this.analyzePerformanceMetrics(),
      ]);

      // Calculate overall health score
      const healthScore = this.calculateHealthScore(metrics, errorPatterns, queryOptimizations);
      const overallHealth = this.getHealthLevel(healthScore);

      // Create comprehensive prompt for recommendations
      const prompt = `You are a system administrator. Generate proactive maintenance recommendations based on this system health report.

System Health Score: ${healthScore}/100
Overall Health: ${overallHealth}

Performance Metrics:
- Database Size: ${this.formatBytes(metrics.databaseSize)}
- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
- Slow Queries: ${metrics.slowQueries.length}
- API Calls: ${metrics.apiCallsToday}

Database Growth:
- Current: ${this.formatBytes(databaseGrowth.currentSize)}
- Predicted (30 days): ${this.formatBytes(databaseGrowth.predictedSizeIn30Days)}
- Alert Level: ${databaseGrowth.alertLevel}

Issues Found:
- Query Optimizations Needed: ${queryOptimizations.length}
- Error Patterns: ${errorPatterns.length}

Provide a JSON response with:
{
  "recommendations": ["List of general recommendations for system health"],
  "proactiveActions": ["List of specific proactive actions to take now"]
}`;

      const aiRecommendations = await this.gemini.generateJSON<{
        recommendations: string[];
        proactiveActions: string[];
      }>(prompt);

      const report: SystemHealthReport = {
        timestamp: new Date(),
        overallHealth,
        healthScore,
        metrics,
        databaseGrowth,
        queryOptimizations,
        errorPatterns,
        recommendations: [
          ...performanceAnalysis.recommendations,
          ...aiRecommendations.recommendations,
        ],
        proactiveActions: [
          ...performanceAnalysis.optimizationActions,
          ...aiRecommendations.proactiveActions,
        ],
      };

      // Log the report
      await this.logSystemEvent('health_report_generated', 'success', {
        healthScore,
        overallHealth,
        issuesFound: queryOptimizations.length + errorPatterns.length,
      });

      return report;
    } catch (error) {
      await this.logSystemEvent('health_report_generation', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  // Continue in next part...

  // ============================================
  // Data Quality Monitoring Methods
  // ============================================

  /**
   * Detect data inconsistencies
   * Requirement 22.7: Detect data inconsistencies and duplicates
   */
  async detectDataInconsistencies(): Promise<DataInconsistency[]> {
    try {
      const inconsistencies: DataInconsistency[] = [];

      // Check products
      const products = await db.products.toArray();
      for (const product of products) {
        // Check for negative stock
        if (product.stockQuantity < 0) {
          inconsistencies.push({
            entityType: 'product',
            entityId: product.id,
            inconsistencyType: 'negative_stock',
            description: `Product ${product.name} has negative stock: ${product.stockQuantity}`,
            severity: 'high',
            suggestedFix: 'Adjust stock quantity to 0 or investigate stock movements',
          });
        }

        // Check for price inconsistencies
        if (product.unitPrice < product.costPrice) {
          inconsistencies.push({
            entityType: 'product',
            entityId: product.id,
            inconsistencyType: 'price_below_cost',
            description: `Product ${product.name} selling price (${product.unitPrice}) is below cost (${product.costPrice})`,
            severity: 'medium',
            suggestedFix: 'Review pricing strategy or update cost price',
          });
        }

        // Check for expired products still active
        if (product.expiryDate && new Date(product.expiryDate) < new Date() && product.isActive) {
          inconsistencies.push({
            entityType: 'product',
            entityId: product.id,
            inconsistencyType: 'expired_product_active',
            description: `Product ${product.name} is expired but still marked as active`,
            severity: 'high',
            suggestedFix: 'Mark product as inactive and remove from inventory',
          });
        }
      }

      // Check orders
      const orders = await db.orders.toArray();
      for (const order of orders) {
        // Check for orders with no items
        if (!order.items || order.items.length === 0) {
          inconsistencies.push({
            entityType: 'order',
            entityId: order.id,
            inconsistencyType: 'empty_order',
            description: `Order ${order.orderId} has no items`,
            severity: 'high',
            suggestedFix: 'Delete order or add items',
          });
        }

        // Check for total amount mismatch
        const calculatedTotal = order.items?.reduce((sum, item) => sum + item.total, 0) || 0;
        if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
          inconsistencies.push({
            entityType: 'order',
            entityId: order.id,
            inconsistencyType: 'total_mismatch',
            description: `Order ${order.orderId} total (${order.totalAmount}) doesn't match calculated total (${calculatedTotal})`,
            severity: 'medium',
            suggestedFix: 'Recalculate order total',
          });
        }
      }

      // Check customers
      const customers = await db.customers.toArray();
      for (const customer of customers) {
        // Check for invalid email
        if (customer.email && !this.isValidEmail(customer.email)) {
          inconsistencies.push({
            entityType: 'customer',
            entityId: customer.id,
            inconsistencyType: 'invalid_email',
            description: `Customer ${customer.name} has invalid email: ${customer.email}`,
            severity: 'low',
            suggestedFix: 'Update customer email address',
          });
        }
      }

      // Log the detection
      await this.logSystemEvent('data_inconsistency_detection', 'success', {
        inconsistenciesFound: inconsistencies.length,
      });

      return inconsistencies;
    } catch (error) {
      await this.logSystemEvent('data_inconsistency_detection', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Detect duplicate records
   * Requirement 22.7: Detect duplicates
   */
  async detectDuplicates(): Promise<DuplicateDetection[]> {
    try {
      const duplicateDetections: DuplicateDetection[] = [];

      // Check for duplicate products (by SKU or name)
      const products = await db.products.toArray();
      const productDuplicates = this.findDuplicatesBySimilarity(
        products,
        ['sku', 'name'],
        (a, b) => a.sku === b.sku || this.calculateSimilarity(a.name, b.name) > 0.9
      );

      if (productDuplicates.length > 0) {
        duplicateDetections.push({
          entityType: 'product',
          duplicates: productDuplicates.map(group => ({
            ids: group.map(p => p.id),
            matchScore: 0.95,
            matchingFields: ['sku', 'name'],
            suggestedAction: 'Merge duplicate products or update SKU',
          })),
        });
      }

      // Check for duplicate customers (by email, phone, or customerId)
      const customers = await db.customers.toArray();
      const customerDuplicates = this.findDuplicatesBySimilarity(
        customers,
        ['email', 'phone', 'customerId'],
        (a, b) => 
          !!(a.email && a.email === b.email) ||
          !!(a.phone && a.phone === b.phone) ||
          !!(a.customerId && a.customerId === b.customerId)
      );

      if (customerDuplicates.length > 0) {
        duplicateDetections.push({
          entityType: 'customer',
          duplicates: customerDuplicates.map(group => ({
            ids: group.map(c => c.id),
            matchScore: 1.0,
            matchingFields: ['email', 'phone', 'customerId'],
            suggestedAction: 'Merge duplicate customer records',
          })),
        });
      }

      // Check for duplicate patients (by nationalId)
      const patients = await db.patients.toArray();
      const patientDuplicates = this.findDuplicatesBySimilarity(
        patients,
        ['nationalId'],
        (a, b) => a.nationalId === b.nationalId
      );

      if (patientDuplicates.length > 0) {
        duplicateDetections.push({
          entityType: 'patient',
          duplicates: patientDuplicates.map(group => ({
            ids: group.map(p => p.id),
            matchScore: 1.0,
            matchingFields: ['nationalId'],
            suggestedAction: 'Merge duplicate patient records',
          })),
        });
      }

      // Log the detection
      await this.logSystemEvent('duplicate_detection', 'success', {
        duplicatesFound: duplicateDetections.reduce((sum, d) => sum + d.duplicates.length, 0),
      });

      return duplicateDetections;
    } catch (error) {
      await this.logSystemEvent('duplicate_detection', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Identify missing relationships
   * Requirement 22.8: Identify missing relationships
   */
  async identifyMissingRelationships(): Promise<MissingRelationship[]> {
    try {
      const missingRelationships: MissingRelationship[] = [];

      // Check orders with invalid customer references
      const orders = await db.orders.toArray();
      for (const order of orders) {
        const customer = await db.customers.get(order.customerId);
        if (!customer) {
          missingRelationships.push({
            entityType: 'order',
            entityId: order.id,
            relatedEntityType: 'customer',
            relatedEntityId: order.customerId,
            relationshipType: 'belongs_to',
            impact: 'Order cannot be processed without valid customer',
            suggestedFix: 'Link order to existing customer or create customer record',
          });
        }
      }

      // Check orders with invalid product references in items
      for (const order of orders) {
        if (order.items) {
          for (const item of order.items) {
            const product = await db.products.get(item.productId);
            if (!product) {
              missingRelationships.push({
                entityType: 'order',
                entityId: order.id,
                relatedEntityType: 'product',
                relatedEntityId: item.productId,
                relationshipType: 'contains',
                impact: 'Order item references non-existent product',
                suggestedFix: 'Remove invalid item or restore product record',
              });
            }
          }
        }
      }

      // Check inventory with invalid product references
      const inventory = await db.inventory.toArray();
      for (const inv of inventory) {
        const product = await db.products.get(inv.productId);
        if (!product) {
          missingRelationships.push({
            entityType: 'inventory',
            entityId: inv.id,
            relatedEntityType: 'product',
            relatedEntityId: inv.productId,
            relationshipType: 'tracks',
            impact: 'Inventory record for non-existent product',
            suggestedFix: 'Delete inventory record or restore product',
          });
        }
      }

      // Check medical records with invalid patient references
      const medicalRecords = await db.medicalRecords.toArray();
      for (const record of medicalRecords) {
        const patient = await db.patients.get(record.patientId);
        if (!patient) {
          missingRelationships.push({
            entityType: 'medicalRecord',
            entityId: record.id,
            relatedEntityType: 'patient',
            relatedEntityId: record.patientId,
            relationshipType: 'belongs_to',
            impact: 'Medical record without valid patient',
            suggestedFix: 'Link to existing patient or create patient record',
          });
        }
      }

      // Check invoices with invalid order references
      const invoices = await db.invoices.toArray();
      for (const invoice of invoices) {
        const order = await db.orders.get(invoice.orderId);
        if (!order) {
          missingRelationships.push({
            entityType: 'invoice',
            entityId: invoice.id,
            relatedEntityType: 'order',
            relatedEntityId: invoice.orderId,
            relationshipType: 'generated_from',
            impact: 'Invoice without valid order reference',
            suggestedFix: 'Link to existing order or delete invoice',
          });
        }
      }

      // Log the detection
      await this.logSystemEvent('missing_relationship_detection', 'success', {
        missingRelationshipsFound: missingRelationships.length,
      });

      return missingRelationships;
    } catch (error) {
      await this.logSystemEvent('missing_relationship_detection', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Suggest data cleanup actions using AI
   * Requirement 22.8: Suggest data cleanup actions
   */
  async suggestDataCleanupActions(): Promise<DataCleanupAction[]> {
    try {
      // Gather all data quality issues
      const [inconsistencies, duplicates, missingRelationships] = await Promise.all([
        this.detectDataInconsistencies(),
        this.detectDuplicates(),
        this.identifyMissingRelationships(),
      ]);

      // Create prompt for Gemini
      const prompt = `You are a data quality expert. Analyze these data quality issues and suggest cleanup actions.

Data Inconsistencies Found: ${inconsistencies.length}
${inconsistencies.slice(0, 5).map(i => `- ${i.entityType}: ${i.description}`).join('\n')}

Duplicate Records Found: ${duplicates.reduce((sum, d) => sum + d.duplicates.length, 0)}
${duplicates.map(d => `- ${d.entityType}: ${d.duplicates.length} duplicate groups`).join('\n')}

Missing Relationships Found: ${missingRelationships.length}
${missingRelationships.slice(0, 5).map(m => `- ${m.entityType} → ${m.relatedEntityType}: ${m.impact}`).join('\n')}

Provide a JSON array of prioritized cleanup actions:
[
  {
    "actionType": "Type of cleanup action",
    "description": "Detailed description of the action",
    "affectedEntities": <number of entities affected>,
    "priority": "low|medium|high",
    "automatable": true|false,
    "steps": ["Step 1", "Step 2", "Step 3"]
  }
]`;

      const actions = await this.gemini.generateJSON<DataCleanupAction[]>(prompt);

      // Log the suggestions
      await this.logSystemEvent('data_cleanup_suggestions', 'success', {
        actionsGenerated: actions.length,
        totalIssues: inconsistencies.length + duplicates.length + missingRelationships.length,
      });

      return actions;
    } catch (error) {
      await this.logSystemEvent('data_cleanup_suggestions', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  // Continue in next part...

  // ============================================
  // Usage Analytics Methods
  // ============================================

  /**
   * Analyze user behavior patterns
   * Requirement 22.5: Analyze user behavior patterns
   */
  async analyzeUserBehaviorPatterns(): Promise<UserBehaviorPattern[]> {
    try {
      // Get user activity logs from last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const activityLogs = await db.systemLogs
        .where('timestamp')
        .above(startDate)
        .and(log => log.userId !== 'system')
        .toArray();

      // Group by user
      const userActivities: Record<string, any[]> = {};
      for (const log of activityLogs) {
        if (!userActivities[log.userId]) {
          userActivities[log.userId] = [];
        }
        userActivities[log.userId].push(log);
      }

      const patterns: UserBehaviorPattern[] = [];

      for (const [userId, activities] of Object.entries(userActivities)) {
        // Analyze feature usage
        const featureUsage: Record<string, number> = {};
        const hourlyUsage: Record<number, number> = {};
        const workflows: string[] = [];

        for (const activity of activities) {
          // Count feature usage
          const feature = activity.entityType || 'unknown';
          featureUsage[feature] = (featureUsage[feature] || 0) + 1;

          // Track hourly usage
          const hour = activity.timestamp.getHours();
          hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;

          // Identify workflows (sequences of actions)
          workflows.push(activity.action);
        }

        // Get most used features
        const mostUsedFeatures = Object.entries(featureUsage)
          .map(([feature, count]) => ({ feature, usageCount: count }))
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10);

        // Get peak usage hours
        const peakUsageHours = Object.entries(hourlyUsage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour]) => parseInt(hour));

        // Identify struggling areas (features with errors)
        const strugglingAreas = activities
          .filter(a => a.status === 'error')
          .map(a => a.entityType)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 5);

        patterns.push({
          userId,
          mostUsedFeatures,
          peakUsageHours,
          averageSessionDuration: 0, // Would need session tracking
          commonWorkflows: this.identifyCommonWorkflows(workflows),
          strugglingAreas,
        });
      }

      // Log the analysis
      await this.logSystemEvent('user_behavior_analysis', 'success', {
        usersAnalyzed: patterns.length,
      });

      return patterns;
    } catch (error) {
      await this.logSystemEvent('user_behavior_analysis', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Suggest UI/UX improvements based on usage
   * Requirement 22.9: Suggest UI/UX improvements based on usage
   */
  async suggestUIUXImprovements(): Promise<UIUXImprovement[]> {
    try {
      // Analyze user behavior patterns
      const behaviorPatterns = await this.analyzeUserBehaviorPatterns();

      // Gather usage statistics
      const searchHistory = await db.searchHistory.toArray();
      const errorLogs = await db.systemLogs
        .where('status')
        .equals('error')
        .toArray();

      // Create prompt for Gemini
      const prompt = `You are a UX expert. Analyze user behavior patterns and suggest UI/UX improvements.

User Behavior Analysis:
- Total Users Analyzed: ${behaviorPatterns.length}
- Common Struggling Areas: ${[...new Set(behaviorPatterns.flatMap(p => p.strugglingAreas))].join(', ')}
- Most Used Features: ${behaviorPatterns[0]?.mostUsedFeatures.slice(0, 5).map(f => f.feature).join(', ')}

Search Patterns:
- Total Searches: ${searchHistory.length}
- Failed Searches: ${searchHistory.filter(s => s.results === 0).length}
- Most Searched Terms: ${this.getMostSearchedTerms(searchHistory).join(', ')}

Error Patterns:
- Total Errors: ${errorLogs.length}
- Most Common Error Types: ${this.getMostCommonErrors(errorLogs).join(', ')}

Provide a JSON array of UI/UX improvement suggestions:
[
  {
    "area": "Specific UI area or feature",
    "currentIssue": "Description of the current issue",
    "suggestedImprovement": "Detailed improvement suggestion",
    "expectedImpact": "Expected positive impact on user experience",
    "priority": "low|medium|high",
    "implementationComplexity": "easy|medium|complex"
  }
]`;

      const improvements = await this.gemini.generateJSON<UIUXImprovement[]>(prompt);

      // Log the suggestions
      await this.logSystemEvent('uiux_improvement_suggestions', 'success', {
        suggestionsGenerated: improvements.length,
      });

      return improvements;
    } catch (error) {
      await this.logSystemEvent('uiux_improvement_suggestions', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Predict system load and recommend scaling
   * Requirement 22.5: Predict system load and recommend scaling
   */
  async predictSystemLoad(): Promise<SystemLoadPrediction> {
    try {
      // Get current system metrics
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentLogs = await db.systemLogs
        .where('timestamp')
        .above(oneHourAgo)
        .toArray();

      // Calculate current load
      const activeUsers = new Set(recentLogs.map(log => log.userId)).size;
      const requestsPerMinute = recentLogs.length / 60;
      const databaseOperations = recentLogs.filter(log => 
        log.action.includes('create') || 
        log.action.includes('update') || 
        log.action.includes('delete')
      ).length;

      // Get historical load data
      const historicalLoad = await this.getHistoricalLoadData();

      // Create prompt for Gemini
      const prompt = `You are a system capacity planner. Analyze system load patterns and predict future load.

Current System Load:
- Active Users (last hour): ${activeUsers}
- Requests Per Minute: ${requestsPerMinute.toFixed(2)}
- Database Operations (last hour): ${databaseOperations}

Historical Load Patterns (last 7 days):
${historicalLoad.map(h => `- ${h.date}: ${h.users} users, ${h.requests} requests/min`).join('\n')}

Provide a JSON response with:
{
  "predictedPeakLoad": {
    "time": "<ISO datetime of predicted peak>",
    "expectedUsers": <number>,
    "expectedRequests": <number>
  },
  "scalingRecommendations": ["List of scaling recommendations"],
  "resourceOptimizations": ["List of resource optimization suggestions"]
}`;

      const prediction = await this.gemini.generateJSON<Omit<SystemLoadPrediction, 'currentLoad'>>(prompt);

      const result: SystemLoadPrediction = {
        currentLoad: {
          activeUsers,
          requestsPerMinute,
          databaseOperations,
        },
        predictedPeakLoad: {
          ...prediction.predictedPeakLoad,
          time: new Date(prediction.predictedPeakLoad.time),
        },
        scalingRecommendations: prediction.scalingRecommendations,
        resourceOptimizations: prediction.resourceOptimizations,
      };

      // Log the prediction
      await this.logSystemEvent('system_load_prediction', 'success', result);

      return result;
    } catch (error) {
      await this.logSystemEvent('system_load_prediction', 'error', { error: (error as Error).message });
      throw error;
    }
  }

  // Continue in next part...

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Collect current performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get API calls today
    const apiLogs = await db.systemLogs
      .where('entityType')
      .equals('gemini_api')
      .and(log => log.timestamp >= today)
      .toArray();

    // Get error logs
    const errorLogs = await db.systemLogs
      .where('status')
      .equals('error')
      .and(log => log.timestamp >= today)
      .toArray();

    // Get slow queries (queries taking > 100ms)
    const slowQueries = await this.getSlowQueries();

    // Calculate metrics
    const databaseSize = await this.getCurrentDatabaseSize();
    const cacheSize = this.gemini.getCacheSize();
    const apiCallsToday = apiLogs.length;
    const totalLogs = await db.systemLogs.where('timestamp').above(today).count();
    const errorRate = totalLogs > 0 ? errorLogs.length / totalLogs : 0;

    // Calculate average query time from logs
    const queryLogs = await db.systemLogs
      .where('action')
      .startsWith('query_')
      .and(log => log.timestamp >= today)
      .toArray();

    const averageQueryTime = queryLogs.length > 0
      ? queryLogs.reduce((sum, log) => {
          const details = JSON.parse(log.details || '{}');
          return sum + (details.duration || 0);
        }, 0) / queryLogs.length
      : 0;

    return {
      databaseSize,
      cacheSize,
      apiCallsToday,
      errorRate,
      averageQueryTime,
      slowQueries,
    };
  }

  /**
   * Get current database size estimate
   */
  private async getCurrentDatabaseSize(): Promise<number> {
    try {
      // Estimate size by counting records and average record size
      const [
        productsCount,
        customersCount,
        ordersCount,
        inventoryCount,
        salesCount,
        patientsCount,
        medicalRecordsCount,
        logsCount,
      ] = await Promise.all([
        db.products.count(),
        db.customers.count(),
        db.orders.count(),
        db.inventory.count(),
        db.sales.count(),
        db.patients.count(),
        db.medicalRecords.count(),
        db.systemLogs.count(),
      ]);

      // Rough estimate: average record size * count
      const estimatedSize = 
        productsCount * 2000 +
        customersCount * 1500 +
        ordersCount * 3000 +
        inventoryCount * 1000 +
        salesCount * 1000 +
        patientsCount * 2000 +
        medicalRecordsCount * 5000 +
        logsCount * 500;

      return estimatedSize;
    } catch (error) {
      console.error('Error calculating database size:', error);
      return 0;
    }
  }

  /**
   * Get historical database size data
   */
  private async getHistoricalDatabaseSize(): Promise<Array<{ date: string; size: number }>> {
    // Get size tracking logs from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const sizeLogs = await db.systemLogs
      .where('action')
      .equals('database_size_tracking')
      .and(log => log.timestamp >= startDate)
      .toArray();

    return sizeLogs.map(log => {
      const details = JSON.parse(log.details || '{}');
      return {
        date: log.timestamp.toISOString().split('T')[0],
        size: details.size || 0,
      };
    });
  }

  /**
   * Get slow queries from logs
   */
  private async getSlowQueries(): Promise<SlowQuery[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Last 24 hours

    const queryLogs = await db.systemLogs
      .where('action')
      .startsWith('query_')
      .and(log => log.timestamp >= startDate)
      .toArray();

    const slowQueries: SlowQuery[] = [];

    for (const log of queryLogs) {
      try {
        const details = JSON.parse(log.details || '{}');
        if (details.duration && details.duration > 100) { // Queries > 100ms
          slowQueries.push({
            query: details.query || log.action,
            duration: details.duration,
            timestamp: log.timestamp,
            entityType: log.entityType,
          });
        }
      } catch (error) {
        // Skip invalid log entries
      }
    }

    return slowQueries.sort((a, b) => b.duration - a.duration).slice(0, 10);
  }

  /**
   * Group errors by type
   */
  private groupErrorsByType(errorLogs: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const log of errorLogs) {
      const errorType = log.action || 'unknown_error';
      if (!groups[errorType]) {
        groups[errorType] = [];
      }
      groups[errorType].push(log);
    }

    return groups;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(
    metrics: PerformanceMetrics,
    errorPatterns: ErrorPattern[],
    queryOptimizations: QueryOptimization[]
  ): number {
    let score = 100;

    // Deduct points for errors
    score -= Math.min(metrics.errorRate * 100, 30);

    // Deduct points for slow queries
    score -= Math.min(metrics.slowQueries.length * 2, 20);

    // Deduct points for error patterns
    const criticalErrors = errorPatterns.filter(p => p.priority === 'critical').length;
    const highErrors = errorPatterns.filter(p => p.priority === 'high').length;
    score -= criticalErrors * 10;
    score -= highErrors * 5;

    // Deduct points for query optimizations needed
    const highPriorityOptimizations = queryOptimizations.filter(o => o.priority === 'high').length;
    score -= highPriorityOptimizations * 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get health level from score
   */
  private getHealthLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create system alert
   */
  private async createAlert(type: string, severity: string, message: string): Promise<void> {
    await db.systemLogs.add({
      id: uuidv4(),
      action: `alert_${type}`,
      entityType: 'system_alert',
      details: JSON.stringify({ severity, message }),
      userId: 'system',
      timestamp: new Date(),
      status: severity === 'critical' ? 'error' : 'warning',
    });
  }

  /**
   * Log system event
   */
  private async logSystemEvent(action: string, status: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: `system_optimization_${action}`,
        entityType: 'system_optimization',
        details: JSON.stringify(details),
        userId: 'system',
        timestamp: new Date(),
        status: status === 'success' ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Find duplicates by similarity
   */
  private findDuplicatesBySimilarity<T extends { id: string }>(
    items: T[],
    fields: string[],
    compareFn: (a: T, b: T) => boolean
  ): T[][] {
    const duplicateGroups: T[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue;

      const group: T[] = [items[i]];
      processed.add(items[i].id);

      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue;

        if (compareFn(items[i], items[j])) {
          group.push(items[j]);
          processed.add(items[j].id);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }

    return duplicateGroups;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }

    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1 : 1 - costs[s2.length] / maxLength;
  }

  /**
   * Identify common workflows from action sequences
   */
  private identifyCommonWorkflows(actions: string[]): string[] {
    const workflows: Record<string, number> = {};
    
    // Look for sequences of 3 actions
    for (let i = 0; i < actions.length - 2; i++) {
      const workflow = `${actions[i]} → ${actions[i + 1]} → ${actions[i + 2]}`;
      workflows[workflow] = (workflows[workflow] || 0) + 1;
    }

    // Return top 5 workflows
    return Object.entries(workflows)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([workflow]) => workflow);
  }

  /**
   * Get most searched terms
   */
  private getMostSearchedTerms(searchHistory: any[]): string[] {
    const termCounts: Record<string, number> = {};
    
    for (const search of searchHistory) {
      termCounts[search.query] = (termCounts[search.query] || 0) + 1;
    }

    return Object.entries(termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
  }

  /**
   * Get most common errors
   */
  private getMostCommonErrors(errorLogs: any[]): string[] {
    const errorCounts: Record<string, number> = {};
    
    for (const log of errorLogs) {
      errorCounts[log.action] = (errorCounts[log.action] || 0) + 1;
    }

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error]) => error);
  }

  /**
   * Get historical load data
   */
  private async getHistoricalLoadData(): Promise<Array<{ date: string; users: number; requests: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const logs = await db.systemLogs
      .where('timestamp')
      .above(startDate)
      .toArray();

    // Group by date
    const dailyData: Record<string, { users: Set<string>; requests: number }> = {};

    for (const log of logs) {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { users: new Set(), requests: 0 };
      }
      dailyData[date].users.add(log.userId);
      dailyData[date].requests++;
    }

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      users: data.users.size,
      requests: data.requests / (24 * 60), // Average per minute
    }));
  }
}

/**
 * Export singleton instance
 */
let systemOptimizationServiceInstance: SystemOptimizationService | null = null;

export function getSystemOptimizationService(): SystemOptimizationService {
  if (!systemOptimizationServiceInstance) {
    systemOptimizationServiceInstance = new SystemOptimizationService();
  }
  return systemOptimizationServiceInstance;
}
