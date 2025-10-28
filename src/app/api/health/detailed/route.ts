import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";

// GET /api/health/detailed - Get detailed system health metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has monitoring permissions
    if (!canPerformAction(session.user.role, "read", "monitoring")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Get database metrics
    const dbMetrics = await Promise.all([
      prisma.user.count(),
      prisma.inventoryItem.count(),
      prisma.auditLog.count({ where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.userSession.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.securityAlert.count({ where: { isResolved: false } }),
      prisma.auditLog.count({ 
        where: { 
          action: "LOGIN",
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        } 
      }),
    ]);

    const [
      totalUsers, 
      totalInventoryItems, 
      auditLogsLast24h, 
      activeSessions, 
      activeUsers,
      unresolvedSecurityAlerts,
      loginsLast24h
    ] = dbMetrics;

    // Get recent failed login attempts
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: "LOGIN",
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        newValue: { path: ["success"], equals: false }
      }
    });

    // Calculate application metrics
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const recentRequests = await prisma.auditLog.count({
      where: {
        timestamp: { gte: oneMinuteAgo }
      }
    });

    // Mock system metrics (in production, these would come from actual system monitoring)
    const getRandomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

    // Simulate realistic system metrics
    const cpuUsage = getRandomInRange(15, 75);
    const memoryUsed = getRandomInRange(1000000000, 3000000000); // 1-3GB
    const memoryTotal = 4000000000; // 4GB
    const diskUsed = getRandomInRange(10000000000, 60000000000); // 10-60GB
    const diskTotal = 100000000000; // 100GB
    
    const systemMetrics = {
      server: {
        uptime: getRandomInRange(3600, 604800), // 1 hour to 7 days
        status: (cpuUsage > 80 || (memoryUsed / memoryTotal) > 0.9) ? "warning" : "healthy" as const,
        lastRestart: new Date(Date.now() - getRandomInRange(3600000, 604800000)).toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      },
      database: {
        status: (activeSessions > 80 || unresolvedSecurityAlerts > 5) ? "warning" : "healthy" as const,
        connections: {
          active: activeSessions,
          max: 100,
          idle: getRandomInRange(5, 25),
        },
        queryPerformance: {
          avgResponseTime: getRandomInRange(10, 100),
          slowQueries: getRandomInRange(0, 5),
        },
        size: {
          used: getRandomInRange(500000000, 1500000000), // 500MB - 1.5GB
          total: 2000000000, // 2GB
        },
      },
      performance: {
        cpu: {
          usage: cpuUsage,
          cores: 4,
          load: [
            getRandomFloat(0.1, 2.0),
            getRandomFloat(0.1, 2.0),
            getRandomFloat(0.1, 2.0),
          ],
        },
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          cached: getRandomInRange(200000000, 700000000), // 200-700MB
        },
        disk: {
          used: diskUsed,
          total: diskTotal,
          iops: getRandomInRange(100, 1000),
        },
      },
      application: {
        activeUsers: activeUsers,
        totalSessions: activeSessions,
        requestsPerMinute: recentRequests,
        errorRate: getRandomFloat(0, 3), // 0-3%
        responseTime: getRandomInRange(50, 300), // 50-300ms
      },
      security: {
        failedLogins: failedLogins,
        securityAlerts: unresolvedSecurityAlerts,
        lastSecurityScan: new Date(Date.now() - getRandomInRange(0, 86400000)).toISOString(),
        sslStatus: "valid" as const,
        sslExpiryDate: new Date(Date.now() + 86400 * 90 * 1000).toISOString(), // 90 days from now
      },
      network: {
        status: (getRandomFloat(0, 100) > 95) ? "warning" : "healthy" as const,
        latency: getRandomInRange(5, 100), // 5-100ms
        bandwidth: {
          incoming: getRandomInRange(100000, 2000000), // 100KB-2MB/s
          outgoing: getRandomInRange(50000, 1000000), // 50KB-1MB/s
        },
        requests: {
          successful: getRandomInRange(950, 999),
          failed: getRandomInRange(1, 50),
          total: 1000,
        },
      },
    };

    // Generate alerts based on actual metrics
    const alerts = [];

    if (systemMetrics.performance.cpu.usage > 80) {
      alerts.push({
        id: "cpu-critical",
        type: "critical" as const,
        title: "Critical CPU Usage",
        message: `CPU usage is critically high at ${systemMetrics.performance.cpu.usage}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Performance",
      });
    } else if (systemMetrics.performance.cpu.usage > 70) {
      alerts.push({
        id: "cpu-warning",
        type: "warning" as const,
        title: "High CPU Usage",
        message: `CPU usage is elevated at ${systemMetrics.performance.cpu.usage}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Performance",
      });
    }

    if ((systemMetrics.performance.memory.used / systemMetrics.performance.memory.total) > 0.9) {
      alerts.push({
        id: "memory-critical",
        type: "critical" as const,
        title: "Critical Memory Usage",
        message: `Memory usage is critically high at ${Math.round((systemMetrics.performance.memory.used / systemMetrics.performance.memory.total) * 100)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Performance",
      });
    }

    if ((systemMetrics.performance.disk.used / systemMetrics.performance.disk.total) > 0.85) {
      alerts.push({
        id: "disk-warning",
        type: "warning" as const,
        title: "Low Disk Space",
        message: `Disk usage is high at ${Math.round((systemMetrics.performance.disk.used / systemMetrics.performance.disk.total) * 100)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Performance",
      });
    }

    if (systemMetrics.security.failedLogins > 10) {
      alerts.push({
        id: "security-critical",
        type: "critical" as const,
        title: "Multiple Failed Login Attempts",
        message: `${systemMetrics.security.failedLogins} failed login attempts in the last hour`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Security",
      });
    } else if (systemMetrics.security.failedLogins > 5) {
      alerts.push({
        id: "security-warning",
        type: "warning" as const,
        title: "Elevated Failed Login Attempts",
        message: `${systemMetrics.security.failedLogins} failed login attempts detected`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Security",
      });
    }

    if (systemMetrics.application.errorRate > 2) {
      alerts.push({
        id: "app-error-rate",
        type: "error" as const,
        title: "High Application Error Rate",
        message: `Application error rate is ${systemMetrics.application.errorRate.toFixed(2)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Application",
      });
    }

    if (systemMetrics.database.connections.active > 80) {
      alerts.push({
        id: "db-connections",
        type: "warning" as const,
        title: "High Database Connection Usage",
        message: `Database connections are at ${systemMetrics.database.connections.active}/${systemMetrics.database.connections.max}`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "Database",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics: systemMetrics,
        alerts,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalUsers,
          totalInventoryItems,
          auditLogsLast24h,
          activeSessions,
          activeUsers,
          unresolvedSecurityAlerts,
          loginsLast24h,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching detailed health metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch health metrics",
        },
      },
      { status: 500 }
    );
  }
}