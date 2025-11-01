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
  
  // Quality Control permissions
  VIEW_REJECTIONS = 'view_rejections',
  CREATE_REJECTIONS = 'create_rejections',
  EDIT_REJECTIONS = 'edit_rejections',
  DELETE_REJECTIONS = 'delete_rejections',
  VIEW_QUALITY_INSPECTIONS = 'view_quality_inspections',
  CREATE_QUALITY_INSPECTIONS = 'create_quality_inspections',
  EDIT_QUALITY_INSPECTIONS = 'edit_quality_inspections',
  APPROVE_QUALITY_INSPECTIONS = 'approve_quality_inspections',
  VIEW_QUALITY_ANALYTICS = 'view_quality_analytics',
  MANAGE_CORRECTIVE_ACTIONS = 'manage_corrective_actions',
  
  // HR Management permissions
  VIEW_EMPLOYEES = 'view_employees',
  CREATE_EMPLOYEES = 'create_employees',
  EDIT_EMPLOYEES = 'edit_employees',
  ARCHIVE_EMPLOYEES = 'archive_employees',
  VIEW_DEPARTMENTS = 'view_departments',
  MANAGE_DEPARTMENTS = 'manage_departments',
  VIEW_ATTENDANCE = 'view_attendance',
  RECORD_ATTENDANCE = 'record_attendance',
  VIEW_LEAVES = 'view_leaves',
  APPROVE_LEAVES = 'approve_leaves',
  VIEW_PAYROLL = 'view_payroll',
  PROCESS_PAYROLL = 'process_payroll',
  VIEW_PERFORMANCE_REVIEWS = 'view_performance_reviews',
  CREATE_PERFORMANCE_REVIEWS = 'create_performance_reviews',
  VIEW_TRAINING = 'view_training',
  MANAGE_TRAINING = 'manage_training',
  
  // Recruitment permissions
  VIEW_JOB_POSTINGS = 'view_job_postings',
  CREATE_JOB_POSTINGS = 'create_job_postings',
  EDIT_JOB_POSTINGS = 'edit_job_postings',
  VIEW_APPLICANTS = 'view_applicants',
  MANAGE_APPLICANTS = 'manage_applicants',
  SCHEDULE_INTERVIEWS = 'schedule_interviews',
  CONDUCT_INTERVIEWS = 'conduct_interviews',
  VIEW_RECRUITMENT_ANALYTICS = 'view_recruitment_analytics',
  
  // Supply Chain permissions
  VIEW_SUPPLIERS = 'view_suppliers',
  CREATE_SUPPLIERS = 'create_suppliers',
  EDIT_SUPPLIERS = 'edit_suppliers',
  DELETE_SUPPLIERS = 'delete_suppliers',
  VIEW_SUPPLIER_EVALUATIONS = 'view_supplier_evaluations',
  CREATE_SUPPLIER_EVALUATIONS = 'create_supplier_evaluations',
  VIEW_SUPPLIER_CONTRACTS = 'view_supplier_contracts',
  MANAGE_SUPPLIER_CONTRACTS = 'manage_supplier_contracts',
  VIEW_SUPPLY_CHAIN_ANALYTICS = 'view_supply_chain_analytics',
  
  // Executive permissions
  VIEW_EXECUTIVE_DASHBOARD = 'view_executive_dashboard',
  VIEW_EXECUTIVE_REPORTS = 'view_executive_reports',
  VIEW_PREDICTIVE_ANALYTICS = 'view_predictive_analytics',
  VIEW_CROSS_MODULE_ANALYTICS = 'view_cross_module_analytics',
  
  // AI Control Center permissions
  ACCESS_AI_CONTROL_CENTER = 'access_ai_control_center',
  VIEW_AI_ACTIVITY_LOGS = 'view_ai_activity_logs',
  EXPORT_AI_LOGS = 'export_ai_logs',
  MANAGE_AI_SETTINGS = 'manage_ai_settings',
  MANAGE_AI_MODELS = 'manage_ai_models',
  MANAGE_AI_AUTOMATION = 'manage_ai_automation',
  VIEW_AI_DIAGNOSTICS = 'view_ai_diagnostics',
  MANAGE_AI_SECURITY = 'manage_ai_security',
  VIEW_AI_COST_ANALYTICS = 'view_ai_cost_analytics',
  MANAGE_AI_BUDGETS = 'manage_ai_budgets',
  VIEW_AI_ALERTS = 'view_ai_alerts',
  MANAGE_AI_ALERTS = 'manage_ai_alerts',
  ROLLBACK_AI_CONFIG = 'rollback_ai_config',
  
  // AI Control Center Security & Compliance
  VIEW_SECURITY_AUDIT_LOGS = 'view_security_audit_logs',
  EXPORT_SECURITY_AUDIT_LOGS = 'export_security_audit_logs',
  MANAGE_API_KEYS = 'manage_api_keys',
  VIEW_COMPLIANCE_REPORTS = 'view_compliance_reports',
  MANAGE_DATA_LINEAGE = 'manage_data_lineage',
  CONFIGURE_PHI_SANITIZATION = 'configure_phi_sanitization',
}

/**
 * AI Control Center specific roles
 */
export type AIControlRole = 'AI_ADMIN' | 'AI_OPERATOR' | 'AI_AUDITOR';

/**
 * AI Control Center role permissions
 */
export const AIControlRolePermissions: Record<AIControlRole, Permission[]> = {
  AI_ADMIN: [
    Permission.ACCESS_AI_CONTROL_CENTER,
    Permission.VIEW_AI_ACTIVITY_LOGS,
    Permission.EXPORT_AI_LOGS,
    Permission.MANAGE_AI_SETTINGS,
    Permission.MANAGE_AI_MODELS,
    Permission.MANAGE_AI_AUTOMATION,
    Permission.VIEW_AI_DIAGNOSTICS,
    Permission.MANAGE_AI_SECURITY,
    Permission.VIEW_AI_COST_ANALYTICS,
    Permission.MANAGE_AI_BUDGETS,
    Permission.VIEW_AI_ALERTS,
    Permission.MANAGE_AI_ALERTS,
    Permission.ROLLBACK_AI_CONFIG,
    Permission.VIEW_SECURITY_AUDIT_LOGS,
    Permission.EXPORT_SECURITY_AUDIT_LOGS,
    Permission.MANAGE_API_KEYS,
    Permission.VIEW_COMPLIANCE_REPORTS,
    Permission.MANAGE_DATA_LINEAGE,
    Permission.CONFIGURE_PHI_SANITIZATION,
  ],
  AI_OPERATOR: [
    Permission.ACCESS_AI_CONTROL_CENTER,
    Permission.VIEW_AI_ACTIVITY_LOGS,
    Permission.VIEW_AI_DIAGNOSTICS,
    Permission.VIEW_AI_COST_ANALYTICS,
    Permission.VIEW_AI_ALERTS,
    Permission.VIEW_SECURITY_AUDIT_LOGS,
    Permission.VIEW_COMPLIANCE_REPORTS,
  ],
  AI_AUDITOR: [
    Permission.ACCESS_AI_CONTROL_CENTER,
    Permission.VIEW_AI_ACTIVITY_LOGS,
    Permission.EXPORT_AI_LOGS,
    Permission.VIEW_AI_DIAGNOSTICS,
    Permission.VIEW_AI_COST_ANALYTICS,
    Permission.VIEW_AI_ALERTS,
    Permission.VIEW_SECURITY_AUDIT_LOGS,
    Permission.EXPORT_SECURITY_AUDIT_LOGS,
    Permission.VIEW_COMPLIANCE_REPORTS,
  ],
};

/**
 * Check if user has AI Control Center role
 */
export function hasAIControlRole(user: User | null, role: AIControlRole): boolean {
  if (!user) return false;
  
  // Admin has all AI Control roles
  if (user.role === 'admin') return true;
  
  // Check if user has the required AI Control permissions
  const requiredPermissions = AIControlRolePermissions[role];
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission.toString())
  );
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
    
    // AI Control Center - Manager access
    Permission.ACCESS_AI_CONTROL_CENTER,
    Permission.VIEW_AI_ACTIVITY_LOGS,
    Permission.VIEW_AI_DIAGNOSTICS,
    Permission.VIEW_AI_ALERTS,
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
  
  quality: [
    // Products
    Permission.VIEW_PRODUCTS,
    
    // Quality Control
    Permission.VIEW_REJECTIONS,
    Permission.CREATE_REJECTIONS,
    Permission.EDIT_REJECTIONS,
    Permission.VIEW_QUALITY_INSPECTIONS,
    Permission.CREATE_QUALITY_INSPECTIONS,
    Permission.EDIT_QUALITY_INSPECTIONS,
    Permission.APPROVE_QUALITY_INSPECTIONS,
    Permission.VIEW_QUALITY_ANALYTICS,
    Permission.MANAGE_CORRECTIVE_ACTIONS,
    
    // Inventory (view only)
    Permission.VIEW_INVENTORY,
    
    // Suppliers (view only)
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_SUPPLIER_EVALUATIONS,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
  ],
  
  hr: [
    // HR Management
    Permission.VIEW_EMPLOYEES,
    Permission.CREATE_EMPLOYEES,
    Permission.EDIT_EMPLOYEES,
    Permission.ARCHIVE_EMPLOYEES,
    Permission.VIEW_DEPARTMENTS,
    Permission.MANAGE_DEPARTMENTS,
    Permission.VIEW_ATTENDANCE,
    Permission.RECORD_ATTENDANCE,
    Permission.VIEW_LEAVES,
    Permission.APPROVE_LEAVES,
    Permission.VIEW_PAYROLL,
    Permission.PROCESS_PAYROLL,
    Permission.VIEW_PERFORMANCE_REVIEWS,
    Permission.CREATE_PERFORMANCE_REVIEWS,
    Permission.VIEW_TRAINING,
    Permission.MANAGE_TRAINING,
    
    // Recruitment
    Permission.VIEW_JOB_POSTINGS,
    Permission.CREATE_JOB_POSTINGS,
    Permission.EDIT_JOB_POSTINGS,
    Permission.VIEW_APPLICANTS,
    Permission.MANAGE_APPLICANTS,
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    Permission.VIEW_RECRUITMENT_ANALYTICS,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
  ],
  
  executive: [
    // Executive Dashboard
    Permission.VIEW_EXECUTIVE_DASHBOARD,
    Permission.VIEW_EXECUTIVE_REPORTS,
    Permission.VIEW_PREDICTIVE_ANALYTICS,
    Permission.VIEW_CROSS_MODULE_ANALYTICS,
    
    // All view permissions
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_REJECTIONS,
    Permission.VIEW_QUALITY_INSPECTIONS,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_JOB_POSTINGS,
    Permission.VIEW_APPLICANTS,
    
    // Financial
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    
    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AI_INSIGHTS,
    Permission.VIEW_QUALITY_ANALYTICS,
    Permission.VIEW_RECRUITMENT_ANALYTICS,
    Permission.VIEW_SUPPLY_CHAIN_ANALYTICS,
    
    // AI Control Center - Executive access
    Permission.ACCESS_AI_CONTROL_CENTER,
    Permission.VIEW_AI_ACTIVITY_LOGS,
    Permission.VIEW_AI_DIAGNOSTICS,
    Permission.VIEW_AI_COST_ANALYTICS,
    Permission.VIEW_AI_ALERTS,
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
    '/executive': Permission.VIEW_EXECUTIVE_DASHBOARD,
    '/executive/reports': Permission.VIEW_EXECUTIVE_REPORTS,
    '/quality': Permission.VIEW_REJECTIONS,
    '/quality/rejections': Permission.VIEW_REJECTIONS,
    '/quality/inspections': Permission.VIEW_QUALITY_INSPECTIONS,
    '/quality/analytics': Permission.VIEW_QUALITY_ANALYTICS,
    '/hr': Permission.VIEW_EMPLOYEES,
    '/hr/employees': Permission.VIEW_EMPLOYEES,
    '/hr/departments': Permission.VIEW_DEPARTMENTS,
    '/hr/attendance': Permission.VIEW_ATTENDANCE,
    '/hr/leaves': Permission.VIEW_LEAVES,
    '/hr/payroll': Permission.VIEW_PAYROLL,
    '/hr/performance': Permission.VIEW_PERFORMANCE_REVIEWS,
    '/hr/training': Permission.VIEW_TRAINING,
    '/hr/recruitment': Permission.VIEW_JOB_POSTINGS,
    '/supply-chain': Permission.VIEW_SUPPLIERS,
    '/supply-chain/suppliers': Permission.VIEW_SUPPLIERS,
    '/supply-chain/analytics': Permission.VIEW_SUPPLY_CHAIN_ANALYTICS,
    '/admin': Permission.ACCESS_ADMIN_DASHBOARD,
    '/settings': Permission.MANAGE_SETTINGS,
    '/ai-control-center': Permission.ACCESS_AI_CONTROL_CENTER,
    '/ai-control-center/audit-logs': Permission.VIEW_AI_ACTIVITY_LOGS,
    '/ai-control-center/settings': Permission.MANAGE_AI_SETTINGS,
    '/ai-control-center/diagnostics': Permission.VIEW_AI_DIAGNOSTICS,
    '/ai-control-center/cost-analytics': Permission.VIEW_AI_COST_ANALYTICS,
    '/ai-control-center/integrations': Permission.MANAGE_AI_MODELS,
    '/ai-control-center/reports': Permission.VIEW_AI_ACTIVITY_LOGS,
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
    
    // Quality Control
    [Permission.VIEW_REJECTIONS]: 'View Rejections',
    [Permission.CREATE_REJECTIONS]: 'Create Rejections',
    [Permission.EDIT_REJECTIONS]: 'Edit Rejections',
    [Permission.DELETE_REJECTIONS]: 'Delete Rejections',
    [Permission.VIEW_QUALITY_INSPECTIONS]: 'View Quality Inspections',
    [Permission.CREATE_QUALITY_INSPECTIONS]: 'Create Quality Inspections',
    [Permission.EDIT_QUALITY_INSPECTIONS]: 'Edit Quality Inspections',
    [Permission.APPROVE_QUALITY_INSPECTIONS]: 'Approve Quality Inspections',
    [Permission.VIEW_QUALITY_ANALYTICS]: 'View Quality Analytics',
    [Permission.MANAGE_CORRECTIVE_ACTIONS]: 'Manage Corrective Actions',
    
    // HR Management
    [Permission.VIEW_EMPLOYEES]: 'View Employees',
    [Permission.CREATE_EMPLOYEES]: 'Create Employees',
    [Permission.EDIT_EMPLOYEES]: 'Edit Employees',
    [Permission.ARCHIVE_EMPLOYEES]: 'Archive Employees',
    [Permission.VIEW_DEPARTMENTS]: 'View Departments',
    [Permission.MANAGE_DEPARTMENTS]: 'Manage Departments',
    [Permission.VIEW_ATTENDANCE]: 'View Attendance',
    [Permission.RECORD_ATTENDANCE]: 'Record Attendance',
    [Permission.VIEW_LEAVES]: 'View Leaves',
    [Permission.APPROVE_LEAVES]: 'Approve Leaves',
    [Permission.VIEW_PAYROLL]: 'View Payroll',
    [Permission.PROCESS_PAYROLL]: 'Process Payroll',
    [Permission.VIEW_PERFORMANCE_REVIEWS]: 'View Performance Reviews',
    [Permission.CREATE_PERFORMANCE_REVIEWS]: 'Create Performance Reviews',
    [Permission.VIEW_TRAINING]: 'View Training',
    [Permission.MANAGE_TRAINING]: 'Manage Training',
    
    // Recruitment
    [Permission.VIEW_JOB_POSTINGS]: 'View Job Postings',
    [Permission.CREATE_JOB_POSTINGS]: 'Create Job Postings',
    [Permission.EDIT_JOB_POSTINGS]: 'Edit Job Postings',
    [Permission.VIEW_APPLICANTS]: 'View Applicants',
    [Permission.MANAGE_APPLICANTS]: 'Manage Applicants',
    [Permission.SCHEDULE_INTERVIEWS]: 'Schedule Interviews',
    [Permission.CONDUCT_INTERVIEWS]: 'Conduct Interviews',
    [Permission.VIEW_RECRUITMENT_ANALYTICS]: 'View Recruitment Analytics',
    
    // Supply Chain
    [Permission.VIEW_SUPPLIERS]: 'View Suppliers',
    [Permission.CREATE_SUPPLIERS]: 'Create Suppliers',
    [Permission.EDIT_SUPPLIERS]: 'Edit Suppliers',
    [Permission.DELETE_SUPPLIERS]: 'Delete Suppliers',
    [Permission.VIEW_SUPPLIER_EVALUATIONS]: 'View Supplier Evaluations',
    [Permission.CREATE_SUPPLIER_EVALUATIONS]: 'Create Supplier Evaluations',
    [Permission.VIEW_SUPPLIER_CONTRACTS]: 'View Supplier Contracts',
    [Permission.MANAGE_SUPPLIER_CONTRACTS]: 'Manage Supplier Contracts',
    [Permission.VIEW_SUPPLY_CHAIN_ANALYTICS]: 'View Supply Chain Analytics',
    
    // Executive
    [Permission.VIEW_EXECUTIVE_DASHBOARD]: 'View Executive Dashboard',
    [Permission.VIEW_EXECUTIVE_REPORTS]: 'View Executive Reports',
    [Permission.VIEW_PREDICTIVE_ANALYTICS]: 'View Predictive Analytics',
    [Permission.VIEW_CROSS_MODULE_ANALYTICS]: 'View Cross-Module Analytics',
    
    // AI Control Center
    [Permission.ACCESS_AI_CONTROL_CENTER]: 'Access AI Control Center',
    [Permission.VIEW_AI_ACTIVITY_LOGS]: 'View AI Activity Logs',
    [Permission.EXPORT_AI_LOGS]: 'Export AI Logs',
    [Permission.MANAGE_AI_SETTINGS]: 'Manage AI Settings',
    [Permission.MANAGE_AI_MODELS]: 'Manage AI Models',
    [Permission.MANAGE_AI_AUTOMATION]: 'Manage AI Automation',
    [Permission.VIEW_AI_DIAGNOSTICS]: 'View AI Diagnostics',
    [Permission.MANAGE_AI_SECURITY]: 'Manage AI Security',
    [Permission.VIEW_AI_COST_ANALYTICS]: 'View AI Cost Analytics',
    [Permission.MANAGE_AI_BUDGETS]: 'Manage AI Budgets',
    [Permission.VIEW_AI_ALERTS]: 'View AI Alerts',
    [Permission.MANAGE_AI_ALERTS]: 'Manage AI Alerts',
    [Permission.ROLLBACK_AI_CONFIG]: 'Rollback AI Configuration',
  };
  
  return names[permission] || permission.toString();
}
