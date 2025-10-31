'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { InventoryStatusChart } from "@/components/dashboard/InventoryStatusChart";

export type PeriodType = 'daily' | 'weekly' | 'monthly';

export function DashboardCharts() {
  const [period, setPeriod] = useState<PeriodType>('daily');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart period={period} />
        </CardContent>
      </Card>

      {/* Top Selling Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <TopProductsChart period={period} />
        </CardContent>
      </Card>

      {/* Inventory Status Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Inventory Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryStatusChart />
        </CardContent>
      </Card>
    </div>
  );
}
