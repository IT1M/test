// Database optimization utilities for better performance

import { PrismaClient } from '@prisma/client';

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: string;
}

interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

// Enhanced Prisma client with performance monitoring
export class OptimizedPrismaClient extends PrismaClient {
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second

  constructor(options?: any) {
    super({
      ...options,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    this.$on('query', (e: any) => {
      const executionTime = e.duration;
      
      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        console.warn('[DB] Slow query detected:', {
          query: e.query,
          duration: `${executionTime}ms`,
          params: e.params,
        });
      }

      // Store metrics
      this.queryMetrics.push({
        query: e.query,
        executionTime,
        rowsAffected: 0, // Would need to be extracted from result
        timestamp: new Date(),
      });

      // Keep only last 1000 queries
      if (this.queryMetrics.length > 1000) {
        this.queryMetrics = this.queryMetrics.slice(-1000);
      }
    });

    this.$on('error', (e: any) => {
      console.error('[DB] Database error:', e);
    });
  }

  getQueryMetrics(): QueryPerformanceMetrics[] {
    return [...this.queryMetrics];
  }

  getSlowQueries(threshold: number = this.slowQueryThreshold): QueryPerformanceMetrics[] {
    return this.queryMetrics.filter(metric => metric.executionTime > threshold);
  }

  getAverageQueryTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    const total = this.queryMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    return total / this.queryMetrics.length;
  }

  clearMetrics(): void {
    this.queryMetrics = [];
  }
}

// Database performance analyzer
export class DatabasePerformanceAnalyzer {
  constructor(private prisma: OptimizedPrismaClient) {}

  async analyzeTableSizes(): Promise<Array<{ table: string; size: string; rows: number }>> {
    try {
      const result = await this.prisma.$queryRaw<Array<{
        table_name: string;
        size: string;
        row_count: bigint;
      }>>`
        SELECT 
          schemaname,
          tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_tup_ins + n_tup_upd + n_tup_del as row_count
        FROM pg_tables 
        LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      return result.map(row => ({
        table: row.table_name,
        size: row.size,
        rows: Number(row.row_count),
      }));
    } catch (error) {
      console.error('[DB] Failed to analyze table sizes:', error);
      return [];
    }
  }

  async analyzeIndexUsage(): Promise<Array<{
    table: string;
    index: string;
    scans: number;
    tuples: number;
    size: string;
  }>> {
    try {
      const result = await this.prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        idx_scan: bigint;
        idx_tup_read: bigint;
        idx_tup_fetch: bigint;
        size: string;
      }>>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes 
        JOIN pg_index ON pg_stat_user_indexes.indexrelid = pg_index.indexrelid
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      return result.map(row => ({
        table: row.tablename,
        index: row.indexname,
        scans: Number(row.idx_scan),
        tuples: Number(row.idx_tup_read),
        size: row.size,
      }));
    } catch (error) {
      console.error('[DB] Failed to analyze index usage:', error);
      return [];
    }
  }

  async findMissingIndexes(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    try {
      // Analyze slow queries to suggest indexes
      const slowQueries = await this.prisma.$queryRaw<Array<{
        query: string;
        calls: bigint;
        total_time: number;
        mean_time: number;
      }>>`
        SELECT 
          query,
          calls,
          total_time,
          mean_time
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 20;
      `;

      // Analyze queries for potential index opportunities
      for (const query of slowQueries) {
        const queryText = query.query.toLowerCase();
        
        // Look for WHERE clauses without indexes
        if (queryText.includes('where') && queryText.includes('inventoryitem')) {
          if (queryText.includes('itemname') && queryText.includes('batch')) {
            recommendations.push({
              table: 'InventoryItem',
              columns: ['itemName', 'batch'],
              reason: 'Frequent queries filtering by itemName and batch',
              estimatedImprovement: '50-70% faster queries',
            });
          }
        }

        if (queryText.includes('auditlog') && queryText.includes('timestamp')) {
          recommendations.push({
            table: 'AuditLog',
            columns: ['timestamp', 'userId'],
            reason: 'Frequent time-based queries with user filtering',
            estimatedImprovement: '40-60% faster queries',
          });
        }
      }
    } catch (error) {
      console.warn('[DB] pg_stat_statements not available, using heuristic analysis');
      
      // Fallback to heuristic recommendations
      recommendations.push(
        {
          table: 'InventoryItem',
          columns: ['createdAt', 'category'],
          reason: 'Common filtering by date and category',
          estimatedImprovement: '30-50% faster queries',
        },
        {
          table: 'AuditLog',
          columns: ['entityType', 'timestamp'],
          reason: 'Audit queries often filter by entity type and time',
          estimatedImprovement: '40-60% faster queries',
        },
        {
          table: 'UserActivity',
          columns: ['userId', 'action', 'timestamp'],
          reason: 'Activity tracking queries need composite index',
          estimatedImprovement: '50-70% faster queries',
        }
      );
    }

    return recommendations;
  }

  async getConnectionPoolStats(): Promise<{
    active: number;
    idle: number;
    waiting: number;
    total: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw<Array<{
        state: string;
        count: bigint;
      }>>`
        SELECT 
          state,
          count(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state;
      `;

      const stats = {
        active: 0,
        idle: 0,
        waiting: 0,
        total: 0,
      };

      result.forEach(row => {
        const count = Number(row.count);
        stats.total += count;
        
        switch (row.state) {
          case 'active':
            stats.active = count;
            break;
          case 'idle':
            stats.idle = count;
            break;
          case 'idle in transaction':
          case 'idle in transaction (aborted)':
            stats.waiting = count;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('[DB] Failed to get connection pool stats:', error);
      return { active: 0, idle: 0, waiting: 0, total: 0 };
    }
  }
}

// Query optimization utilities
export class QueryOptimizer {
  constructor(private prisma: OptimizedPrismaClient) {}

  // Optimized inventory queries with proper indexing
  async getInventoryWithOptimizedQuery(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    destination?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      dateFrom,
      dateTo,
      destination,
      category,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    // Build optimized where clause
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }
    
    if (destination) {
      where.destination = destination;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { batch: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Use optimized query with proper ordering
    return await this.prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }, // Secondary sort for consistency
      ],
      take: limit,
      skip: offset,
    });
  }

  // Optimized analytics queries with aggregation
  async getInventoryAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    destination?: string;
  }) {
    const { dateFrom, dateTo, destination } = filters;
    
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }
    if (destination) where.destination = destination;

    // Use aggregation for better performance
    const [
      totalStats,
      categoryStats,
      destinationStats,
      dailyStats,
    ] = await Promise.all([
      // Total statistics
      this.prisma.inventoryItem.aggregate({
        where,
        _count: { id: true },
        _sum: { quantity: true, reject: true },
        _avg: { quantity: true, reject: true },
      }),

      // Category breakdown
      this.prisma.inventoryItem.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
        _sum: { quantity: true, reject: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Destination breakdown
      this.prisma.inventoryItem.groupBy({
        by: ['destination'],
        where,
        _count: { id: true },
        _sum: { quantity: true, reject: true },
      }),

      // Daily trends (last 30 days)
      this.prisma.$queryRaw<Array<{
        date: Date;
        count: bigint;
        total_quantity: bigint;
        total_reject: bigint;
      }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(quantity) as total_quantity,
          SUM(reject) as total_reject
        FROM "InventoryItem"
        WHERE created_at >= NOW() - INTERVAL '30 days'
          ${destination ? `AND destination = '${destination}'` : ''}
        GROUP BY DATE(created_at)
        ORDER BY date DESC;
      `,
    ]);

    return {
      total: {
        items: totalStats._count.id,
        quantity: totalStats._sum.quantity || 0,
        reject: totalStats._sum.reject || 0,
        avgQuantity: totalStats._avg.quantity || 0,
        avgReject: totalStats._avg.reject || 0,
        rejectRate: totalStats._sum.quantity ? 
          ((totalStats._sum.reject || 0) / totalStats._sum.quantity) * 100 : 0,
      },
      byCategory: categoryStats.map(stat => ({
        category: stat.category || 'Uncategorized',
        count: stat._count.id,
        quantity: stat._sum.quantity || 0,
        reject: stat._sum.reject || 0,
      })),
      byDestination: destinationStats.map(stat => ({
        destination: stat.destination,
        count: stat._count.id,
        quantity: stat._sum.quantity || 0,
        reject: stat._sum.reject || 0,
      })),
      dailyTrends: dailyStats.map(stat => ({
        date: stat.date,
        count: Number(stat.count),
        quantity: Number(stat.total_quantity),
        reject: Number(stat.total_reject),
      })),
    };
  }

  // Optimized audit log queries
  async getAuditLogsOptimized(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    return await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { timestamp: 'desc' },
        { id: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }
}

// Connection pool manager
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private config: ConnectionPoolConfig;

  private constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000'),
      createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200'),
    };
  }

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  getOptimizedPrismaConfig() {
    return {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool configuration would be handled by the database URL
      // For PostgreSQL: postgresql://user:password@host:port/database?connection_limit=20&pool_timeout=20
    };
  }

  getConnectionPoolConfig(): ConnectionPoolConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Database maintenance utilities
export class DatabaseMaintenance {
  constructor(private prisma: OptimizedPrismaClient) {}

  async runVacuumAnalyze(): Promise<void> {
    try {
      await this.prisma.$executeRaw`VACUUM ANALYZE;`;
      console.log('[DB] VACUUM ANALYZE completed successfully');
    } catch (error) {
      console.error('[DB] VACUUM ANALYZE failed:', error);
      throw error;
    }
  }

  async updateTableStatistics(): Promise<void> {
    try {
      await this.prisma.$executeRaw`ANALYZE;`;
      console.log('[DB] Table statistics updated successfully');
    } catch (error) {
      console.error('[DB] Failed to update table statistics:', error);
      throw error;
    }
  }

  async cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`[DB] Cleaned up ${result.count} old audit logs`);
      return result.count;
    } catch (error) {
      console.error('[DB] Failed to cleanup old audit logs:', error);
      throw error;
    }
  }

  async cleanupOldUserActivities(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.userActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`[DB] Cleaned up ${result.count} old user activities`);
      return result.count;
    } catch (error) {
      console.error('[DB] Failed to cleanup old user activities:', error);
      throw error;
    }
  }

  async reindexTables(): Promise<void> {
    try {
      // Reindex all tables for better performance
      await this.prisma.$executeRaw`REINDEX DATABASE CONCURRENTLY;`;
      console.log('[DB] Database reindexing completed successfully');
    } catch (error) {
      console.error('[DB] Database reindexing failed:', error);
      throw error;
    }
  }
}