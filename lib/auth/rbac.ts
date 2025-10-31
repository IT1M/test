// Role-Based Access Control (RBAC) - Permission definitions and management
// Requirements: 12.8

import { User, UserRole } from '@/types/database';

/**
 * System permissions enum
 */
export enum Permission {
  // Product permissions
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Customer permissions
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMERS = 'create_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  
  // Order permissions
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDERS = 'create_orders',
  EDIT_ORDERS = 'edit_orders',
  CANCEL_ORDERS = 'cancel_orders',
  DELETE_ORDERS = 'delete_orders',
  
  // Financial permissions
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  ADJUST_INVENTORY = 'adjust_inventory',
  MANAGE_PURCHASE_ORDERS = 'manage_purchase_orders',
  
  // Medical permissions
  VIEW_PATIENTS = 'view_patients',
  CREATE_PATIENTS = 'create_patients',
  EDIT_PATIENTS = 'edit_patients',
  DELETE_PATIENTS = 'delete_patients',
  VIEW_MEDICAL_RECORDS = 'view_medical_records',
  CREATE_MEDICAL_RECORDS = 'create_medical_records',
  EDIT_MEDICAL_RECORDS = 'edit_medical_records',
  DELETE_MEDICAL_RECORDS = 'delete_medical_records',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_LOGS = 'view_logs',
  MANAGE_SETTINGS = 'manage_settings',
  ACCESS_ADMIN_DASHBOARD = 'access_admin_dashboard',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_AI_INSIGHTS = 'view_ai_insights',
}

/**
 * Role to permissions mapping
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  admin: Object.values(Permission), // Admin has all permissions
  
  manager: [
    // Products
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    
    // Customers
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    
    // Orders
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.CANCEL_ORDERS,
    
    // Financial
    Permission.VIEW_FINANCIAL,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    
    // Inventory
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.MANAGE_PURCHASE_ORDERS,
    
    // Medical
    Permission.VIEW_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    
    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AI_INSIGHTS,
  ],
  
  sales: [
    // Products
    Permission.VIEW_PRODUCTS,
    
    // Customers
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    
    // Orders
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    
    // Financial
    Permission.VIEW_REPORTS,
    
    // Analytics
    Permission.VIEW_ANALYTICS,
  ],
  
  inventory: [
    // Products
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    
    // Inventory
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.MANAGE_PURCHASE_ORDERS,
    
    // Orders (view only for fulfillment)
    Permission.VIEW_ORDERS,
    
    // Reports
    Permission.VIEW_REPORTS,
  ],
  
  medical: [
    // Products (view only)
    Permission.VIEW_PRODUCTS,
    
    // Patients
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.EDIT_PATIENTS,
    
    // Medical Records
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.CREATE_MEDICAL_RECORDS,
    Permission.EDIT_MEDICAL_RECORDS,
    
    // Reports
    Permission.VIEW_REPORTS,
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has the specific permission
  return user.permissions.includes(permission.toString());
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has any of the permissions
  return permissions.some(permission => user.permissions.includes(permission.toString()));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has all permissions
  return permissions.every(permission => user.permissions.includes(permission.toString()));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Decorator function to require permission for a method
 * Usage: @requirePermission(Permission.VIEW_PRODUCTS)
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // This would need to get the current user from context
      // For now, this is a placeholder implementation
      const hasAccess = true; // Replace with actual permission check
      
      if (!hasAccess) {
        throw new Error(`Permission denied: ${permission} required`);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false;
  
  // Admin can access all routes
  if (user.role === 'admin') return true;
  
  // Define route to permission mapping
  const routePermissions: Record<string, Permission> = {
    '/products': Permission.VIEW_PRODUCTS,
    '/customers': Permission.VIEW_CUSTOMERS,
    '/orders': Permission.VIEW_ORDERS,
    '/inventory': Permission.VIEW_INVENTORY,
    '/patients': Permission.VIEW_PATIENTS,
    '/medical-records': Permission.VIEW_MEDICAL_RECORDS,
    '/analytics': Permission.VIEW_ANALYTICS,
    '/reports': Permission.VIEW_REPORTS,
    '/admin': Permission.ACCESS_ADMIN_DASHBOARD,
    '/settings': Permission.MANAGE_SETTINGS,
  };
  
  // Find matching route
  const matchingRoute = Object.keys(routePermissions).find(r => route.startsWith(r));
  
  if (!matchingRoute) return true; // Allow access to routes without specific permissions
  
  const requiredPermission = routePermissions[matchingRoute];
  return hasPermission(user, requiredPermission);
}

/**
 * Get user-friendly permission name
 */
export function getPermissionName(permission: Permission): string {
  const names: Record<Permission, string> = {
    [Permission.VIEW_PRODUCTS]: 'View Products',
    [Permission.CREATE_PRODUCTS]: 'Create Products',
    [Permission.EDIT_PRODUCTS]: 'Edit Products',
    [Permission.DELETE_PRODUCTS]: 'Delete Products',
    [Permission.VIEW_CUSTOMERS]: 'View Customers',
    [Permission.CREATE_CUSTOMERS]: 'Create Customers',
    [Permission.EDIT_CUSTOMERS]: 'Edit Customers',
    [Permission.DELETE_CUSTOMERS]: 'Delete Customers',
    [Permission.VIEW_ORDERS]: 'View Orders',
    [Permission.CREATE_ORDERS]: 'Create Orders',
    [Permission.EDIT_ORDERS]: 'Edit Orders',
    [Permission.CANCEL_ORDERS]: 'Cancel Orders',
    [Permission.DELETE_ORDERS]: 'Delete Orders',
    [Permission.VIEW_FINANCIAL]: 'View Financial Data',
    [Permission.MANAGE_PAYMENTS]: 'Manage Payments',
    [Permission.VIEW_REPORTS]: 'View Reports',
    [Permission.EXPORT_REPORTS]: 'Export Reports',
    [Permission.VIEW_INVENTORY]: 'View Inventory',
    [Permission.ADJUST_INVENTORY]: 'Adjust Inventory',
    [Permission.MANAGE_PURCHASE_ORDERS]: 'Manage Purchase Orders',
    [Permission.VIEW_PATIENTS]: 'View Patients',
    [Permission.CREATE_PATIENTS]: 'Create Patients',
    [Permission.EDIT_PATIENTS]: 'Edit Patients',
    [Permission.DELETE_PATIENTS]: 'Delete Patients',
    [Permission.VIEW_MEDICAL_RECORDS]: 'View Medical Records',
    [Permission.CREATE_MEDICAL_RECORDS]: 'Create Medical Records',
    [Permission.EDIT_MEDICAL_RECORDS]: 'Edit Medical Records',
    [Permission.DELETE_MEDICAL_RECORDS]: 'Delete Medical Records',
    [Permission.MANAGE_USERS]: 'Manage Users',
    [Permission.VIEW_LOGS]: 'View System Logs',
    [Permission.MANAGE_SETTINGS]: 'Manage Settings',
    [Permission.ACCESS_ADMIN_DASHBOARD]: 'Access Admin Dashboard',
    [Permission.VIEW_ANALYTICS]: 'View Analytics',
    [Permission.VIEW_AI_INSIGHTS]: 'View AI Insights',
  };
  
  return names[permission] || permission.toString();
}
