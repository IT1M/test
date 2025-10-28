import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { canPerformAction } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";

// Mock system configuration (in production, this would be stored in database or config files)
const defaultConfig = {
  general: {
    siteName: "Saudi Mais Inventory System",
    siteDescription: "Medical inventory management system for Saudi Mais",
    defaultLanguage: "ar",
    timezone: "Asia/Riyadh",
    maintenanceMode: false,
    registrationEnabled: false,
  },
  database: {
    connectionPoolSize: 20,
    queryTimeout: 30,
    backupRetentionDays: 30,
    autoBackupEnabled: true,
    autoBackupSchedule: "0 2 * * *", // Daily at 2 AM
  },
  security: {
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowedFileTypes: ["jpg", "jpeg", "png", "pdf", "xlsx", "csv"],
    maxFileSize: 10, // MB
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "noreply@saudimais.com",
    fromName: "Saudi Mais System",
    enableTLS: true,
  },
  performance: {
    cacheEnabled: true,
    cacheTTL: 3600, // seconds
    compressionEnabled: true,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60, // seconds
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notificationRetentionDays: 90,
    criticalAlertsEmail: "admin@saudimais.com",
  },
};

// In production, this would be stored in a database or configuration management system
let currentConfig = { ...defaultConfig };

// GET /api/settings - Get system configuration
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to read settings
    if (!canPerformAction(session.user.role, "read", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    // Remove sensitive information for non-admin users
    const configToReturn = { ...currentConfig };
    if (session.user.role !== "ADMIN") {
      // Remove sensitive email configuration
      configToReturn.email = {
        ...configToReturn.email,
        smtpPassword: "***",
        smtpUsername: configToReturn.email.smtpUsername ? "***" : "",
      };
    }

    return NextResponse.json({
      success: true,
      data: configToReturn,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch settings",
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update system configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to update settings
    if (!canPerformAction(session.user.role, "update", "settings")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the configuration structure
    const requiredSections = ["general", "database", "security", "email", "performance", "notifications"];
    for (const section of requiredSections) {
      if (!body[section]) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Missing required section: ${section}`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Store the old configuration for audit trail
    const oldConfig = { ...currentConfig };

    // Update configuration
    currentConfig = {
      general: {
        siteName: body.general.siteName || defaultConfig.general.siteName,
        siteDescription: body.general.siteDescription || defaultConfig.general.siteDescription,
        defaultLanguage: body.general.defaultLanguage || defaultConfig.general.defaultLanguage,
        timezone: body.general.timezone || defaultConfig.general.timezone,
        maintenanceMode: Boolean(body.general.maintenanceMode),
        registrationEnabled: Boolean(body.general.registrationEnabled),
      },
      database: {
        connectionPoolSize: Math.max(1, Math.min(100, body.database.connectionPoolSize || defaultConfig.database.connectionPoolSize)),
        queryTimeout: Math.max(5, Math.min(300, body.database.queryTimeout || defaultConfig.database.queryTimeout)),
        backupRetentionDays: Math.max(1, Math.min(365, body.database.backupRetentionDays || defaultConfig.database.backupRetentionDays)),
        autoBackupEnabled: Boolean(body.database.autoBackupEnabled),
        autoBackupSchedule: body.database.autoBackupSchedule || defaultConfig.database.autoBackupSchedule,
      },
      security: {
        sessionTimeout: Math.max(5, Math.min(1440, body.security.sessionTimeout || defaultConfig.security.sessionTimeout)),
        maxLoginAttempts: Math.max(1, Math.min(20, body.security.maxLoginAttempts || defaultConfig.security.maxLoginAttempts)),
        lockoutDuration: Math.max(1, Math.min(1440, body.security.lockoutDuration || defaultConfig.security.lockoutDuration)),
        passwordMinLength: Math.max(6, Math.min(50, body.security.passwordMinLength || defaultConfig.security.passwordMinLength)),
        requireTwoFactor: Boolean(body.security.requireTwoFactor),
        allowedFileTypes: Array.isArray(body.security.allowedFileTypes) ? body.security.allowedFileTypes : defaultConfig.security.allowedFileTypes,
        maxFileSize: Math.max(1, Math.min(100, body.security.maxFileSize || defaultConfig.security.maxFileSize)),
      },
      email: {
        smtpHost: body.email.smtpHost || "",
        smtpPort: Math.max(1, Math.min(65535, body.email.smtpPort || defaultConfig.email.smtpPort)),
        smtpUsername: body.email.smtpUsername || "",
        smtpPassword: body.email.smtpPassword === "***" ? currentConfig.email.smtpPassword : (body.email.smtpPassword || ""),
        fromEmail: body.email.fromEmail || defaultConfig.email.fromEmail,
        fromName: body.email.fromName || defaultConfig.email.fromName,
        enableTLS: Boolean(body.email.enableTLS),
      },
      performance: {
        cacheEnabled: Boolean(body.performance.cacheEnabled),
        cacheTTL: Math.max(60, Math.min(86400, body.performance.cacheTTL || defaultConfig.performance.cacheTTL)),
        compressionEnabled: Boolean(body.performance.compressionEnabled),
        rateLimitEnabled: Boolean(body.performance.rateLimitEnabled),
        rateLimitRequests: Math.max(1, Math.min(10000, body.performance.rateLimitRequests || defaultConfig.performance.rateLimitRequests)),
        rateLimitWindow: Math.max(1, Math.min(3600, body.performance.rateLimitWindow || defaultConfig.performance.rateLimitWindow)),
      },
      notifications: {
        enableEmailNotifications: Boolean(body.notifications.enableEmailNotifications),
        enablePushNotifications: Boolean(body.notifications.enablePushNotifications),
        notificationRetentionDays: Math.max(1, Math.min(365, body.notifications.notificationRetentionDays || defaultConfig.notifications.notificationRetentionDays)),
        criticalAlertsEmail: body.notifications.criticalAlertsEmail || defaultConfig.notifications.criticalAlertsEmail,
      },
    };

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "SystemConfiguration",
      entityId: "system",
      oldValue: oldConfig,
      newValue: currentConfig,
      ipAddress,
      userAgent,
    });

    // In production, you would save this to a database or configuration file
    // await saveConfigurationToDatabase(currentConfig);

    return NextResponse.json({
      success: true,
      data: currentConfig,
      message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update settings",
        },
      },
      { status: 500 }
    );
  }
}