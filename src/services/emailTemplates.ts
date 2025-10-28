/**
 * Default email templates for the system
 */

export const defaultEmailTemplates = [
  {
    name: 'welcome',
    subject: 'Welcome to Saudi Mais Inventory System',
    category: 'user',
    variables: ['userName', 'loginUrl'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f8fafc; }
    .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Saudi Mais</h1>
    </div>
    <div class="content">
      <p>Hello {{ userName }},</p>
      <p>Welcome to the Saudi Mais Inventory Management System! Your account has been created successfully.</p>
      <p>You can now log in to access the system:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ loginUrl }}" class="button">Login to Your Account</a>
      </p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Saudi Mais. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Welcome to Saudi Mais Inventory System

Hello {{ userName }},

Welcome to the Saudi Mais Inventory Management System! Your account has been created successfully.

You can now log in to access the system at: {{ loginUrl }}

If you have any questions, please don't hesitate to contact our support team.

© 2024 Saudi Mais. All rights reserved.`,
  },
  {
    name: 'low_stock_alert',
    subject: 'Low Stock Alert - {{ itemName }}',
    category: 'alert',
    variables: ['itemName', 'currentQuantity', 'threshold', 'dashboardUrl'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fffbeb; border: 2px solid #f59e0b; }
    .alert-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Low Stock Alert</h1>
    </div>
    <div class="content">
      <p>This is an automated alert from the Saudi Mais Inventory System.</p>
      <div class="alert-box">
        <h3>{{ itemName }}</h3>
        <p><strong>Current Quantity:</strong> {{ currentQuantity }}</p>
        <p><strong>Threshold:</strong> {{ threshold }}</p>
        <p style="color: #f59e0b;"><strong>Action Required:</strong> Please reorder this item soon.</p>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ dashboardUrl }}" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Saudi Mais. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Low Stock Alert - {{ itemName }}

This is an automated alert from the Saudi Mais Inventory System.

Item: {{ itemName }}
Current Quantity: {{ currentQuantity }}
Threshold: {{ threshold }}

Action Required: Please reorder this item soon.

View Dashboard: {{ dashboardUrl }}

© 2024 Saudi Mais. All rights reserved.`,
  },
  {
    name: 'report_ready',
    subject: 'Your Report is Ready - {{ reportTitle }}',
    category: 'report',
    variables: ['reportTitle', 'reportType', 'generatedDate', 'downloadUrl'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f0fdf4; }
    .report-info { background: white; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Report Ready</h1>
    </div>
    <div class="content">
      <p>Your requested report has been generated successfully.</p>
      <div class="report-info">
        <h3>{{ reportTitle }}</h3>
        <p><strong>Type:</strong> {{ reportType }}</p>
        <p><strong>Generated:</strong> {{ generatedDate }}</p>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ downloadUrl }}" class="button">Download Report</a>
      </p>
      <p style="font-size: 12px; color: #666;">Note: This download link will expire in 7 days.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Saudi Mais. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Your Report is Ready - {{ reportTitle }}

Your requested report has been generated successfully.

Report: {{ reportTitle }}
Type: {{ reportType }}
Generated: {{ generatedDate }}

Download Report: {{ downloadUrl }}

Note: This download link will expire in 7 days.

© 2024 Saudi Mais. All rights reserved.`,
  },
  {
    name: 'security_alert',
    subject: 'Security Alert - {{ alertType }}',
    category: 'security',
    variables: ['alertType', 'alertDescription', 'timestamp', 'ipAddress', 'actionUrl'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fef2f2; border: 2px solid #ef4444; }
    .alert-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Security Alert</h1>
    </div>
    <div class="content">
      <p><strong>A security event has been detected on your account.</strong></p>
      <div class="alert-box">
        <h3>{{ alertType }}</h3>
        <p>{{ alertDescription }}</p>
        <p><strong>Time:</strong> {{ timestamp }}</p>
        <p><strong>IP Address:</strong> {{ ipAddress }}</p>
      </div>
      <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{ actionUrl }}" class="button">Review Security Settings</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Saudi Mais. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Security Alert - {{ alertType }}

A security event has been detected on your account.

Alert: {{ alertType }}
Description: {{ alertDescription }}
Time: {{ timestamp }}
IP Address: {{ ipAddress }}

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.

Review Security Settings: {{ actionUrl }}

© 2024 Saudi Mais. All rights reserved.`,
  },
];
