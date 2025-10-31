'use client';

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your Medical Products Management System
          </p>
        </div>
        <QuickActions />
      </div>
      
      <DashboardStats />
      <DashboardCharts />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrdersTable />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Insights & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <AIInsightsPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
