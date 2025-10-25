"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";
import { AuditAction, UserRole } from "@prisma/client";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function AuditLogTable({
  logs,
  onSort,
  sortBy,
  sortOrder,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useState(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadgeVariant = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "primary";
      case "DELETE":
        return "danger";
      case "LOGIN":
      case "LOGOUT":
        return "secondary";
      case "EXPORT":
      case "VIEW":
        return "default";
      default:
        return "default";
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "MANAGER":
        return "primary";
      case "SUPERVISOR":
        return "warning";
      case "AUDITOR":
        return "secondary";
      case "DATA_ENTRY":
        return "default";
      default:
        return "default";
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4 p-4">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-secondary-500 dark:text-secondary-400">
            No audit logs found
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-lg p-4 space-y-3 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-800 dark:text-primary-100">
                      {getUserInitials(log.user.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                      {log.user.name}
                    </h3>
                    <Badge variant={getRoleBadgeVariant(log.user.role)} size="sm">
                      {log.user.role}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => toggleRow(log.id)}
                  className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={expandedRows.has(log.id) ? "Collapse details" : "Expand details"}
                  aria-expanded={expandedRows.has(log.id)}
                >
                  {expandedRows.has(log.id) ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Action and Timestamp */}
              <div className="flex items-center justify-between">
                <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                  {log.action}
                </Badge>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  {formatDate(log.timestamp)}
                </span>
              </div>

              {/* Entity Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Entity Type</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    {log.entityType}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500 dark:text-secondary-400 block mb-1">Entity ID</span>
                  <span className="font-mono text-xs text-secondary-900 dark:text-secondary-100">
                    {log.entityId ? log.entityId.slice(0, 8) + "..." : "-"}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRows.has(log.id) && (
                <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 space-y-3">
                  {log.ipAddress && (
                    <div>
                      <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400 block mb-1">
                        IP Address
                      </span>
                      <span className="text-sm text-secondary-900 dark:text-secondary-100">
                        {log.ipAddress}
                      </span>
                    </div>
                  )}
                  {log.userAgent && (
                    <div>
                      <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400 block mb-1">
                        User Agent
                      </span>
                      <p className="text-xs text-secondary-700 dark:text-secondary-300 break-words">
                        {log.userAgent}
                      </p>
                    </div>
                  )}
                  {(log.oldValue || log.newValue) && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400 block">
                        Changes
                      </span>
                      {log.oldValue && (
                        <div>
                          <div className="text-xs font-medium text-danger-600 dark:text-danger-400 mb-1">
                            Old Value
                          </div>
                          <pre className="text-xs bg-secondary-50 dark:bg-secondary-950 border border-secondary-200 dark:border-secondary-800 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <div className="text-xs font-medium text-success-600 dark:text-success-400 mb-1">
                            New Value
                          </div>
                          <pre className="text-xs bg-secondary-50 dark:bg-secondary-950 border border-secondary-200 dark:border-secondary-800 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
        <thead className="bg-secondary-50 dark:bg-secondary-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left w-12"></th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => onSort("timestamp")}
            >
              <div className="flex items-center gap-2">
                Timestamp
                <SortIcon field="timestamp" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Action
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Entity Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              Entity ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-950 divide-y divide-secondary-200 dark:divide-secondary-800">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                No audit logs found
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <>
                <tr
                  key={log.id}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-900 cursor-pointer"
                  onClick={() => toggleRow(log.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                      aria-label={expandedRows.has(log.id) ? "Collapse" : "Expand"}
                    >
                      {expandedRows.has(log.id) ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-800 dark:text-primary-100">
                          {getUserInitials(log.user.name)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {log.user.name}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">
                          <Badge variant={getRoleBadgeVariant(log.user.role)} size="sm">
                            {log.user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300 font-mono text-xs">
                    {log.entityId ? log.entityId.slice(0, 8) + "..." : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                    {log.ipAddress || "-"}
                  </td>
                </tr>
                {expandedRows.has(log.id) && (
                  <tr key={`${log.id}-details`} className="bg-secondary-50 dark:bg-secondary-900">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="space-y-4">
                        {/* User Agent */}
                        {log.userAgent && (
                          <div>
                            <h4 className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-1">
                              User Agent
                            </h4>
                            <p className="text-sm text-secondary-700 dark:text-secondary-300 font-mono">
                              {log.userAgent}
                            </p>
                          </div>
                        )}

                        {/* Changes */}
                        {(log.oldValue || log.newValue) && (
                          <div>
                            <h4 className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-2">
                              Changes
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.oldValue && (
                                <div>
                                  <div className="text-xs font-medium text-danger-600 dark:text-danger-400 mb-1">
                                    Old Value
                                  </div>
                                  <pre className="text-xs bg-white dark:bg-secondary-950 border border-secondary-200 dark:border-secondary-800 rounded p-3 overflow-x-auto">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue && (
                                <div>
                                  <div className="text-xs font-medium text-success-600 dark:text-success-400 mb-1">
                                    New Value
                                  </div>
                                  <pre className="text-xs bg-white dark:bg-secondary-950 border border-secondary-200 dark:border-secondary-800 rounded p-3 overflow-x-auto">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
