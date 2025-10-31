import { logPermissionCheck } from '@/lib/security/audit';

// ============================================================================
// Permission Enum
// ============================================================================

export enum Permission {
  // Product permissions
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  MANAGE_PRODUCT_PRICING = 'manage_product_pricing',
  VIEW_PRODUCT_COSTS = 'view_product_costs',

  // Customer permissions
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMERS = 'create_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  VIEW_CUSTOMER_FINANCIAL = 'view_customer_financial',
  MANAGE_CUSTOMER_CREDIT = 'manage_customer_credit',

  // Order permissions
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDERS = 'create_orders',
  EDIT_ORDERS = 'edit_orders',
  CANCEL_ORDERS = 'cancel_orders',
  APPROVE_ORDERS = 'approve_orders',
  VIEW_ORDER_COSTS = 'view_order_costs',

  // Financial permissions
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_REPORTS = 'view_reports',
  EXPORT_FINANCIAL_DATA = 'export_financial_data',
  MANAGE_INVOICES = 'manage_invoices',
  MANAGE_QUOTATIONS = 'manage_quotations',

  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  ADJUST_INVENTORY = 'adjust_inventory',
  MANAGE_STOCK_MOVEMENTS = 'manage_stock_movements',
  MANAGE_PURCHASE_ORDERS = 'manage_purchase_orders',
  VIEW_INVENTORY_COSTS = 'view_inventory_costs',

  // Medical permissions
  VIEW_PATIENTS = 'view_patients',
  CREATE_PATIENTS = 'create_patients',
  EDIT_PATIENTS = 'edit_patients',
  DELETE_PATIENTS = 'delete_patients',
  VIEW_MEDICAL_RECORDS = 'view_medical_records',
  CREATE_MEDICAL_RECORDS = 'create_medical_records',
  EDIT_MEDICAL_RECORDS = 'edit_medical_records',
  DELETE_MEDICAL_RECORDS = 'delete_medical_records',

  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_SALES_ANALYTICS = 'view_sales_analytics',
  VIEW_INVENTORY_ANALYTICS = 'view_inventory_analytics',
  VIEW_CUSTOMER_ANALYTICS = 'view_customer_analytics',
  VIEW_FINANCIAL_ANALYTICS = 'view_financial_analytics',

  // AI Features permissions
  USE_AI_INSIGHTS = 'use_ai_insights',
  USE_AI_FORECASTING = 'use_ai_forecasting',
  USE_AI_PRICING = 'use_ai_pricing',
  USE_AI_SEARCH = 'use_ai_search',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  VIEW_LOGS = 'view_logs',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_AUDIT_TRAIL = 'view_audit_trail',

  // Data management permissions
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  BACKUP_DATA = 'backup_data',
  RESTORE_DATA = 'restore_data',
  DELETE_DATA = 'delete_data',
}

// ============================================================================
// Role Type
// ============================================================================

export type Role = 'admin' | 'manager' | 'sales' | 'inventory' | 'medical';

// ============================================================================
// User Interface
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  permissions?: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

// ============================================================================
// Role Permissions Mapping
// ============================================================================

export const RolePermissions: Record<Role, Permission[]> = {
  admin: Object.values(Permission), // Admin has all permissions

  manager: [
    // Product permissions
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.MANAGE_PRODUCT_PRICING,
    Permission.VIEW_PRODUCT_COSTS,

    // Customer permissions
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.VIEW_CUSTOMER_FINANCIAL,
    Permission.MANAGE_CUSTOMER_CREDIT,

    // Order permissions
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.CANCEL_ORDERS,
    Permission.APPROVE_ORDERS,
    Permission.VIEW_ORDER_COSTS,

    // Financial permissions
    Permission.VIEW_FINANCIAL,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_FINANCIAL_DATA,
    Permission.MANAGE_INVOICES,
    Permission.MANAGE_QUOTATIONS,

    // Inventory permissions
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.MANAGE_STOCK_MOVEMENTS,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_INVENTORY_COSTS,

    // Medical permissions
    Permission.VIEW_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,

    // Analytics permissions
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_SALES_ANALYTICS,
    Permission.VIEW_INVENTORY_ANALYTICS,
    Permission.VIEW_CUSTOMER_ANALYTICS,
    Permission.VIEW_FINANCIAL_ANALYTICS,

    // AI Features
    Permission.USE_AI_INSIGHTS,
    Permission.USE_AI_FORECASTING,
    Permission.USE_AI_PRICING,
    Permission.USE_AI_SEARCH,

    // Data management
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA,
    Permission.VIEW_AUDIT_TRAIL,
  ],

  sales: [
    // Product permissions
    Permission.VIEW_PRODUCTS,

    // Customer permissions
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.VIEW_CUSTOMER_FINANCIAL,

    // Order permissions
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,

    // Financial permissions
    Permission.VIEW_REPORTS,
    Permission.MANAGE_QUOTATIONS,

    // Analytics permissions
    Permission.VIEW_SALES_ANALYTICS,
    Permission.VIEW_CUSTOMER_ANALYTICS,

    // AI Features
    Permission.USE_AI_INSIGHTS,
    Permission.USE_AI_SEARCH,

    // Data management
    Permission.EXPORT_DATA,
  ],

  inventory: [
    // Product permissions
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.VIEW_PRODUCT_COSTS,

    // Order permissions
    Permission.VIEW_ORDERS,

    // Inventory permissions
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.MANAGE_STOCK_MOVEMENTS,
    Permission.MANAGE_PURCHASE_ORDERS,
    Permission.VIEW_INVENTORY_COSTS,

    // Analytics permissions
    Permission.VIEW_INVENTORY_ANALYTICS,

    // AI Features
    Permission.USE_AI_INSIGHTS,
    Permission.USE_AI_FORECASTING,

    // Data management
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA,
  ],

  medical: [
    // Product permissions
    Permission.VIEW_PRODUCTS,

    // Medical permissions
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.EDIT_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.CREATE_MEDICAL_RECORDS,
    Permission.EDIT_MEDICAL_RECORDS,

    // AI Features
    Permission.USE_AI_INSIGHTS,
    Permission.USE_AI_SEARCH,

    // Data management
    Permission.EXPORT_DATA,
  ],
};

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  // Check custom permissions first
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePermissions = RolePermissions[user.role] || [];
  const hasAccess = rolePermissions.includes(permission);

  // Log permission check
  logPermissionCheck(user.id, permission, hasAccess);

  return hasAccess;
}

/**
 * Checks if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Checks if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Gets all permissions for a user
 */
export function getUserPermissions(user: User): Permission[] {
  if (!user || !user.isActive) {
    return [];
  }

  const rolePermissions = RolePermissions[user.role] || [];
  const customPermissions = user.permissions || [];

  // Combine and deduplicate
  return Array.from(new Set([...rolePermissions, ...customPermissions]));
}

/**
 * Checks if a user has a specific role
 */
export function hasRole(user: User, role: Role): boolean {
  return user && user.isActive && user.role === role;
}

/**
 * Checks if a user has any of the specified roles
 */
export function hasAnyRole(user: User, roles: Role[]): boolean {
  return roles.some((role) => hasRole(user, role));
}

// ============================================================================
// Permission Requirement Decorators
// ============================================================================

/**
 * Decorator to require a specific permission for a method
 */
export function requirePermission(permission: Permission) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasPermission(user, permission)) {
        throw new Error(
          `Permission denied: ${permission} required for ${propertyKey}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasAnyPermission(user, permissions)) {
        throw new Error(
          `Permission denied: One of [${permissions.join(', ')}] required for ${propertyKey}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to require all of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasAllPermissions(user, permissions)) {
        throw new Error(
          `Permission denied: All of [${permissions.join(', ')}] required for ${propertyKey}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to require a specific role
 */
export function requireRole(role: Role) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasRole(user, role)) {
        throw new Error(
          `Permission denied: ${role} role required for ${propertyKey}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current user (placeholder - should be implemented based on auth system)
 */
export function getCurrentUser(): User | null {
  // In a real implementation, this would get the user from the auth context/store
  if (typeof window !== 'undefined') {
    try {
      const userJson = localStorage.getItem('current_user');
      if (userJson) {
        return JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  }
  return null;
}

/**
 * Sets the current user
 */
export function setCurrentUser(user: User | null): void {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  }
}

/**
 * Checks if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null && user.isActive;
}

/**
 * Checks if user is admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user !== null && user.role === 'admin';
}

/**
 * Gets permission display name
 */
export function getPermissionDisplayName(permission: Permission): string {
  return permission
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets role display name
 */
export function getRoleDisplayName(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Gets permissions by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const categories: Record<string, Permission[]> = {
    Products: [],
    Customers: [],
    Orders: [],
    Financial: [],
    Inventory: [],
    Medical: [],
    Analytics: [],
    'AI Features': [],
    Admin: [],
    'Data Management': [],
  };

  for (const permission of Object.values(Permission)) {
    if (permission.includes('product')) {
      categories.Products.push(permission);
    } else if (permission.includes('customer')) {
      categories.Customers.push(permission);
    } else if (permission.includes('order')) {
      categories.Orders.push(permission);
    } else if (
      permission.includes('financial') ||
      permission.includes('payment') ||
      permission.includes('invoice') ||
      permission.includes('quotation')
    ) {
      categories.Financial.push(permission);
    } else if (permission.includes('inventory') || permission.includes('stock')) {
      categories.Inventory.push(permission);
    } else if (permission.includes('patient') || permission.includes('medical')) {
      categories.Medical.push(permission);
    } else if (permission.includes('analytics')) {
      categories.Analytics.push(permission);
    } else if (permission.includes('ai')) {
      categories['AI Features'].push(permission);
    } else if (
      permission.includes('user') ||
      permission.includes('role') ||
      permission.includes('log') ||
      permission.includes('setting') ||
      permission.includes('system') ||
      permission.includes('audit')
    ) {
      categories.Admin.push(permission);
    } else if (
      permission.includes('export') ||
      permission.includes('import') ||
      permission.includes('backup') ||
      permission.includes('restore') ||
      permission.includes('delete')
    ) {
      categories['Data Management'].push(permission);
    }
  }

  return categories;
}

/**
 * Validates if a permission exists
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}

/**
 * Validates if a role exists
 */
export function isValidRole(role: string): role is Role {
  return ['admin', 'manager', 'sales', 'inventory', 'medical'].includes(role);
}
