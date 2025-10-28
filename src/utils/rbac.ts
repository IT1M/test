import { UserRole } from "@prisma/client";

// Define role hierarchy (higher number = more permissions)
const roleHierarchy: Record<UserRole, number> = {
  DATA_ENTRY: 1,
  AUDITOR: 2,
  SUPERVISOR: 3,
  MANAGER: 4,
  ADMIN: 5,
};

// Define route access rules
export const routeAccess: Record<string, UserRole[]> = {
  "/dashboard": ["ADMIN"],
  "/data-entry": ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"],
  "/data-log": ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"],
  "/analytics": ["MANAGER", "ADMIN"],
  "/audit": ["AUDITOR", "ADMIN"],
  "/backup": ["ADMIN"],
  "/reports": ["MANAGER", "ADMIN"],
  "/settings": ["ADMIN", "MANAGER"],
  "/settings/users": ["ADMIN"],
};

// Role-based dashboard redirects
export const roleDashboards: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  MANAGER: "/analytics",
  SUPERVISOR: "/data-log",
  DATA_ENTRY: "/data-entry",
  AUDITOR: "/audit",
};

/**
 * Check if a user role has access to a specific route
 */
export function hasRouteAccess(userRole: UserRole, path: string): boolean {
  // Remove locale prefix if present (e.g., /en/dashboard -> /dashboard)
  const cleanPath = path.replace(/^\/(en|ar)/, "");
  
  // Find matching route pattern
  for (const [route, allowedRoles] of Object.entries(routeAccess)) {
    if (cleanPath.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }
  
  // Default: allow access if no specific rule is defined
  return true;
}

/**
 * Check if a user role has minimum required role level
 */
export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Get the default dashboard for a user role
 */
export function getDefaultDashboard(userRole: UserRole): string {
  return roleDashboards[userRole] || "/data-entry";
}

/**
 * Check if user can perform an action based on role
 */
export function canPerformAction(
  userRole: UserRole,
  action: "create" | "read" | "update" | "delete" | "export" | "import" | "bulk",
  resource: string
): boolean {
  // Define action permissions
  const permissions: Record<
    string,
    Record<string, UserRole[]>
  > = {
    inventory: {
      create: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"],
      read: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"],
      update: ["SUPERVISOR", "MANAGER", "ADMIN"],
      delete: ["SUPERVISOR", "MANAGER", "ADMIN"],
      export: ["SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"],
      import: ["SUPERVISOR", "MANAGER", "ADMIN"],
      bulk: ["SUPERVISOR", "MANAGER", "ADMIN"],
    },
    user: {
      create: ["ADMIN"],
      read: ["ADMIN"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
      export: ["ADMIN"],
      bulk: ["ADMIN"],
    },
    report: {
      create: ["MANAGER", "ADMIN"],
      read: ["MANAGER", "ADMIN"],
      update: ["MANAGER", "ADMIN"],
      delete: ["ADMIN"],
      export: ["MANAGER", "ADMIN"],
    },
    backup: {
      create: ["ADMIN"],
      read: ["ADMIN"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
      export: ["ADMIN"],
    },
    settings: {
      create: ["ADMIN"],
      read: ["ADMIN", "MANAGER"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
    },
    audit: {
      read: ["AUDITOR", "ADMIN"],
      export: ["AUDITOR", "ADMIN"],
    },
    analytics: {
      read: ["MANAGER", "ADMIN"],
      export: ["MANAGER", "ADMIN"],
    },
    monitoring: {
      read: ["ADMIN"],
      update: ["ADMIN"],
    },
  };

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

/**
 * Enhanced permission system with more granular controls
 */
export interface Permission {
  resource: string;
  action: string;
  conditions?: string[];
}

export interface RoleDefinition {
  name: UserRole;
  level: number;
  permissions: Permission[];
  description: string;
}

// Enhanced role definitions with detailed permissions
export const enhancedRoleDefinitions: RoleDefinition[] = [
  {
    name: "DATA_ENTRY",
    level: 1,
    description: "Basic data entry and viewing permissions",
    permissions: [
      { resource: "inventory", action: "create" },
      { resource: "inventory", action: "read" },
      { resource: "inventory", action: "update", conditions: ["own_entries_only"] },
      { resource: "profile", action: "read" },
      { resource: "profile", action: "update" },
      { resource: "notifications", action: "read" },
      { resource: "search", action: "create" },
      { resource: "search", action: "read" },
    ],
  },
  {
    name: "SUPERVISOR",
    level: 3,
    description: "Can edit and delete inventory items, supervise data entry staff",
    permissions: [
      { resource: "inventory", action: "create" },
      { resource: "inventory", action: "read" },
      { resource: "inventory", action: "update" },
      { resource: "inventory", action: "delete" },
      { resource: "inventory", action: "export" },
      { resource: "inventory", action: "bulk" },
      { resource: "user", action: "read", conditions: ["data_entry_only"] },
      { resource: "profile", action: "read" },
      { resource: "profile", action: "update" },
      { resource: "notifications", action: "read" },
      { resource: "search", action: "create" },
      { resource: "search", action: "read" },
      { resource: "search", action: "share" },
    ],
  },
  {
    name: "AUDITOR",
    level: 2,
    description: "Can view and export audit logs, read-only access to most data",
    permissions: [
      { resource: "inventory", action: "read" },
      { resource: "inventory", action: "export" },
      { resource: "audit", action: "read" },
      { resource: "audit", action: "export" },
      { resource: "user", action: "read", conditions: ["basic_info_only"] },
      { resource: "profile", action: "read" },
      { resource: "profile", action: "update" },
      { resource: "notifications", action: "read" },
      { resource: "search", action: "create" },
      { resource: "search", action: "read" },
      { resource: "report", action: "read", conditions: ["audit_reports_only"] },
    ],
  },
  {
    name: "MANAGER",
    level: 4,
    description: "Access to analytics, reports, and AI insights, can manage supervisors",
    permissions: [
      { resource: "inventory", action: "create" },
      { resource: "inventory", action: "read" },
      { resource: "inventory", action: "update" },
      { resource: "inventory", action: "delete" },
      { resource: "inventory", action: "export" },
      { resource: "inventory", action: "bulk" },
      { resource: "analytics", action: "read" },
      { resource: "analytics", action: "export" },
      { resource: "report", action: "create" },
      { resource: "report", action: "read" },
      { resource: "report", action: "update" },
      { resource: "report", action: "export" },
      { resource: "user", action: "read", conditions: ["non_admin_only"] },
      { resource: "user", action: "update", conditions: ["non_admin_only"] },
      { resource: "settings", action: "read" },
      { resource: "profile", action: "read" },
      { resource: "profile", action: "update" },
      { resource: "notifications", action: "read" },
      { resource: "notifications", action: "create" },
      { resource: "search", action: "create" },
      { resource: "search", action: "read" },
      { resource: "search", action: "share" },
      { resource: "monitoring", action: "read", conditions: ["basic_metrics_only"] },
    ],
  },
  {
    name: "ADMIN",
    level: 5,
    description: "Full system access including user and settings management",
    permissions: [
      { resource: "*", action: "*" }, // Full access to everything
    ],
  },
];

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string,
  conditions?: string[]
): boolean {
  const roleDefinition = enhancedRoleDefinitions.find(r => r.name === userRole);
  if (!roleDefinition) return false;

  // Admin has access to everything
  if (userRole === "ADMIN") return true;

  // Check specific permissions
  return roleDefinition.permissions.some(permission => {
    const resourceMatch = permission.resource === "*" || permission.resource === resource;
    const actionMatch = permission.action === "*" || permission.action === action;
    
    if (!resourceMatch || !actionMatch) return false;

    // Check conditions if specified
    if (conditions && permission.conditions) {
      return conditions.some(condition => permission.conditions!.includes(condition));
    }

    return true;
  });
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(userRole: UserRole): Record<string, string[]> {
  const allPermissions: Record<string, Record<string, UserRole[]>> = {
    inventory: {
      create: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"],
      read: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"],
      update: ["SUPERVISOR", "MANAGER", "ADMIN"],
      delete: ["SUPERVISOR", "MANAGER", "ADMIN"],
      export: ["SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"],
      import: ["SUPERVISOR", "MANAGER", "ADMIN"],
      bulk: ["SUPERVISOR", "MANAGER", "ADMIN"],
    },
    user: {
      create: ["ADMIN"],
      read: ["ADMIN", "MANAGER"],
      update: ["ADMIN", "MANAGER"],
      delete: ["ADMIN"],
      export: ["ADMIN"],
      bulk: ["ADMIN"],
    },
    report: {
      create: ["MANAGER", "ADMIN"],
      read: ["MANAGER", "ADMIN", "AUDITOR"],
      update: ["MANAGER", "ADMIN"],
      delete: ["ADMIN"],
      export: ["MANAGER", "ADMIN", "AUDITOR"],
    },
    backup: {
      create: ["ADMIN"],
      read: ["ADMIN"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
      export: ["ADMIN"],
    },
    settings: {
      create: ["ADMIN"],
      read: ["ADMIN", "MANAGER"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
    },
    audit: {
      read: ["AUDITOR", "ADMIN"],
      export: ["AUDITOR", "ADMIN"],
    },
    analytics: {
      read: ["MANAGER", "ADMIN"],
      export: ["MANAGER", "ADMIN"],
    },
    monitoring: {
      read: ["ADMIN", "MANAGER"],
      update: ["ADMIN"],
    },
    profile: {
      read: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
      update: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
    },
    notifications: {
      read: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
      create: ["MANAGER", "ADMIN"],
      update: ["ADMIN"],
    },
    search: {
      create: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
      read: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
      share: ["SUPERVISOR", "MANAGER", "ADMIN"],
    },
  };

  const rolePermissions: Record<string, string[]> = {};

  Object.entries(allPermissions).forEach(([resource, actions]) => {
    const allowedActions: string[] = [];
    Object.entries(actions).forEach(([action, roles]) => {
      if (roles.includes(userRole)) {
        allowedActions.push(action);
      }
    });
    if (allowedActions.length > 0) {
      rolePermissions[resource] = allowedActions;
    }
  });

  return rolePermissions;
}

/**
 * Get detailed role information
 */
export function getRoleDefinition(userRole: UserRole): RoleDefinition | undefined {
  return enhancedRoleDefinitions.find(r => r.name === userRole);
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  if (managerRole === "ADMIN") return true;
  if (managerRole === "MANAGER" && targetRole !== "ADMIN") return true;
  return false;
}

/**
 * Get users that a role can manage
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case "ADMIN":
      return ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"];
    case "MANAGER":
      return ["DATA_ENTRY", "SUPERVISOR", "AUDITOR"];
    default:
      return [];
  }
}

/**
 * Enhanced role hierarchy with more granular permissions
 */
export const roleCapabilities: Record<UserRole, {
  canManageUsers: UserRole[];
  canViewUsers: UserRole[];
  canExportData: boolean;
  canBulkOperations: boolean;
  canViewSecurityAlerts: boolean;
  canManageSecurityAlerts: boolean;
  maxUsersManageable?: number;
}> = {
  ADMIN: {
    canManageUsers: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
    canViewUsers: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
    canExportData: true,
    canBulkOperations: true,
    canViewSecurityAlerts: true,
    canManageSecurityAlerts: true,
  },
  MANAGER: {
    canManageUsers: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR"],
    canViewUsers: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER"],
    canExportData: true,
    canBulkOperations: true,
    canViewSecurityAlerts: true,
    canManageSecurityAlerts: false,
    maxUsersManageable: 50,
  },
  SUPERVISOR: {
    canManageUsers: [],
    canViewUsers: ["DATA_ENTRY"],
    canExportData: false,
    canBulkOperations: false,
    canViewSecurityAlerts: false,
    canManageSecurityAlerts: false,
    maxUsersManageable: 10,
  },
  AUDITOR: {
    canManageUsers: [],
    canViewUsers: ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"],
    canExportData: true,
    canBulkOperations: false,
    canViewSecurityAlerts: true,
    canManageSecurityAlerts: false,
  },
  DATA_ENTRY: {
    canManageUsers: [],
    canViewUsers: [],
    canExportData: false,
    canBulkOperations: false,
    canViewSecurityAlerts: false,
    canManageSecurityAlerts: false,
  },
};

/**
 * Check if a user role can view another user's details
 */
export function canViewUser(viewerRole: UserRole, targetRole: UserRole): boolean {
  const capabilities = roleCapabilities[viewerRole];
  return capabilities.canViewUsers.includes(targetRole);
}

/**
 * Check if a user role can export user data
 */
export function canExportUserData(userRole: UserRole): boolean {
  return roleCapabilities[userRole].canExportData;
}

/**
 * Check if a user role can perform bulk operations
 */
export function canPerformBulkOperations(userRole: UserRole): boolean {
  return roleCapabilities[userRole].canBulkOperations;
}

/**
 * Get maximum number of users a role can manage
 */
export function getMaxManageableUsers(userRole: UserRole): number | undefined {
  return roleCapabilities[userRole].maxUsersManageable;
}

/**
 * Check if a user can view security alerts
 */
export function canViewSecurityAlerts(userRole: UserRole): boolean {
  return roleCapabilities[userRole].canViewSecurityAlerts;
}

/**
 * Check if a user can manage security alerts
 */
export function canManageSecurityAlerts(userRole: UserRole): boolean {
  return roleCapabilities[userRole].canManageSecurityAlerts;
}
