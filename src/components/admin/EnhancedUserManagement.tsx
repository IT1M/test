"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { 
  UserPlus, 
  Search, 
  RefreshCw, 
  Download, 
  Upload, 
  Users, 
  Trash2, 
  CheckSquare, 
  Square,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { getRoleDefinition, canManageUser, getManageableRoles } from "@/utils/rbac";
import toast from "react-hot-toast";
import UserModal from "../../app/[locale]/settings/users/UserModal";
import UserDetailsModal from "./UserDetailsModal";
import RolePermissionsModal from "../../app/[locale]/settings/users/RolePermissionsModal";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled?: boolean;
  preferences?: any;
  _count?: {
    inventoryItems: number;
    auditLogs: number;
    sessions?: number;
    activities?: number;
  };
  lastActivity?: string;
  lastLogin?: string;
}

interface EnhancedUserManagementProps {
  currentUserRole: UserRole;
  currentUserId: string;
}

interface FilterState {
  search: string;
  role: string;
  status: string;
  activity: string;
  twoFactor: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function EnhancedUserManagement({ 
  currentUserRole, 
  currentUserId 
}: EnhancedUserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  
  // Enhanced filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "",
    status: "",
    activity: "",
    twoFactor: "",
    dateRange: {
      start: "",
      end: ""
    }
  });

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showRolePermissions, setShowRolePermissions] = useState(false);

  // Get manageable roles for current user
  const manageableRoles = useMemo(() => {
    return getManageableRoles(currentUserRole);
  }, [currentUserRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'dateRange') {
          if (value.start) params.append('startDate', value.start);
          if (value.end) params.append('endDate', value.end);
        } else if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/users/enhanced?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setTotal(data.meta.total);
      } else {
        toast.error(data.error?.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      status: "",
      activity: "",
      twoFactor: "",
      dateRange: { start: "", end: "" }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedUsers.size === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          operation: action,
          data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Bulk ${action} completed successfully`);
        setSelectedUsers(new Set());
        fetchUsers();
      } else {
        toast.error(result.error?.message || `Failed to perform bulk ${action}`);
      }
    } catch (error) {
      console.error(`Error in bulk ${action}:`, error);
      toast.error(`Failed to perform bulk ${action}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/users/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Users exported successfully');
      } else {
        toast.error('Failed to export users');
      }
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error('Failed to export users');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "danger";
      case "MANAGER": return "primary";
      case "SUPERVISOR": return "warning";
      case "AUDITOR": return "primary";
      default: return "secondary";
    }
  };

  const getActivityStatus = (user: User) => {
    if (!user.lastActivity) return { status: "never", color: "text-secondary-400", icon: XCircle };
    
    const lastActivity = new Date(user.lastActivity);
    const now = new Date();
    const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { status: "active", color: "text-success-600", icon: CheckCircle };
    if (diffHours < 24) return { status: "recent", color: "text-warning-600", icon: Clock };
    if (diffHours < 168) return { status: "inactive", color: "text-secondary-500", icon: Clock };
    return { status: "dormant", color: "text-danger-600", icon: AlertTriangle };
  };

  const canManageThisUser = (user: User) => {
    return canManageUser(currentUserRole, user.role) && user.id !== currentUserId;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Primary filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full lg:w-48"
            >
              <option value="">All Roles</option>
              {manageableRoles.map(role => (
                <option key={role} value={role}>
                  {role.replace('_', ' ')}
                </option>
              ))}
            </Select>

            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full lg:w-48"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>

            <Button
              variant="ghost"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full lg:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  value={filters.activity}
                  onChange={(e) => handleFilterChange('activity', e.target.value)}
                >
                  <option value="">All Activity</option>
                  <option value="active">Active (< 1 hour)</option>
                  <option value="recent">Recent (< 24 hours)</option>
                  <option value="inactive">Inactive (< 1 week)</option>
                  <option value="dormant">Dormant (> 1 week)</option>
                </Select>

                <Select
                  value={filters.twoFactor}
                  onChange={(e) => handleFilterChange('twoFactor', e.target.value)}
                >
                  <option value="">All 2FA Status</option>
                  <option value="true">2FA Enabled</option>
                  <option value="false">2FA Disabled</option>
                </Select>

                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                />

                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  {total} users found
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col md:flex-row gap-2 justify-between border-t border-secondary-200 dark:border-secondary-700 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => setShowUserModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>

              <Button
                variant="outline"
                onClick={handleExportUsers}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowRolePermissions(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Role Permissions
              </Button>

              <Button
                variant="ghost"
                onClick={fetchUsers}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  {selectedUsers.size} selected
                </span>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                >
                  Activate
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkActionLoading}
                >
                  Deactivate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400">
              No users found matching your criteria
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 dark:bg-secondary-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center space-x-2 hover:text-secondary-700 dark:hover:text-secondary-200"
                      >
                        {selectedUsers.size === users.length && users.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <span>User</span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {users.map((user) => {
                    const activityStatus = getActivityStatus(user);
                    const ActivityIcon = activityStatus.icon;
                    const canManage = canManageThisUser(user);

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors ${
                          selectedUsers.has(user.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleSelectUser(user.id)}
                              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                              disabled={!canManage}
                            >
                              {selectedUsers.has(user.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                                {user.name}
                              </div>
                              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.replace("_", " ")}
                            </Badge>
                            <div>
                              <Badge variant={user.isActive ? "success" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <ActivityIcon className={`h-4 w-4 ${activityStatus.color}`} />
                            <div className="text-sm">
                              <div className={activityStatus.color}>
                                {activityStatus.status}
                              </div>
                              {user.lastActivity && (
                                <div className="text-xs text-secondary-400">
                                  {formatDate(user.lastActivity)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Shield className={`h-4 w-4 ${user.twoFactorEnabled ? 'text-success-600' : 'text-secondary-400'}`} />
                            <span className="text-sm">
                              {user.twoFactorEnabled ? '2FA' : 'No 2FA'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          {user._count && (
                            <div className="space-y-1">
                              <div>{user._count.inventoryItems || 0} entries</div>
                              <div>{user._count.auditLogs || 0} actions</div>
                              {user._count.sessions !== undefined && (
                                <div>{user._count.sessions} sessions</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={user.isActive ? "danger" : "success"}
                                  size="sm"
                                  onClick={() => handleBulkAction(
                                    user.isActive ? 'deactivate' : 'activate'
                                  )}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / limit)}
                onPageChange={setPage}
                totalItems={total}
                itemsPerPage={limit}
                onItemsPerPageChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSaved={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          isOpen={showUserDetails}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Role Permissions Modal */}
      {showRolePermissions && (
        <RolePermissionsModal
          isOpen={showRolePermissions}
          onClose={() => setShowRolePermissions(false)}
        />
      )}
    </div>
  );
}