import { Permission } from './rbac';
import { getCurrentUserId } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { logPermissionCheck } from '@/lib/security/audit';

/**
 * Service method permission requirements
 */
export const ServicePermissions: Record<string, Record<string, Permission>> = {
  products: {
    getProducts: Permission.VIEW_PRODUCTS,
    getProductById: Permission.VIEW_PRODUCTS,
    createProduct: Permission.CREATE_PRODUCTS,
    updateProduct: Permission.EDIT_PRODUCTS,
    deleteProduct: Permission.DELETE_PRODUCTS,
  },
  customers: {
    getCustomers: Permission.VIEW_CUSTOMERS,
    getCustomerById: Permission.VIEW_CUSTOMERS,
    createCustomer: Permission.CREATE_CUSTOMERS,
    updateCustomer: Permission.EDIT_CUSTOMERS,
    deleteCustomer: Permission.DELETE_CUSTOMERS,
  },
  orders: {
    getOrders: Permission.VIEW_ORDERS,
    getOrderById: Permission.VIEW_ORDERS,
    createOrder: Permission.CREATE_ORDERS,
    updateOrder: Permission.EDIT_ORDERS,
    cancelOrder: Permission.CANCEL_ORDERS,
    deleteOrder: Permission.DELETE_ORDERS,
  },
  inventory: {
    getInventory: Permission.VIEW_INVENTORY,
    adjustStock: Permission.ADJUST_INVENTORY,
    createPurchaseOrder: Permission.MANAGE_PURCHASE_ORDERS,
  },
  patients: {
    getPatients: Permission.VIEW_PATIENTS,
    getPatientById: Permission.VIEW_PATIENTS,
    createPatient: Permission.CREATE_PATIENTS,
    updatePatient: Permission.EDIT_PATIENTS,
    deletePatient: Permission.DELETE_PATIENTS,
  },
  medicalRecords: {
    getMedicalRecords: Permission.VIEW_MEDICAL_RECORDS,
    getMedicalRecordById: Permission.VIEW_MEDICAL_RECORDS,
    createMedicalRecord: Permission.CREATE_MEDICAL_RECORDS,
    updateMedicalRecord: Permission.EDIT_MEDICAL_RECORDS,
    deleteMedicalRecord: Permission.DELETE_MEDICAL_RECORDS,
  },
  financial: {
    viewFinancial: Permission.VIEW_FINANCIAL,
    managePayments: Permission.MANAGE_PAYMENTS,
  },
  reports: {
    viewReports: Permission.VIEW_REPORTS,
    exportReports: Permission.EXPORT_REPORTS,
  },
  analytics: {
    viewAnalytics: Permission.VIEW_ANALYTICS,
    viewAIInsights: Permission.VIEW_AI_INSIGHTS,
  },
  admin: {
    manageUsers: Permission.MANAGE_USERS,
    viewLogs: Permission.VIEW_LOGS,
    manageSettings: Permission.MANAGE_SETTINGS,
    accessAdminDashboard: Permission.ACCESS_ADMIN_DASHBOARD,
  },
};

/**
 * Check if current user has permission for a service method
 */
export async function checkServicePermission(
  service: string,
  method: string
): Promise<boolean> {
  const userId = getCurrentUserId();
  
  // Get user from database
  const user = await db.users.get(userId);
  
  if (!user) {
    await logPermissionCheck(userId, `${service}.${method}`, false);
    return false;
  }

  // Admin has all permissions
  if (user.role === 'admin') {
    await logPermissionCheck(userId, `${service}.${method}`, true);
    return true;
  }

  // Get required permission for this service method
  const requiredPermission = ServicePermissions[service]?.[method];
  
  if (!requiredPermission) {
    // If no permission is defined, allow access
    return true;
  }

  // Check if user has the required permission
  const hasPermission = user.permissions.includes(requiredPermission);
  
  await logPermissionCheck(userId, `${service}.${method}`, hasPermission);
  
  return hasPermission;
}

/**
 * Decorator to require permission for service methods
 * Usage: @requirePermission('products', 'createProduct')
 */
export function requirePermission(service: string, method: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const hasAccess = await checkServicePermission(service, method);

      if (!hasAccess) {
        const permission = ServicePermissions[service]?.[method];
        throw new Error(
          `Permission denied: ${permission || 'Unknown permission'} required for ${service}.${method}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Wrapper function to check permission before executing a function
 */
export async function withPermissionCheck<T>(
  service: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  const hasAccess = await checkServicePermission(service, method);

  if (!hasAccess) {
    const permission = ServicePermissions[service]?.[method];
    throw new Error(
      `Permission denied: ${permission || 'Unknown permission'} required for ${service}.${method}`
    );
  }

  return fn();
}
