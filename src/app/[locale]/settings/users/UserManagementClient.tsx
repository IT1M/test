"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { UserPlus, Search, RefreshCw, Download, Upload, Users, Trash2, CheckSquare, Square } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import toast from "react-hot-toast";
import UserModal from "./UserModal";
import RolePermissionsModal from "./RolePermissionsModal";
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";
import UserDetailsModal from "@/components/admin/UserDetailsModal";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    inventoryItems: number;
    auditLogs: number;
  };
}

interface UserManagementClientProps {
  userRole: UserRole;
}

export default function UserManagementClient({ userRole }: UserManagementClientProps) {
  const [useEnhancedView, setUseEnhancedView] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("isActive", statusFilter);

      const response = await fetch(`/api/users?${params}`);
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
  }, [page, search, roleFilter, statusFilter]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `User ${data.data.isActive ? "activated" : "deactivated"} successfully`
        );
        fetchUsers();
      } else {
        toast.error(data.error?.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleUserSaved = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "primary" | "success" | "warning" | "danger" | "secondary" => {
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

  // Bulk operations
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

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedUsers.size === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: activate }),
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.ok).length;
      
      if (successful === selectedUsers.size) {
        toast.success(`${successful} users ${activate ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.warning(`${successful}/${selectedUsers.size} users ${activate ? 'activated' : 'deactivated'}`);
      }

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error("Error in bulk operation:", error);
      toast.error("Failed to perform bulk operation");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRoleChange = async (newRole: UserRole) => {
    if (selectedUsers.size === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.ok).length;
      
      if (successful === selectedUsers.size) {
        toast.success(`${successful} users updated to ${newRole} role successfully`);
      } else {
        toast.warning(`${successful}/${selectedUsers.size} users updated`);
      }

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error("Error in bulk role change:", error);
      toast.error("Failed to update user roles");
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

  // Get current user ID from session (we'll need to pass this)
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        if (data.success) {
          setCurrentUserId(data.data.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Use enhanced view by default for ADMIN and MANAGER roles
  useEffect(() => {
    setUseEnhancedView(userRole === 'ADMIN' || userRole === 'MANAGER');
  }, [userRole]);

  if (useEnhancedView && currentUserId) {
    return (
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Enhanced User Management
            </h2>
            <Badge variant="primary">Advanced</Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => setUseEnhancedView(false)}
            className="text-sm"
          >
            Switch to Basic View
          </Button>
        </div>

        <EnhancedUserManagement 
          currentUserRole={userRole}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            Basic User Management
          </h2>
          {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <Button
              variant="outline"
              onClick={() => setUseEnhancedView(true)}
              className="text-sm"
            >
              Switch to Enhanced View
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          {/* Main filters row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-48"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="DATA_ENTRY">Data Entry</option>
              <option value="AUDITOR">Auditor</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-48"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>

            <Button
              variant="ghost"
              onClick={fetchUsers}
              className="w-full md:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={handleAddUser}
                className="flex-shrink-0"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex-shrink-0"
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>

              <Button
                variant="ghost"
                onClick={handleExportUsers}
                className="flex-shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <span>{selectedUsers.size} selected</span>
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

          {/* Bulk actions panel */}
          {showBulkActions && (
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 self-center">
                  Bulk Actions:
                </span>
                
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleBulkActivate(true)}
                  disabled={selectedUsers.size === 0 || bulkActionLoading}
                  isLoading={bulkActionLoading}
                >
                  Activate Selected
                </Button>

                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleBulkActivate(false)}
                  disabled={selectedUsers.size === 0 || bulkActionLoading}
                  isLoading={bulkActionLoading}
                >
                  Deactivate Selected
                </Button>

                <Select
                  value=""
                  onChange={(e) => e.target.value && handleBulkRoleChange(e.target.value as UserRole)}
                  className="w-48"
                  disabled={selectedUsers.size === 0 || bulkActionLoading}
                >
                  <option value="">Change Role...</option>
                  <option value="DATA_ENTRY">Data Entry</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Permissions Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setIsPermissionsModalOpen(true)}
        >
          View Role Permissions
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-500 dark:text-secondary-400">
              No users found
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {users.map((user) => (
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
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.isActive ? "success" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {user._count && (
                          <div>
                            <div>{user._count.inventoryItems} entries</div>
                            <div>{user._count.auditLogs} actions</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.isActive ? "danger" : "success"}
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
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
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSaved={handleUserSaved}
      />

      {/* Role Permissions Modal */}
      <RolePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
}
