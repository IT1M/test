'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth/rbac';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * PermissionGuard component
 * Conditionally renders children based on user permissions
 */
export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback,
  showMessage = true,
}: PermissionGuardProps) {
  const { getCurrentUser } = useAuthStore();
  const user = getCurrentUser();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (anyPermissions) {
    hasAccess = hasAnyPermission(user, anyPermissions);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(user, allPermissions);
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions
 */
export function usePermission() {
  const { getCurrentUser } = useAuthStore();
  const user = getCurrentUser();

  return {
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    user,
  };
}
