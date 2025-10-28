import { NextRequest } from "next/server";
import { ActivityMonitoringService } from "@/services/activityMonitoring";
// Note: auth() cannot be used in middleware context, we'll get session differently

export async function trackUserActivity(
  request: NextRequest,
  action: string,
  resource?: string,
  details?: any,
  duration?: number
) {
  try {
    // In middleware context, we'll track activities via API call
    // This is a simplified version that logs the activity
    console.log(`[Activity] ${action} on ${resource || 'unknown'}`);
    
    // We could also store this in a queue for batch processing
    // For now, we'll rely on the client-side tracking
  } catch (error) {
    console.error("Failed to track user activity:", error);
  }
}

export function getActionFromPath(pathname: string, method: string): string {
  // Map common paths to actions
  const pathActions: Record<string, string> = {
    '/dashboard': 'VIEW_DASHBOARD',
    '/data-entry': 'VIEW_DATA_ENTRY',
    '/data-log': 'VIEW_DATA_LOG',
    '/analytics': 'VIEW_ANALYTICS',
    '/reports': 'VIEW_REPORTS',
    '/settings': 'VIEW_SETTINGS',
    '/admin': 'VIEW_ADMIN',
    '/backup': 'VIEW_BACKUP',
    '/audit': 'VIEW_AUDIT',
  };

  // Check for API routes
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/inventory')) {
      switch (method) {
        case 'GET': return 'API_INVENTORY_READ';
        case 'POST': return 'API_INVENTORY_CREATE';
        case 'PUT': return 'API_INVENTORY_UPDATE';
        case 'DELETE': return 'API_INVENTORY_DELETE';
        default: return 'API_INVENTORY_ACCESS';
      }
    }
    
    if (pathname.includes('/reports')) {
      switch (method) {
        case 'GET': return 'API_REPORTS_READ';
        case 'POST': return 'API_REPORTS_CREATE';
        default: return 'API_REPORTS_ACCESS';
      }
    }
    
    if (pathname.includes('/backup')) {
      return 'API_BACKUP_ACCESS';
    }
    
    if (pathname.includes('/users')) {
      switch (method) {
        case 'GET': return 'API_USERS_READ';
        case 'POST': return 'API_USERS_CREATE';
        case 'PUT': return 'API_USERS_UPDATE';
        case 'DELETE': return 'API_USERS_DELETE';
        default: return 'API_USERS_ACCESS';
      }
    }
    
    return `API_${method}`;
  }

  // Check for exact matches first
  for (const [path, action] of Object.entries(pathActions)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return action;
    }
  }

  // Default action
  return 'PAGE_VIEW';
}

export function getResourceFromPath(pathname: string): string | undefined {
  // Extract resource from path
  if (pathname.startsWith('/api/')) {
    const parts = pathname.split('/');
    if (parts.length >= 3) {
      return parts[2]; // e.g., /api/inventory -> inventory
    }
  }
  
  // For regular pages, use the main section
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return parts[1]; // Skip locale part
  }
  
  return undefined;
}

export async function detectAndCreateSecurityAlerts(request: NextRequest) {
  try {
    // Run security detection in background
    setTimeout(async () => {
      await ActivityMonitoringService.detectSuspiciousActivities();
    }, 0);
  } catch (error) {
    console.error("Failed to detect security alerts:", error);
  }
}