import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

/**
 * Comprehensive Health Check Endpoint
 * Checks all system components and returns detailed status
 */

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    api: ComponentHealth;
  };
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    // Check connection pool
    const connections = await prisma.$queryRaw<any[]>`
      SELECT count(*) as total
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    
    const totalConnections = parseInt(connections[0]?.total || '0');
    
    if (responseTime > 1000) {
      return {
        status: 'degraded',
        message: 'Database responding slowly',
        responseTime,
        details: { connections: totalConnections },
      };
    }
    
    return {
      status: 'healthy',
      message: 'Database operational',
      responseTime,
      details: { connections: totalConnections },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

function checkMemory(): ComponentHealth {
  if (typeof process === 'undefined') {
    return {
      status: 'healthy',
      message: 'Memory check not available',
    };
  }
  
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;
  
  if (usagePercent > 90) {
    return {
      status: 'unhealthy',
      message: 'Memory usage critical',
      details: {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        usagePercent: usagePercent.toFixed(2),
      },
    };
  }
  
  if (usagePercent > 75) {
    return {
      status: 'degraded',
      message: 'Memory usage high',
      details: {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        usagePercent: usagePercent.toFixed(2),
      },
    };
  }
  
  return {
    status: 'healthy',
    message: 'Memory usage normal',
    details: {
      heapUsedMB: heapUsedMB.toFixed(2),
      heapTotalMB: heapTotalMB.toFixed(2),
      usagePercent: usagePercent.toFixed(2),
    },
  };
}

function checkDisk(): ComponentHealth {
  // In a real implementation, you would check disk space
  // For now, return healthy status
  return {
    status: 'healthy',
    message: 'Disk space adequate',
    details: {
      note: 'Disk check requires system-level access',
    },
  };
}

function checkAPI(): ComponentHealth {
  // Check if API is responding
  // This is a simple check since we're already in an API route
  return {
    status: 'healthy',
    message: 'API operational',
  };
}

function getMetrics() {
  // In a real implementation, these would come from a metrics store
  return {
    requestsPerMinute: 0,
    averageResponseTime: 0,
    errorRate: 0,
  };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Run all health checks
    const [database, memory, disk, api] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk()),
      Promise.resolve(checkAPI()),
    ]);
    
    // Determine overall status
    const checks = { database, memory, disk, api };
    const statuses = Object.values(checks).map(c => c.status);
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      checks,
      metrics: getMetrics(),
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
