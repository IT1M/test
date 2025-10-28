"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Check, X } from "lucide-react";

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RolePermissionsModal({ isOpen, onClose }: RolePermissionsModalProps) {
  const permissions = [
    {
      category: "Inventory Management",
      permissions: [
        { name: "Create inventory items", roles: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN"] },
        { name: "View inventory items", roles: ["DATA_ENTRY", "SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"] },
        { name: "Edit inventory items", roles: ["SUPERVISOR", "MANAGER", "ADMIN"] },
        { name: "Delete inventory items", roles: ["SUPERVISOR", "MANAGER", "ADMIN"] },
        { name: "Export inventory data", roles: ["SUPERVISOR", "MANAGER", "ADMIN", "AUDITOR"] },
      ],
    },
    {
      category: "Analytics & Reports",
      permissions: [
        { name: "View analytics dashboard", roles: ["MANAGER", "ADMIN"] },
        { name: "Generate reports", roles: ["MANAGER", "ADMIN"] },
        { name: "View AI insights", roles: ["MANAGER", "ADMIN"] },
        { name: "Download reports", roles: ["MANAGER", "ADMIN"] },
      ],
    },
    {
      category: "Audit & Compliance",
      permissions: [
        { name: "View audit logs", roles: ["AUDITOR", "ADMIN"] },
        { name: "Export audit logs", roles: ["AUDITOR", "ADMIN"] },
      ],
    },
    {
      category: "User Management",
      permissions: [
        { name: "View users", roles: ["ADMIN"] },
        { name: "Create users", roles: ["ADMIN"] },
        { name: "Edit users", roles: ["ADMIN"] },
        { name: "Activate/Deactivate users", roles: ["ADMIN"] },
      ],
    },
    {
      category: "System Settings",
      permissions: [
        { name: "View settings", roles: ["ADMIN", "MANAGER"] },
        { name: "Modify settings", roles: ["ADMIN"] },
        { name: "Manage backups", roles: ["ADMIN"] },
        { name: "Create backups", roles: ["ADMIN"] },
        { name: "Restore backups", roles: ["ADMIN"] },
      ],
    },
  ];

  const roles = ["DATA_ENTRY", "SUPERVISOR", "AUDITOR", "MANAGER", "ADMIN"];

  const getRoleBadgeVariant = (role: string): "default" | "primary" | "success" | "warning" | "danger" | "secondary" => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "MANAGER":
        return "primary";
      case "SUPERVISOR":
        return "warning";
      case "AUDITOR":
        return "primary";
      default:
        return "secondary";
    }
  };

  const hasPermission = (permissionRoles: string[], role: string) => {
    return permissionRoles.includes(role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Role Permissions Matrix" size="xl">
      <div className="space-y-6">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          This matrix shows which permissions are granted to each role in the system.
        </p>

        {permissions.map((category) => (
          <div key={category.category} className="space-y-3">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {category.category}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-secondary-200 dark:border-secondary-700 rounded-lg">
                <thead className="bg-secondary-50 dark:bg-secondary-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider border-r border-secondary-200 dark:border-secondary-700">
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role}
                        className="px-4 py-3 text-center text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider"
                      >
                        <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
                          {role.replace("_", " ")}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {category.permissions.map((permission, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-secondary-900 dark:text-secondary-100 border-r border-secondary-200 dark:border-secondary-700">
                        {permission.name}
                      </td>
                      {roles.map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          {hasPermission(permission.roles, role) ? (
                            <Check className="h-5 w-5 text-success-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-secondary-300 dark:text-secondary-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
            Role Hierarchy
          </h4>
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>DATA_ENTRY:</strong> Basic data entry and viewing permissions
            <br />
            <strong>SUPERVISOR:</strong> Can edit and delete inventory items
            <br />
            <strong>AUDITOR:</strong> Can view and export audit logs
            <br />
            <strong>MANAGER:</strong> Access to analytics, reports, and AI insights
            <br />
            <strong>ADMIN:</strong> Full system access including user and settings management
          </p>
        </div>
      </div>
    </Modal>
  );
}
