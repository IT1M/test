import { PrismaClient } from '@prisma/client';
import { OptimizedPrismaClient } from '@/utils/databaseOptimization';

const globalForPrisma = globalThis as unknown as {
  prisma: OptimizedPrismaClient | undefined;
};

// Enhanced Prisma configuration with connection pooling and performance monitoring
const createPrismaClient = () => {
  return new OptimizedPrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Enhanced connection management
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In production, set up connection monitoring
  prisma.$on('query', (e: any) => {
    // Log slow queries in production
    if (e.duration > 1000) {
      console.warn('[PRISMA] Slow query detected:', {
        query: e.query.substring(0, 100) + '...',
        duration: `${e.duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  prisma.$on('error', (e: any) => {
    console.error('[PRISMA] Database error:', e);
  });
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Connection health check
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      connected: true,
      latency,
    };
  } catch (error) {
    console.error('[PRISMA] Connection check failed:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[PRISMA] Database connection closed gracefully');
  } catch (error) {
    console.error('[PRISMA] Error during disconnect:', error);
  }
}

// Database maintenance utilities
export async function runDatabaseMaintenance(): Promise<{
  success: boolean;
  operations: Array<{ name: string; success: boolean; duration: number; error?: string }>;
}> {
  const operations: Array<{ name: string; success: boolean; duration: number; error?: string }> = [];
  
  // Refresh materialized views
  try {
    const start = Date.now();
    await prisma.$executeRaw`SELECT refresh_analytics_views();`;
    operations.push({
      name: 'refresh_materialized_views',
      success: true,
      duration: Date.now() - start,
    });
  } catch (error) {
    operations.push({
      name: 'refresh_materialized_views',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Update table statistics
  try {
    const start = Date.now();
    await prisma.$executeRaw`ANALYZE;`;
    operations.push({
      name: 'update_statistics',
      success: true,
      duration: Date.now() - start,
    });
  } catch (error) {
    operations.push({
      name: 'update_statistics',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Cleanup old data
  try {
    const start = Date.now();
    await prisma.$executeRaw`SELECT cleanup_old_data();`;
    operations.push({
      name: 'cleanup_old_data',
      success: true,
      duration: Date.now() - start,
    });
  } catch (error) {
    operations.push({
      name: 'cleanup_old_data',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const success = operations.every(op => op.success);
  
  return {
    success,
    operations,
  };
}

// Performance monitoring
export async function getDatabasePerformanceMetrics(): Promise<{
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
  };
  queryMetrics: {
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  tableStats: Array<{
    table: string;
    size: string;
    rows: number;
  }>;
}> {
  try {
    // Get connection pool stats
    const connectionStats = await prisma.$queryRaw<Array<{
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

    const connectionPool = {
      active: 0,
      idle: 0,
      waiting: 0,
      total: 0,
    };

    connectionStats.forEach(stat => {
      const count = Number(stat.count);
      connectionPool.total += count;
      
      switch (stat.state) {
        case 'active':
          connectionPool.active = count;
          break;
        case 'idle':
          connectionPool.idle = count;
          break;
        case 'idle in transaction':
        case 'idle in transaction (aborted)':
          connectionPool.waiting = count;
          break;
      }
    });

    // Get query metrics from the optimized client
    const queryMetrics = {
      averageQueryTime: prisma.getAverageQueryTime(),
      slowQueries: prisma.getSlowQueries().length,
      totalQueries: prisma.getQueryMetrics().length,
    };

    // Get table stats
    const tableStats = await prisma.$queryRaw<Array<{
      table_name: string;
      size: string;
      row_count: bigint;
    }>>`
      SELECT 
        tablename as table_name,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
        COALESCE(n_tup_ins + n_tup_upd + n_tup_del, 0) as row_count
      FROM pg_tables 
      LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.'||tablename) DESC
      LIMIT 10;
    `;

    return {
      connectionPool,
      queryMetrics,
      tableStats: tableStats.map(stat => ({
        table: stat.table_name,
        size: stat.size,
        rows: Number(stat.row_count),
      })),
    };
  } catch (error) {
    console.error('[PRISMA] Failed to get performance metrics:', error);
    throw error;
  }
}

// Export the enhanced client
export default prisma;
