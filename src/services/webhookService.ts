import { prisma } from './prisma';
import crypto from 'crypto';

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
}

export interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  userId: string;
  retryCount?: number;
  timeout?: number;
}

export class WebhookService {
  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create webhook signature
   */
  private createSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Create a new webhook
   */
  async createWebhook(config: WebhookConfig) {
    const secret = config.secret || this.generateSecret();

    const webhook = await prisma.webhook.create({
      data: {
        name: config.name,
        url: config.url,
        events: config.events,
        secret,
        userId: config.userId,
        retryCount: config.retryCount || 3,
        timeout: config.timeout || 30000,
      },
    });

    return webhook;
  }

  /**
   * List webhooks for a user
   */
  async listWebhooks(userId: string) {
    return prisma.webhook.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        lastTriggeredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    id: string,
    userId: string,
    data: {
      name?: string;
      url?: string;
      events?: string[];
      isActive?: boolean;
      retryCount?: number;
      timeout?: number;
    }
  ) {
    return prisma.webhook.update({
      where: { id, userId },
      data,
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string, userId: string) {
    return prisma.webhook.delete({
      where: { id, userId },
    });
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(webhookId: string, event: string, data: any) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.isActive) {
      return { success: false, error: 'Webhook not found or inactive' };
    }

    const events = webhook.events as string[];
    if (!events.includes(event) && !events.includes('*')) {
      return { success: false, error: 'Event not subscribed' };
    }

    const payload: WebhookEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook(webhook, payload);
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(
    webhook: any,
    payload: WebhookEvent,
    attemptNumber: number = 1
  ): Promise<{ success: boolean; error?: string; response?: any }> {
    const payloadString = JSON.stringify(payload);
    const signature = this.createSignature(payloadString, webhook.secret);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'User-Agent': 'SaudiMais-Webhook/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.text();
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      // Log webhook call
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: payload.event,
          payload: payload.data,
          response: parsedResponse,
          statusCode: response.status,
          success: response.ok,
          errorMessage: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
          attemptNumber,
        },
      });

      // Update last triggered timestamp
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      });

      if (!response.ok) {
        // Retry if not successful and attempts remaining
        if (attemptNumber < webhook.retryCount) {
          // Exponential backoff: 2^attempt seconds
          const delay = Math.pow(2, attemptNumber) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.sendWebhook(webhook, payload, attemptNumber + 1);
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          response: parsedResponse,
        };
      }

      return {
        success: true,
        response: parsedResponse,
      };
    } catch (error: any) {
      // Log failed attempt
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: payload.event,
          payload: payload.data,
          success: false,
          errorMessage: error.message,
          attemptNumber,
        },
      });

      // Retry if attempts remaining
      if (attemptNumber < webhook.retryCount) {
        const delay = Math.pow(2, attemptNumber) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWebhook(webhook, payload, attemptNumber + 1);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerEvent(event: string, data: any) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        OR: [
          { events: { array_contains: event } },
          { events: { array_contains: '*' } },
        ],
      },
    });

    const results = await Promise.allSettled(
      webhooks.map(webhook => this.sendWebhook(webhook, {
        event,
        data,
        timestamp: new Date().toISOString(),
      }))
    );

    return {
      triggered: webhooks.length,
      results: results.map((result, index) => ({
        webhookId: webhooks[index].id,
        webhookName: webhooks[index].name,
        success: result.status === 'fulfilled' && result.value.success,
        error: result.status === 'rejected' ? result.reason : 
               (result.status === 'fulfilled' && !result.value.success ? result.value.error : null),
      })),
    };
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(webhookId: string, limit: number = 50) {
    return prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string, userId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId, userId },
    });

    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testPayload: WebhookEvent = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook(webhook, testPayload);
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const webhookService = new WebhookService();

// Available webhook events
export const WEBHOOK_EVENTS = {
  INVENTORY_CREATED: 'inventory.created',
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_DELETED: 'inventory.deleted',
  INVENTORY_LOW_STOCK: 'inventory.low_stock',
  REPORT_GENERATED: 'report.generated',
  BACKUP_COMPLETED: 'backup.completed',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  SECURITY_ALERT: 'security.alert',
  ALL: '*',
} as const;
