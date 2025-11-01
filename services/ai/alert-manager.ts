// AI Alert Manager Service
// Comprehensive alert and notification system for AI Control Center
// Handles real-time alert generation, notification routing, and alert lifecycle management

import { db } from '@/lib/db/schema';
import { AIAlert, AIAlertRule } from '@/types/database';
import { generateId } from '@/lib/utils/generators';
import { useNotificationStore, showCriticalAlert, showWarning, showError, showInfo } from '@/store/notificationStore';
import { AIActivityLogger } from './activity-logger';

/**
 * Alert channel configuration
 */
export interface AlertChannel {
  type: 'in-app' | 'email' | 'sms' | 'webhook';
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Alert rule condition builder
 */
export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

/**
 * Alert aggregation result
 */
export interface AlertAggregation {
  alertType: AIAlert['alertType'];
  severity: AIAlert['severity'];
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedModels: string[];
}

/**
 * Alert analytics data
 */
export interface AlertAnalytics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number; // minutes
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  alertsByModel: Record<string, number>;
  topAlertRules: Array<{ ruleName: string; triggerCount: number }>;
  resolutionTrends: Array<{ date: string; resolved: number; created: number }>;
  mttr: number; // Mean Time To Resolution in minutes
}

/**
 * AI Alert Manager Class
 * Manages the complete lifecycle of AI alerts and notifications
 */
export class AlertManager {

  /**
   * Create a new alert
   */
  static async createAlert(params: {
    alertType: AIAlert['alertType'];
    severity: AIAlert['severity'];
    title: string;
    message: string;
    modelName?: string;
    affectedOperations?: string[];
    metadata?: Record<string, any>;
    notificationChannels?: AIAlert['notificationChannels'];
    escalationLevel?: number;
  }): Promise<string> {
    try {
      const alertId = generateId();
      
      const alert: AIAlert = {
        id: generateId(),
        alertId,
        alertType: params.alertType,
        severity: params.severity,
        title: params.title,
        message: params.message,
        modelName: params.modelName,
        affectedOperations: params.affectedOperations,
        metadata: params.metadata,
        status: 'active',
        notificationChannels: params.notificationChannels || ['in-app'],
        notificationsSent: 0,
        escalationLevel: params.escalationLevel || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check for similar recent alerts (aggregation)
      const shouldAggregate = await this.checkAggregation(alert);
      
      if (shouldAggregate) {
        console.log(`Alert aggregated: ${alert.title}`);
        return alertId;
      }

      // Save to database
      await db.aiAlerts.add(alert);

      // Send notifications
      await this.sendNotifications(alert);

      // Log alert creation
      await AIActivityLogger.logAIOperation({
        userId: 'system',
        modelName: params.modelName || 'alert-manager',
        operationType: 'other',
        operationDescription: 'alert-created',
        inputData: { alertType: params.alertType, severity: params.severity },
        outputData: { alertId },
        executionTime: 0,
        status: 'success',
        metadata: { alertTitle: params.title },
      });

      return alertId;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Check if alert should be aggregated to prevent notification fatigue
   */
  private static async checkAggregation(alert: AIAlert): Promise<boolean> {
    try {
      // Get alert rules for this alert type
      const rules = await db.aiAlertRules
        .where('alertType')
        .equals(alert.alertType)
        .and(rule => rule.isActive && rule.aggregationWindow !== undefined)
        .toArray();

      if (rules.length === 0) {
        return false;
      }

      const rule = rules[0];
      const windowMinutes = rule.aggregationWindow || 5;
      const maxAlerts = rule.maxAlertsPerWindow || 3;

      // Check for similar alerts in the aggregation window
      const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      const recentSimilarAlerts = await db.aiAlerts
        .where('alertType')
        .equals(alert.alertType)
        .and(a => 
          a.createdAt > cutoffTime &&
          a.modelName === alert.modelName &&
          a.status === 'active'
        )
        .count();

      return recentSimilarAlerts >= maxAlerts;
    } catch (error) {
      console.error('Failed to check aggregation:', error);
      return false;
    }
  }

  /**
   * Send notifications through configured channels
   */
  private static async sendNotifications(alert: AIAlert): Promise<void> {
    try {
      const channels = alert.notificationChannels;

      // In-app notification
      if (channels.includes('in-app')) {
        this.sendInAppNotification(alert);
      }

      // Email notification
      if (channels.includes('email')) {
        await this.sendEmailNotification(alert);
      }

      // SMS notification
      if (channels.includes('sms')) {
        await this.sendSMSNotification(alert);
      }

      // Webhook notification
      if (channels.includes('webhook')) {
        await this.sendWebhookNotification(alert);
      }

      // Update notification count
      await db.aiAlerts.update(alert.id, {
        notificationsSent: alert.notificationsSent + 1,
        lastNotificationAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  /**
   * Send in-app notification
   */
  private static sendInAppNotification(alert: AIAlert): void {
    const notificationStore = useNotificationStore.getState();

    switch (alert.severity) {
      case 'critical':
        showCriticalAlert(alert.title, alert.message, {
          label: 'View Alert',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = `/ai-control-center/alerts?id=${alert.alertId}`;
            }
          },
        });
        break;
      case 'high':
        showError(alert.title, alert.message, {
          priority: 'high',
          action: {
            label: 'View Alert',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = `/ai-control-center/alerts?id=${alert.alertId}`;
              }
            },
          },
        });
        break;
      case 'medium':
        showWarning(alert.title, alert.message, {
          priority: 'medium',
        });
        break;
      case 'low':
        showInfo(alert.title, alert.message, {
          priority: 'low',
        });
        break;
    }
  }

  /**
   * Send email notification (placeholder - integrate with email service)
   */
  private static async sendEmailNotification(alert: AIAlert): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send SMS notification (placeholder - integrate with SMS service)
   */
  private static async sendSMSNotification(alert: AIAlert): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[SMS] Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send webhook notification
   */
  private static async sendWebhookNotification(alert: AIAlert): Promise<void> {
    try {
      // TODO: Get webhook URL from configuration
      const webhookUrl = process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn('Webhook URL not configured');
        return;
      }

      const payload = {
        alertId: alert.alertId,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        modelName: alert.modelName,
        timestamp: alert.createdAt.toISOString(),
        metadata: alert.metadata,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const alert = await db.aiAlerts.where('alertId').equals(alertId).first();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      await db.aiAlerts.update(alert.id, {
        status: 'acknowledged',
        acknowledgedBy: userName,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      });

      // Log acknowledgment
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'alert-manager',
        operationType: 'other',
        operationDescription: 'alert-acknowledged',
        inputData: { alertId },
        outputData: { status: 'acknowledged' },
        executionTime: 0,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(
    alertId: string,
    userId: string,
    userName: string,
    resolutionNotes?: string
  ): Promise<void> {
    try {
      const alert = await db.aiAlerts.where('alertId').equals(alertId).first();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      await db.aiAlerts.update(alert.id, {
        status: 'resolved',
        resolvedBy: userName,
        resolvedAt: new Date(),
        resolutionNotes,
        updatedAt: new Date(),
      });

      // Log resolution
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'alert-manager',
        operationType: 'other',
        operationDescription: 'alert-resolved',
        inputData: { alertId, resolutionNotes },
        outputData: { status: 'resolved' },
        executionTime: 0,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * Snooze an alert
   */
  static async snoozeAlert(
    alertId: string,
    userId: string,
    userName: string,
    snoozeDurationMinutes: number
  ): Promise<void> {
    try {
      const alert = await db.aiAlerts.where('alertId').equals(alertId).first();
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      const snoozedUntil = new Date(Date.now() + snoozeDurationMinutes * 60 * 1000);

      await db.aiAlerts.update(alert.id, {
        status: 'snoozed',
        snoozedUntil,
        snoozedBy: userName,
        updatedAt: new Date(),
      });

      // Schedule automatic re-enabling
      setTimeout(async () => {
        await this.reactivateAlert(alertId);
      }, snoozeDurationMinutes * 60 * 1000);

      // Log snooze
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'alert-manager',
        operationType: 'other',
        operationDescription: 'alert-snoozed',
        inputData: { alertId, snoozeDurationMinutes },
        outputData: { status: 'snoozed', snoozedUntil },
        executionTime: 0,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to snooze alert:', error);
      throw error;
    }
  }

  /**
   * Reactivate a snoozed alert
   */
  private static async reactivateAlert(alertId: string): Promise<void> {
    try {
      const alert = await db.aiAlerts.where('alertId').equals(alertId).first();
      
      if (!alert || alert.status !== 'snoozed') {
        return;
      }

      // Check if snooze period has expired
      if (alert.snoozedUntil && alert.snoozedUntil > new Date()) {
        return;
      }

      await db.aiAlerts.update(alert.id, {
        status: 'active',
        snoozedUntil: undefined,
        snoozedBy: undefined,
        updatedAt: new Date(),
      });

      // Re-send notifications
      await this.sendNotifications(alert);
    } catch (error) {
      console.error('Failed to reactivate alert:', error);
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(filter?: {
    severity?: AIAlert['severity'];
    alertType?: AIAlert['alertType'];
    modelName?: string;
  }): Promise<AIAlert[]> {
    try {
      let query = db.aiAlerts.where('status').equals('active');

      const alerts = await query.toArray();

      let filtered = alerts;

      if (filter?.severity) {
        filtered = filtered.filter(a => a.severity === filter.severity);
      }

      if (filter?.alertType) {
        filtered = filtered.filter(a => a.alertType === filter.alertType);
      }

      if (filter?.modelName) {
        filtered = filtered.filter(a => a.modelName === filter.modelName);
      }

      return filtered.sort((a, b) => {
        // Sort by severity (critical first) then by creation time
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        
        if (severityDiff !== 0) return severityDiff;
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert history
   */
  static async getAlertHistory(filter?: {
    startDate?: Date;
    endDate?: Date;
    status?: AIAlert['status'];
    severity?: AIAlert['severity'];
    alertType?: AIAlert['alertType'];
    modelName?: string;
    limit?: number;
  }): Promise<AIAlert[]> {
    try {
      let query = db.aiAlerts.orderBy('createdAt').reverse();

      const alerts = await query.toArray();

      let filtered = alerts;

      if (filter?.startDate) {
        filtered = filtered.filter(a => a.createdAt >= filter.startDate!);
      }

      if (filter?.endDate) {
        filtered = filtered.filter(a => a.createdAt <= filter.endDate!);
      }

      if (filter?.status) {
        filtered = filtered.filter(a => a.status === filter.status);
      }

      if (filter?.severity) {
        filtered = filtered.filter(a => a.severity === filter.severity);
      }

      if (filter?.alertType) {
        filtered = filtered.filter(a => a.alertType === filter.alertType);
      }

      if (filter?.modelName) {
        filtered = filtered.filter(a => a.modelName === filter.modelName);
      }

      const limit = filter?.limit || 100;
      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Failed to get alert history:', error);
      throw error;
    }
  }

  /**
   * Get alert analytics
   */
  static async getAlertAnalytics(filter?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<AlertAnalytics> {
    try {
      const alerts = await this.getAlertHistory({
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        limit: 10000,
      });

      if (alerts.length === 0) {
        return {
          totalAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0,
          averageResolutionTime: 0,
          alertsByType: {},
          alertsBySeverity: {},
          alertsByModel: {},
          topAlertRules: [],
          resolutionTrends: [],
          mttr: 0,
        };
      }

      // Calculate metrics
      const totalAlerts = alerts.length;
      const activeAlerts = alerts.filter(a => a.status === 'active').length;
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

      // Calculate average resolution time
      const resolvedWithTime = alerts.filter(
        a => a.status === 'resolved' && a.resolvedAt && a.createdAt
      );
      
      const totalResolutionTime = resolvedWithTime.reduce((sum, alert) => {
        const resolutionTime = alert.resolvedAt!.getTime() - alert.createdAt.getTime();
        return sum + resolutionTime;
      }, 0);

      const averageResolutionTime = resolvedWithTime.length > 0
        ? totalResolutionTime / resolvedWithTime.length / (1000 * 60) // Convert to minutes
        : 0;

      // Alerts by type
      const alertsByType: Record<string, number> = {};
      alerts.forEach(alert => {
        alertsByType[alert.alertType] = (alertsByType[alert.alertType] || 0) + 1;
      });

      // Alerts by severity
      const alertsBySeverity: Record<string, number> = {};
      alerts.forEach(alert => {
        alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      });

      // Alerts by model
      const alertsByModel: Record<string, number> = {};
      alerts.forEach(alert => {
        if (alert.modelName) {
          alertsByModel[alert.modelName] = (alertsByModel[alert.modelName] || 0) + 1;
        }
      });

      // Top alert rules (would need to track which rule triggered each alert)
      const topAlertRules: Array<{ ruleName: string; triggerCount: number }> = [];

      // Resolution trends (daily)
      const resolutionTrends: Array<{ date: string; resolved: number; created: number }> = [];
      const dateMap: Record<string, { resolved: number; created: number }> = {};

      alerts.forEach(alert => {
        const dateKey = alert.createdAt.toISOString().split('T')[0];
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { resolved: 0, created: 0 };
        }
        dateMap[dateKey].created++;

        if (alert.status === 'resolved' && alert.resolvedAt) {
          const resolvedDateKey = alert.resolvedAt.toISOString().split('T')[0];
          if (!dateMap[resolvedDateKey]) {
            dateMap[resolvedDateKey] = { resolved: 0, created: 0 };
          }
          dateMap[resolvedDateKey].resolved++;
        }
      });

      Object.entries(dateMap).forEach(([date, counts]) => {
        resolutionTrends.push({ date, ...counts });
      });

      resolutionTrends.sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        averageResolutionTime,
        alertsByType,
        alertsBySeverity,
        alertsByModel,
        topAlertRules,
        resolutionTrends,
        mttr: averageResolutionTime, // MTTR = Mean Time To Resolution
      };
    } catch (error) {
      console.error('Failed to get alert analytics:', error);
      throw error;
    }
  }

  /**
   * Get alert aggregations (grouped similar alerts)
   */
  static async getAlertAggregations(
    lookbackHours: number = 24
  ): Promise<AlertAggregation[]> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
      
      const recentAlerts = await db.aiAlerts
        .where('createdAt')
        .above(cutoffTime)
        .toArray();

      // Group by alert type and severity
      const groups: Record<string, AlertAggregation> = {};

      recentAlerts.forEach(alert => {
        const key = `${alert.alertType}-${alert.severity}`;
        
        if (!groups[key]) {
          groups[key] = {
            alertType: alert.alertType,
            severity: alert.severity,
            count: 0,
            firstOccurrence: alert.createdAt,
            lastOccurrence: alert.createdAt,
            affectedModels: [],
          };
        }

        groups[key].count++;
        
        if (alert.createdAt < groups[key].firstOccurrence) {
          groups[key].firstOccurrence = alert.createdAt;
        }
        
        if (alert.createdAt > groups[key].lastOccurrence) {
          groups[key].lastOccurrence = alert.createdAt;
        }

        if (alert.modelName && !groups[key].affectedModels.includes(alert.modelName)) {
          groups[key].affectedModels.push(alert.modelName);
        }
      });

      return Object.values(groups).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get alert aggregations:', error);
      throw error;
    }
  }

  // ============================================================================
  // ALERT RULE MANAGEMENT
  // ============================================================================

  /**
   * Create an alert rule
   */
  static async createAlertRule(params: {
    ruleName: string;
    description?: string;
    conditionType: AIAlertRule['conditionType'];
    condition: Record<string, any>;
    alertType: AIAlert['alertType'];
    severity: AIAlert['severity'];
    messageTemplate: string;
    notificationChannels: AIAlert['notificationChannels'];
    notifyUsers?: string[];
    notifyRoles?: string[];
    aggregationWindow?: number;
    maxAlertsPerWindow?: number;
    escalationEnabled?: boolean;
    escalationDelay?: number;
    escalationUsers?: string[];
  }): Promise<string> {
    try {
      const ruleId = generateId();

      const rule: AIAlertRule = {
        id: ruleId,
        ruleName: params.ruleName,
        description: params.description,
        conditionType: params.conditionType,
        condition: params.condition,
        alertType: params.alertType,
        severity: params.severity,
        messageTemplate: params.messageTemplate,
        notificationChannels: params.notificationChannels,
        notifyUsers: params.notifyUsers,
        notifyRoles: params.notifyRoles,
        aggregationWindow: params.aggregationWindow,
        maxAlertsPerWindow: params.maxAlertsPerWindow,
        escalationEnabled: params.escalationEnabled || false,
        escalationDelay: params.escalationDelay,
        escalationUsers: params.escalationUsers,
        isActive: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.aiAlertRules.add(rule);

      return ruleId;
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  /**
   * Update an alert rule
   */
  static async updateAlertRule(
    ruleId: string,
    updates: Partial<Omit<AIAlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>>
  ): Promise<void> {
    try {
      await db.aiAlertRules.update(ruleId, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update alert rule:', error);
      throw error;
    }
  }

  /**
   * Delete an alert rule
   */
  static async deleteAlertRule(ruleId: string): Promise<void> {
    try {
      await db.aiAlertRules.delete(ruleId);
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
      throw error;
    }
  }

  /**
   * Get all alert rules
   */
  static async getAlertRules(filter?: {
    isActive?: boolean;
    alertType?: AIAlert['alertType'];
  }): Promise<AIAlertRule[]> {
    try {
      let query = db.aiAlertRules.toCollection();

      const rules = await query.toArray();

      let filtered = rules;

      if (filter?.isActive !== undefined) {
        filtered = filtered.filter(r => r.isActive === filter.isActive);
      }

      if (filter?.alertType) {
        filtered = filtered.filter(r => r.alertType === filter.alertType);
      }

      return filtered.sort((a, b) => b.triggerCount - a.triggerCount);
    } catch (error) {
      console.error('Failed to get alert rules:', error);
      throw error;
    }
  }

  /**
   * Evaluate alert rules against current data
   */
  static async evaluateAlertRules(context: {
    modelName?: string;
    operationType?: string;
    confidenceScore?: number;
    errorRate?: number;
    responseTime?: number;
    cost?: number;
    [key: string]: any;
  }): Promise<void> {
    try {
      const activeRules = await this.getAlertRules({ isActive: true });

      for (const rule of activeRules) {
        const shouldTrigger = await this.evaluateCondition(rule.condition, context);

        if (shouldTrigger) {
          // Generate alert message from template
          const message = this.interpolateTemplate(rule.messageTemplate, context);

          // Create alert
          await this.createAlert({
            alertType: rule.alertType,
            severity: rule.severity,
            title: rule.ruleName,
            message,
            modelName: context.modelName,
            notificationChannels: rule.notificationChannels,
            metadata: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              context,
            },
          });

          // Update rule trigger count
          await db.aiAlertRules.update(rule.id, {
            triggerCount: rule.triggerCount + 1,
            lastTriggered: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to evaluate alert rules:', error);
    }
  }

  /**
   * Evaluate a condition against context
   */
  private static async evaluateCondition(
    condition: Record<string, any>,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // Handle different condition types
      if (condition.type === 'threshold') {
        const field = condition.field;
        const operator = condition.operator;
        const value = condition.value;
        const contextValue = context[field];

        if (contextValue === undefined) {
          return false;
        }

        switch (operator) {
          case 'gt':
            return contextValue > value;
          case 'lt':
            return contextValue < value;
          case 'gte':
            return contextValue >= value;
          case 'lte':
            return contextValue <= value;
          case 'eq':
            return contextValue === value;
          case 'between':
            return contextValue >= condition.value && contextValue <= condition.value2;
          default:
            return false;
        }
      }

      // Handle pattern matching
      if (condition.type === 'pattern') {
        const field = condition.field;
        const pattern = condition.pattern;
        const contextValue = String(context[field] || '');

        return new RegExp(pattern).test(contextValue);
      }

      // Handle custom conditions (JavaScript expression)
      if (condition.type === 'custom') {
        // WARNING: eval is dangerous - use with caution in production
        // Consider using a safer expression evaluator library
        try {
          const fn = new Function('context', `return ${condition.expression}`);
          return fn(context);
        } catch {
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to evaluate condition:', error);
      return false;
    }
  }

  /**
   * Interpolate template with context values
   */
  private static interpolateTemplate(
    template: string,
    context: Record<string, any>
  ): string {
    let result = template;

    Object.entries(context).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return result;
  }

  // ============================================================================
  // ALERT CHANNEL CONFIGURATION
  // ============================================================================

  /**
   * Configure alert channels
   */
  static async configureChannels(channels: AlertChannel[]): Promise<void> {
    try {
      // Store channel configuration (could be in database or config file)
      // For now, we'll use localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertChannels', JSON.stringify(channels));
      }
    } catch (error) {
      console.error('Failed to configure channels:', error);
      throw error;
    }
  }

  /**
   * Get configured alert channels
   */
  static getConfiguredChannels(): AlertChannel[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('alertChannels');
        if (stored) {
          return JSON.parse(stored);
        }
      }

      // Default channels
      return [
        { type: 'in-app', enabled: true },
        { type: 'email', enabled: false },
        { type: 'sms', enabled: false },
        { type: 'webhook', enabled: false },
      ];
    } catch (error) {
      console.error('Failed to get configured channels:', error);
      return [{ type: 'in-app', enabled: true }];
    }
  }

  // ============================================================================
  // HELPER METHODS FOR COMMON ALERT SCENARIOS
  // ============================================================================

  /**
   * Create model failure alert
   */
  static async alertModelFailure(
    modelName: string,
    errorMessage: string,
    affectedOperations: string[]
  ): Promise<string> {
    return this.createAlert({
      alertType: 'model-failure',
      severity: 'critical',
      title: `Model Failure: ${modelName}`,
      message: `Model ${modelName} has failed: ${errorMessage}`,
      modelName,
      affectedOperations,
      notificationChannels: ['in-app', 'email'],
    });
  }

  /**
   * Create high error rate alert
   */
  static async alertHighErrorRate(
    modelName: string,
    errorRate: number,
    threshold: number
  ): Promise<string> {
    return this.createAlert({
      alertType: 'high-error-rate',
      severity: errorRate > threshold * 2 ? 'critical' : 'high',
      title: `High Error Rate: ${modelName}`,
      message: `Model ${modelName} error rate is ${(errorRate * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
      modelName,
      metadata: { errorRate, threshold },
      notificationChannels: ['in-app', 'email'],
    });
  }

  /**
   * Create budget exceeded alert
   */
  static async alertBudgetExceeded(
    budgetName: string,
    currentSpend: number,
    budgetLimit: number
  ): Promise<string> {
    return this.createAlert({
      alertType: 'budget-exceeded',
      severity: 'critical',
      title: `Budget Exceeded: ${budgetName}`,
      message: `Budget ${budgetName} has been exceeded. Current spend: $${currentSpend.toFixed(2)}, Limit: $${budgetLimit.toFixed(2)}`,
      metadata: { budgetName, currentSpend, budgetLimit },
      notificationChannels: ['in-app', 'email'],
    });
  }

  /**
   * Create security incident alert
   */
  static async alertSecurityIncident(
    incidentType: string,
    description: string,
    severity: AIAlert['severity'] = 'critical'
  ): Promise<string> {
    return this.createAlert({
      alertType: 'security-incident',
      severity,
      title: `Security Incident: ${incidentType}`,
      message: description,
      metadata: { incidentType },
      notificationChannels: ['in-app', 'email', 'sms'],
      escalationLevel: 1,
    });
  }

  /**
   * Create performance degradation alert
   */
  static async alertPerformanceDegradation(
    modelName: string,
    currentResponseTime: number,
    threshold: number
  ): Promise<string> {
    return this.createAlert({
      alertType: 'performance-degradation',
      severity: currentResponseTime > threshold * 2 ? 'high' : 'medium',
      title: `Performance Degradation: ${modelName}`,
      message: `Model ${modelName} response time is ${currentResponseTime}ms (threshold: ${threshold}ms)`,
      modelName,
      metadata: { currentResponseTime, threshold },
      notificationChannels: ['in-app'],
    });
  }

  /**
   * Create rate limit warning alert
   */
  static async alertRateLimitWarning(
    modelName: string,
    currentRate: number,
    limit: number
  ): Promise<string> {
    return this.createAlert({
      alertType: 'rate-limit-warning',
      severity: 'medium',
      title: `Rate Limit Warning: ${modelName}`,
      message: `Model ${modelName} is approaching rate limit. Current: ${currentRate}/min, Limit: ${limit}/min`,
      modelName,
      metadata: { currentRate, limit },
      notificationChannels: ['in-app'],
    });
  }

  /**
   * Create anomaly detected alert
   */
  static async alertAnomalyDetected(
    anomalyType: string,
    description: string,
    modelName?: string
  ): Promise<string> {
    return this.createAlert({
      alertType: 'anomaly-detected',
      severity: 'medium',
      title: `Anomaly Detected: ${anomalyType}`,
      message: description,
      modelName,
      metadata: { anomalyType },
      notificationChannels: ['in-app'],
    });
  }

  // ============================================================================
  // CLEANUP AND MAINTENANCE
  // ============================================================================

  /**
   * Clean up old resolved alerts
   */
  static async cleanupOldAlerts(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldAlerts = await db.aiAlerts
        .where('createdAt')
        .below(cutoffDate)
        .and(alert => alert.status === 'resolved')
        .toArray();

      const idsToDelete = oldAlerts.map(alert => alert.id);
      await db.aiAlerts.bulkDelete(idsToDelete);

      return idsToDelete.length;
    } catch (error) {
      console.error('Failed to cleanup old alerts:', error);
      throw error;
    }
  }

  /**
   * Check for snoozed alerts that need reactivation
   */
  static async checkSnoozedAlerts(): Promise<void> {
    try {
      const snoozedAlerts = await db.aiAlerts
        .where('status')
        .equals('snoozed')
        .toArray();

      const now = new Date();

      for (const alert of snoozedAlerts) {
        if (alert.snoozedUntil && alert.snoozedUntil <= now) {
          await this.reactivateAlert(alert.alertId);
        }
      }
    } catch (error) {
      console.error('Failed to check snoozed alerts:', error);
    }
  }

  /**
   * Initialize alert manager (call on app startup)
   */
  static async initialize(): Promise<void> {
    try {
      // Check for snoozed alerts that need reactivation
      await this.checkSnoozedAlerts();

      // Set up periodic check (every 5 minutes)
      if (typeof window !== 'undefined') {
        setInterval(() => {
          this.checkSnoozedAlerts();
        }, 5 * 60 * 1000);
      }

      console.log('Alert Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Alert Manager:', error);
    }
  }
}

// Export helper functions for common alert scenarios
export const alertHelpers = {
  modelFailure: AlertManager.alertModelFailure.bind(AlertManager),
  highErrorRate: AlertManager.alertHighErrorRate.bind(AlertManager),
  budgetExceeded: AlertManager.alertBudgetExceeded.bind(AlertManager),
  securityIncident: AlertManager.alertSecurityIncident.bind(AlertManager),
  performanceDegradation: AlertManager.alertPerformanceDegradation.bind(AlertManager),
  rateLimitWarning: AlertManager.alertRateLimitWarning.bind(AlertManager),
  anomalyDetected: AlertManager.alertAnomalyDetected.bind(AlertManager),
};
