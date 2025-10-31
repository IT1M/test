"use client";

import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down';
  icon?: React.ReactNode | LucideIcon;
  iconColor?: string;
  loading?: boolean;
  className?: string;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  trend,
  icon,
  iconColor = "text-primary",
  loading = false,
  className,
  subtitle,
  variant = 'default',
}: StatCardProps) {
  const isPositive = trend === 'up' || (change !== undefined && change >= 0);
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  const variantColors = {
    default: 'text-blue-600',
    warning: 'text-yellow-600',
    success: 'text-green-600',
    danger: 'text-red-600',
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardTitle>
          {Icon && (
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          )}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={cn(variantColors[variant])}>
            {typeof icon === 'function' ? React.createElement(icon as LucideIcon, { className: "h-4 w-4" }) : icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== undefined && change !== 0 && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <TrendIcon
              className={cn(
                "mr-1 h-3 w-3",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            />
            <span
              className={cn(
                "font-medium",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="ml-1">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton component for loading state
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

// Grid container for stat cards
export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
