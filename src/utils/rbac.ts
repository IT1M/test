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
  action: "create" | "read" | "update" | "delete",
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
    },
    user: {
      create: ["ADMIN"],
      read: ["ADMIN"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
    },
    report: {
      create: ["MANAGER", "ADMIN"],
      read: ["MANAGER", "ADMIN"],
      update: ["MANAGER", "ADMIN"],
      delete: ["ADMIN"],
    },
    backup: {
      create: ["ADMIN"],
      read: ["ADMIN"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
    },
    settings: {
      create: ["ADMIN"],
      read: ["ADMIN", "MANAGER"],
      update: ["ADMIN"],
      delete: ["ADMIN"],
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
