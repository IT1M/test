'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('month');

  const kpiData = [
    {
      title: 'إجمالي الإيرادات',
      value: '2,450,000 ر.س',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'عدد العملاء',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'المخزون',
      value: '5,678',
      change: '-3.1%',
      trend: 'down',
      icon: Package,
    },
    {
      title: 'معدل النمو',
      value: '15.8%',
      change: '+2.4%',
      trend: 'up',
      icon: Activity,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحليلات المتقدمة</h1>
          <p className="text-muted-foreground">تحليلات شاملة وتقارير تنفيذية</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">أسبوع</option>
            <option value="month">شهر</option>
            <option value="quarter">ربع سنوي</option>
            <option value="year">سنة</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs flex items-center gap-1 ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-3 w-3" />
                  {kpi.change} من الفترة السابقة
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">التحليل المالي</TabsTrigger>
          <TabsTrigger value="sales">تحليل المبيعات</TabsTrigger>
          <TabsTrigger value="inventory">تحليل المخزون</TabsTrigger>
          <TabsTrigger value="customers">تحليل العملاء</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  الإيرادات والمصروفات
                </CardTitle>
                <CardDescription>مقارنة شهرية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  [رسم بياني للإيرادات والمصروفات]
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع الإيرادات
                </CardTitle>
                <CardDescription>حسب الفئة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  [رسم دائري لتوزيع الإيرادات]
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                اتجاهات المبيعات
              </CardTitle>
              <CardDescription>تحليل أداء المبيعات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                [رسم بياني خطي لاتجاهات المبيعات]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل المخزون</CardTitle>
              <CardDescription>حالة المخزون والتنبؤات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                [تحليل مستويات المخزون]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل العملاء</CardTitle>
              <CardDescription>سلوك العملاء والتقسيم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                [تحليل بيانات العملاء]
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
