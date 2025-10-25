"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { AuditAction } from "@prisma/client";

interface FilterState {
  userId: string;
  action: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

interface AuditLogFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableUsers: Array<{ id: string; name: string; email: string }>;
  availableEntityTypes: string[];
}

export function AuditLogFilters({
  filters,
  onFiltersChange,
  availableUsers,
  availableEntityTypes,
}: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleUserChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, userId: value }));
  };

  const handleActionChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, action: value }));
  };

  const handleEntityTypeChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, entityType: value }));
  };

  const handleStartDateChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, startDate: value }));
  };

  const handleEndDateChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, endDate: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      userId: "",
      action: "",
      entityType: "",
      startDate: "",
      endDate: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const setDatePreset = (preset: "today" | "week" | "month" | "year") => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    let startDate = "";

    switch (preset) {
      case "today":
        startDate = endDate;
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split("T")[0];
        break;
    }

    setLocalFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const hasActiveFilters =
    localFilters.userId ||
    localFilters.action ||
    localFilters.entityType ||
    localFilters.startDate ||
    localFilters.endDate;

  const auditActions: AuditAction[] = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "EXPORT",
    "VIEW",
  ];

  return (
    <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800 p-6">
      <div className="space-y-6">
        {/* User Filter */}
        <div>
          <Select
            value={localFilters.userId}
            onChange={(e) => handleUserChange(e.target.value)}
            label="User"
          >
            <option value="">All Users</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </Select>
        </div>

        {/* Action Filter */}
        <div>
          <Select
            value={localFilters.action}
            onChange={(e) => handleActionChange(e.target.value)}
            label="Action"
          >
            <option value="">All Actions</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <Select
            value={localFilters.entityType}
            onChange={(e) => handleEntityTypeChange(e.target.value)}
            label="Entity Type"
          >
            <option value="">All Entity Types</option>
            {availableEntityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              label="From"
            />
            <Input
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              label="To"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("today")}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("week")}
            >
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("month")}
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDatePreset("year")}
            >
              Last Year
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-800">
          <Button onClick={handleApply} variant="primary" className="flex-1">
            Apply Filters
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasActiveFilters}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
