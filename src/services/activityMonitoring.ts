import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface SessionInfo {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: string;
  browser?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  duration: number; // in minutes
}

export interface ActivitySummary {
  totalActiveSessions: number;
  totalUsers: number;
  recentActivities: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    resource?: string;
    timestamp: Date;
    ipAddress: string;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    count: number;
  }>;
}

export interface SecurityAlertInfo {
  id: string;
  userId?: string;
  userName?: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  isResolved: boolean;
  createdAt: Date;
}

export class ActivityMonitoringService {
  // Get all active sessions
  static async getActiveSessions(): Promise<SessionInfo[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return sessions.map(session => ({
      ...session,
      location: session.location || undefined,
      device: session.device || undefined,
      browser: session.browser || undefined,
      duration: Math.floor((Date.now() - session.createdAt.getTime()) / (1000 * 60)),
    }));
  }

  // Get activity summary for dashboard
  static async getActivitySummary(hours: number = 24): Promise<ActivitySummary> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get active sessions count
    const totalActiveSessions = await prisma.userSession.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Get unique active users count
    const activeUserSessions = await prisma.userSession.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Get recent activities
    const recentActivities = await prisma.userActivity.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    // Get top actions
    const actionCounts = await prisma.userActivity.groupBy({
      by: ['action'],
      where: {
        timestamp: {
          gte: since,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    // Get hourly activity distribution
    const hourlyActivity = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM "UserActivity"
      WHERE timestamp >= ${since}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    return {
      totalActiveSessions,
      totalUsers: activeUserSessions.length,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        userName: activity.user.name,
        action: activity.action,
        resource: activity.resource || undefined,
        timestamp: activity.timestamp,
        ipAddress: activity.ipAddress,
      })),
      topActions: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      hourlyActivity: hourlyActivity.map(item => ({
        hour: Number(item.hour),
        count: Number(item.count),
      })),
    };
  }

  // Track user activity
  static async trackActivity(
    userId: string,
    sessionId: string | null,
    action: string,
    resource?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    duration?: number
  ): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          sessionId,
          action,
          resource,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          duration,
        },
      });

      // Update session last activity if session exists
      if (sessionId) {
        await prisma.userSession.updateMany({
          where: {
            sessionId,
            isActive: true,
          },
          data: {
            lastActivity: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  // Create or update user session
  static async createOrUpdateSession(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    expiresAt: Date,
    location?: string,
    device?: string,
    browser?: string
  ): Promise<void> {
    try {
      await prisma.userSession.upsert({
        where: {
          sessionId,
        },
        update: {
          lastActivity: new Date(),
          expiresAt,
          isActive: true,
        },
        create: {
          userId,
          sessionId,
          ipAddress,
          userAgent,
          location,
          device,
          browser,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Failed to create/update session:', error);
    }
  }

  // End user session
  static async endSession(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.updateMany({
        where: {
          sessionId,
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Get security alerts
  static async getSecurityAlerts(
    limit: number = 50,
    onlyUnresolved: boolean = false
  ): Promise<SecurityAlertInfo[]> {
    const alerts = await prisma.securityAlert.findMany({
      where: onlyUnresolved ? { isResolved: false } : undefined,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return alerts.map(alert => ({
      id: alert.id,
      userId: alert.userId || undefined,
      userName: alert.user?.name,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      metadata: alert.metadata,
      ipAddress: alert.ipAddress || undefined,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
    }));
  }

  // Create security alert
  static async createSecurityAlert(
    alertType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    title: string,
    description: string,
    userId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.securityAlert.create({
        data: {
          userId,
          alertType,
          severity,
          title,
          description,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  // Resolve security alert
  static async resolveSecurityAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await prisma.securityAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedBy,
          resolvedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to resolve security alert:', error);
    }
  }

  // Detect suspicious activities
  static async detectSuspiciousActivities(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Check for multiple failed login attempts
      const failedLogins = await prisma.auditLog.groupBy({
        by: ['ipAddress'],
        where: {
          action: 'LOGIN',
          timestamp: {
            gte: oneHourAgo,
          },
          newValue: {
            path: ['success'],
            equals: false,
          },
        },
        _count: {
          ipAddress: true,
        },
        having: {
          ipAddress: {
            _count: {
              gte: 5, // 5 or more failed attempts
            },
          },
        },
      });

      for (const failedLogin of failedLogins) {
        if (failedLogin.ipAddress) {
          await this.createSecurityAlert(
            'MULTIPLE_FAILED_ATTEMPTS',
            'HIGH',
            'Multiple Failed Login Attempts',
            `${failedLogin._count.ipAddress} failed login attempts detected from IP ${failedLogin.ipAddress} in the last hour`,
            undefined,
            { ipAddress: failedLogin.ipAddress, attempts: failedLogin._count.ipAddress },
            failedLogin.ipAddress
          );
        }
      }

      // Check for unusual activity patterns (high activity volume)
      const highActivityUsers = await prisma.userActivity.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: oneHourAgo,
          },
        },
        _count: {
          userId: true,
        },
        having: {
          userId: {
            _count: {
              gte: 100, // 100 or more activities in an hour
            },
          },
        },
      });

      for (const highActivity of highActivityUsers) {
        const user = await prisma.user.findUnique({
          where: { id: highActivity.userId },
          select: { name: true, email: true },
        });

        if (user) {
          await this.createSecurityAlert(
            'UNUSUAL_ACTIVITY',
            'MEDIUM',
            'Unusual High Activity Volume',
            `User ${user.name} (${user.email}) has performed ${highActivity._count.userId} activities in the last hour, which is unusually high`,
            highActivity.userId,
            { activityCount: highActivity._count.userId }
          );
        }
      }

      // Check for logins from new locations/devices
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN',
          timestamp: {
            gte: oneDayAgo,
          },
          newValue: {
            path: ['success'],
            equals: true,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      for (const login of recentLogins) {
        if (login.ipAddress && login.user) {
          // Check if this IP has been used by this user before
          const previousLogin = await prisma.auditLog.findFirst({
            where: {
              userId: login.userId,
              action: 'LOGIN',
              ipAddress: login.ipAddress,
              timestamp: {
                lt: oneDayAgo,
              },
            },
          });

          if (!previousLogin) {
            await this.createSecurityAlert(
              'SUSPICIOUS_LOGIN',
              'MEDIUM',
              'Login from New Location',
              `User ${login.user.name} (${login.user.email}) logged in from a new IP address: ${login.ipAddress}`,
              login.userId,
              { ipAddress: login.ipAddress, userAgent: login.userAgent },
              login.ipAddress,
              login.userAgent || undefined
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect suspicious activities:', error);
    }
  }

  // Clean up old sessions and activities
  static async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Mark expired sessions as inactive
      await prisma.userSession.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      // Delete old activities (keep only last 30 days)
      await prisma.userActivity.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Delete old inactive sessions (keep only last 7 days)
      await prisma.userSession.deleteMany({
        where: {
          isActive: false,
          endedAt: {
            lt: sevenDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }
}