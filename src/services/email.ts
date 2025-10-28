import { NotificationType } from "@prisma/client";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured email service
 * This is a placeholder implementation that logs emails in development
 * In production, integrate with services like SendGrid, AWS SES, or SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // In development, just log the email
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email would be sent:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    console.log("Text:", text || "No plain text version");
    return true;
  }

  // In production, integrate with your email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
  */

  // Example with Nodemailer (SMTP):
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
  */

  console.warn("Email service not configured. Email not sent.");
  return false;
}

/**
 * Generate email template for notifications
 */
export function generateNotificationEmailTemplate(
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
): { html: string; text: string } {
  const typeColors = {
    INFO: "#3b82f6",
    SUCCESS: "#10b981",
    WARNING: "#f59e0b",
    ERROR: "#ef4444",
  };

  const typeEmojis = {
    INFO: "ℹ️",
    SUCCESS: "✅",
    WARNING: "⚠️",
    ERROR: "❌",
  };

  const color = typeColors[type];
  const emoji = typeEmojis[type];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${emoji} ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              ${
                metadata && Object.keys(metadata).length > 0
                  ? `
              <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 15px; margin-top: 20px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">
                  Additional Details:
                </p>
                ${Object.entries(metadata)
                  .map(
                    ([key, value]) => `
                  <p style="margin: 5px 0; color: #374151; font-size: 14px;">
                    <strong>${key}:</strong> ${value}
                  </p>
                `
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Saudi Mais Medical Inventory System
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
${emoji} ${title}

${message}

${
  metadata && Object.keys(metadata).length > 0
    ? `
Additional Details:
${Object.entries(metadata)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}
`
    : ""
}

---
Saudi Mais Medical Inventory System
This is an automated notification. Please do not reply to this email.
  `;

  return { html, text };
}

/**
 * Send notification email to a user
 */
export async function sendNotificationEmail(
  userEmail: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const { html, text } = generateNotificationEmailTemplate(type, title, message, metadata);

  return await sendEmail({
    to: userEmail,
    subject: `[${type}] ${title}`,
    html,
    text,
  });
}
