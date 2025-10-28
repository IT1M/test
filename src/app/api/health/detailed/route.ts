import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;

    // Memory usage
    const memUsage = process.memoryUsage();
    
    // Disk space (if available)
    const fs = require('fs');
    let diskSpace = null;
    try {
      const stats = fs.statSync('.');
      diskSpace = {
        free: stats.free,
        total: stats.size,
      };
    } catch (e) {
      // Disk space not available in container
    }

    // Response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        status: 'connected',
        responseTime: `${dbTime}ms`,
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      diskSpace,
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
    };

    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 }
    );
  }
}
