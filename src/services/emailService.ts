import { prisma } from './prisma';
import { EmailStatus } from '@prisma/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@saudimais.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Saudi Mais Inventory System';
  }

  /**
   * Send email using external service (Resend, SendGrid, etc.)
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // If template is specified, load and render it
      if (options.templateId) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: options.templateId },
        });

        if (!template || !template.isActive) {
          throw new Error('Email template not found or inactive');
        }

        html = this.renderTemplate(template.htmlContent, options.variables || {});
        text = template.textContent ? this.renderTemplate(template.textContent, options.variables || {}) : undefined;
        subject = this.renderTemplate(template.subject, options.variables || {});
      }

      if (!html && !text) {
        throw new Error('Email must have either HTML or text content');
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      // Log email attempt
      const emailLog = await prisma.emailLog.create({
        data: {
          templateId: options.templateId,
          to: recipients.join(', '),
          subject,
          status: EmailStatus.PENDING,
          metadata: {
            variables: options.variables,
            hasAttachments: !!options.attachments?.length,
          },
        },
      });

      // Send email using configured provider
      const result = await this.sendViaProvider({
        to: recipients,
        subject,
        html,
        text,
        attachments: options.attachments,
      });

      // Update log with result
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error,
        },
      });

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email via configured provider
   */
  private async sendViaProvider(options: {
    to: string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // This is a placeholder implementation
    // In production, integrate with actual email service (Resend, SendGrid, AWS SES, etc.)
    
    if (!this.apiKey) {
      console.log('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        hasHtml: !!options.html,
        hasText: !!options.text,
      });
      
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    }

    try {
      // Example using Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Email service error: ${error}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Render email template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, variables[key]?.toString() || '');
    });

    return rendered;
  }

  /**
   * Create email template
   */
  async createTemplate(template: EmailTemplate) {
    return prisma.emailTemplate.create({
      data: template,
    });
  }

  /**
   * Update email template
   */
  async updateTemplate(id: string, data: Partial<EmailTemplate>) {
    return prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  /**
   * Get email template
   */
  async getTemplate(id: string) {
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * List email templates
   */
  async listTemplates(category?: string) {
    return prisma.emailTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Delete email template
   */
  async deleteTemplate(id: string) {
    return prisma.emailTemplate.delete({
      where: { id },
    });
  }

  /**
   * Get email logs
   */
  async getEmailLogs(filters?: {
    status?: EmailStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.emailLog.findMany({
      where,
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  /**
   * Send scheduled email
   */
  async scheduleEmail(options: EmailOptions, scheduledFor: Date) {
    // Store email for later sending
    // This would typically integrate with a job queue system
    const emailLog = await prisma.emailLog.create({
      data: {
        templateId: options.templateId,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        status: EmailStatus.PENDING,
        metadata: {
          scheduledFor: scheduledFor.toISOString(),
          variables: options.variables,
          html: options.html,
          text: options.text,
        },
      },
    });

    return {
      success: true,
      emailLogId: emailLog.id,
      scheduledFor,
    };
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    recipients: string[],
    options: Omit<EmailOptions, 'to'>
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // Send in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail({ ...options, to: email }))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            email: batch[index],
            error: result.status === 'rejected' ? result.reason : result.value.error || 'Unknown error',
          });
        }
      });

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    results.success = results.failed === 0;
    return results;
  }
}

export const emailService = new EmailService();

// Pre-defined email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  LOW_STOCK_ALERT: 'low_stock_alert',
  REPORT_READY: 'report_ready',
  BACKUP_COMPLETED: 'backup_completed',
  SECURITY_ALERT: 'security_alert',
  USER_INVITATION: 'user_invitation',
} as const;
