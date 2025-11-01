import { NextRequest, NextResponse } from 'next/server';
import { AlertManager } from '@/services/ai/alert-manager';
import { AIAlert } from '@/types/database';

/**
 * GET /api/ai-control/automation-rules
 * Get all automation/alert rules
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const isActive = searchParams.get('is_active');
    const alertType = searchParams.get('alert_type');

    const filter: any = {};
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }

    if (alertType) {
      filter.alertType = alertType as AIAlert['alertType'];
    }

    // Get alert rules
    const rules = await AlertManager.getAlertRules(filter);

    return NextResponse.json({
      success: true,
      rules: rules.map(rule => ({
        id: rule.id,
        rule_name: rule.ruleName,
        description: rule.description,
        condition_type: rule.conditionType,
        condition: rule.condition,
        alert_type: rule.alertType,
        severity: rule.severity,
        message_template: rule.messageTemplate,
        notification_channels: rule.notificationChannels,
        notify_users: rule.notifyUsers,
        notify_roles: rule.notifyRoles,
        aggregation_window: rule.aggregationWindow,
        max_alerts_per_window: rule.maxAlertsPerWindow,
        escalation_enabled: rule.escalationEnabled,
        escalation_delay: rule.escalationDelay,
        escalation_users: rule.escalationUsers,
        is_active: rule.isActive,
        trigger_count: rule.triggerCount,
        last_triggered: rule.lastTriggered?.toISOString(),
        created_at: rule.createdAt.toISOString(),
        updated_at: rule.updatedAt.toISOString(),
      })),
      total: rules.length,
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch automation rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-control/automation-rules
 * Create or update automation/alert rules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.rule_name || !body.condition_type || !body.alert_type || !body.severity) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'rule_name, condition_type, alert_type, and severity are required'
        },
        { status: 400 }
      );
    }

    // Check if this is an update (has rule_id) or create
    if (body.rule_id) {
      // Update existing rule
      await AlertManager.updateAlertRule(body.rule_id, {
        ruleName: body.rule_name,
        description: body.description,
        conditionType: body.condition_type,
        condition: body.condition,
        alertType: body.alert_type,
        severity: body.severity,
        messageTemplate: body.message_template,
        notificationChannels: body.notification_channels,
        notifyUsers: body.notify_users,
        notifyRoles: body.notify_roles,
        aggregationWindow: body.aggregation_window,
        maxAlertsPerWindow: body.max_alerts_per_window,
        escalationEnabled: body.escalation_enabled,
        escalationDelay: body.escalation_delay,
        escalationUsers: body.escalation_users,
        isActive: body.is_active !== undefined ? body.is_active : true,
      });

      return NextResponse.json({
        success: true,
        message: 'Rule updated successfully',
        rule_id: body.rule_id,
      });
    } else {
      // Create new rule
      const ruleId = await AlertManager.createAlertRule({
        ruleName: body.rule_name,
        description: body.description,
        conditionType: body.condition_type,
        condition: body.condition || {},
        alertType: body.alert_type,
        severity: body.severity,
        messageTemplate: body.message_template || `Alert: ${body.rule_name}`,
        notificationChannels: body.notification_channels || ['in-app'],
        notifyUsers: body.notify_users,
        notifyRoles: body.notify_roles,
        aggregationWindow: body.aggregation_window,
        maxAlertsPerWindow: body.max_alerts_per_window,
        escalationEnabled: body.escalation_enabled,
        escalationDelay: body.escalation_delay,
        escalationUsers: body.escalation_users,
      });

      return NextResponse.json({
        success: true,
        message: 'Rule created successfully',
        rule_id: ruleId,
      });
    }
  } catch (error) {
    console.error('Error managing automation rule:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to manage automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-control/automation-rules
 * Delete an automation/alert rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('rule_id');

    if (!ruleId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing rule_id parameter'
        },
        { status: 400 }
      );
    }

    await AlertManager.deleteAlertRule(ruleId);

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete automation rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
