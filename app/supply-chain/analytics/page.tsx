'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, Package, AlertTriangle, CheckCircle, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SupplierService } from '@/services/database/suppliers';
import { SupplierIntelligenceService } from '@/services/gemini/supplier-intelligence';
import type { Supplier } from '@/types/database';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SupplyChainAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [portfolioOptimization, setPortfolioOptimization] = useState<any>(null);
  const [loadingOptimization, setLoadingOptimization] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, suppliersData] = await Promise.all([
        SupplierService.getSupplierStats(),
        SupplierService.getSuppliers(),
      ]);

      setStats(statsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioOptimization = async () => {
    try {
      setLoadingOptimization(true);
      const optimization = await SupplierIntelligenceService.optimizeSupplierPortfolio();
      setPortfolioOptimization(optimization);
    } catch (error) {
      console.error('Error loading portfolio optimization:', error);
    } finally {
      setLoadingOptimization(false);
    }
  };

  // Calculate lead time analytics
  const leadTimeData = suppliers.reduce((acc, s) => {
    const range = s.leadTime <= 15 ? '0-15 days' :
                  s.leadTime <= 30 ? '16-30 days' :
                  s.leadTime <= 45 ? '31-45 days' : '46+ days';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leadTimeChartData = Object.entries(leadTimeData).map(([range, count]) => ({
    range,
    count,
  }));

  // Calculate on-time delivery rates (simulated based on delivery scores)
  const onTimeDeliveryData = suppliers.map(s => ({
    name: s.name.substring(0, 20),
    rate: s.deliveryScore,
  })).sort((a, b) => b.rate - a.rate).slice(0, 10);

  // Calculate supply chain costs (simulated)
  const costBreakdownData = [
    { category: 'Product Costs', value: 65, color: '#3b82f6' },
    { category: 'Shipping', value: 15, color: '#10b981' },
    { category: 'Customs & Duties', value: 8, color: '#f59e0b' },
    { category: 'Quality Control', value: 7, color: '#8b5cf6' },
    { category: 'Administrative', value: 5, color: '#ef4444' },
  ];

  // Performance by supplier type
  const performanceByTypeData = Object.entries(stats?.byType || {}).map(([type, count]) => {
    const typeSuppliers = suppliers.filter(s => s.type === type);
    const avgScore = typeSuppliers.reduce((sum, s) => sum + s.overallScore, 0) / typeSuppliers.length || 0;
    return {
      type: type.replace('-', ' '),
      count,
      avgScore: Math.round(avgScore),
    };
  });

  // Risk distribution
  const riskData = [
    { level: 'Low Risk', count: suppliers.filter(s => s.overallScore >= 80).length, color: '#10b981' },
    { level: 'Medium Risk', count: suppliers.filter(s => s.overallScore >= 60 && s.overallScore < 80).length, color: '#f59e0b' },
    { level: 'High Risk', count: suppliers.filter(s => s.overallScore < 60).length, color: '#ef4444' },
  ];

  const avgLeadTime = suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length || 0;
  const avgDeliveryScore = suppliers.reduce((sum, s) => sum + s.deliveryScore, 0) / suppliers.length || 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Supply Chain Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor and optimize your supply chain performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Lead Time</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-500" />
              {avgLeadTime.toFixed(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>On-Time Delivery Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
              {avgDeliveryScore.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">average across all suppliers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Suppliers</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <Package className="w-6 h-6 mr-2 text-purple-500" />
              {stats?.active || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {stats?.preferred || 0} preferred
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Risk Suppliers</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
              {riskData[2]?.count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">require immediate attention</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Time Distribution</CardTitle>
                <CardDescription>Supplier count by lead time range</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadTimeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Risk Distribution</CardTitle>
                <CardDescription>Based on performance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.level}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Supplier Type</CardTitle>
                <CardDescription>Average scores and supplier count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Supplier Count" />
                    <Bar yAxisId="right" dataKey="avgScore" fill="#10b981" name="Avg Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Suppliers by country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats?.byCountry || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${((count as number) / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count as number}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Suppliers by On-Time Delivery</CardTitle>
              <CardDescription>Delivery performance scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={onTimeDeliveryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#10b981" name="Delivery Score %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest rated suppliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers
                    .filter(s => s.status === 'active')
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map(supplier => (
                      <div key={supplier.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{supplier.name}</div>
                          <div className="text-xs text-gray-600">{supplier.type}</div>
                        </div>
                        <Badge variant="default">{supplier.rating.toFixed(1)}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Needs Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-orange-500" />
                  Needs Improvement
                </CardTitle>
                <CardDescription>Lowest performing suppliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers
                    .filter(s => s.status === 'active')
                    .sort((a, b) => a.overallScore - b.overallScore)
                    .slice(0, 5)
                    .map(supplier => (
                      <div key={supplier.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{supplier.name}</div>
                          <div className="text-xs text-gray-600">{supplier.type}</div>
                        </div>
                        <Badge variant="destructive">{supplier.overallScore}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Fastest Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Fastest Delivery
                </CardTitle>
                <CardDescription>Shortest lead times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers
                    .filter(s => s.status === 'active')
                    .sort((a, b) => a.leadTime - b.leadTime)
                    .slice(0, 5)
                    .map(supplier => (
                      <div key={supplier.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{supplier.name}</div>
                          <div className="text-xs text-gray-600">{supplier.type}</div>
                        </div>
                        <Badge variant="outline">{supplier.leadTime}d</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Supply Chain Cost Breakdown</CardTitle>
                <CardDescription>Distribution of supply chain costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.category}: ${entry.value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Opportunities</CardTitle>
                <CardDescription>Potential savings areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <div className="font-medium">Negotiate Better Payment Terms</div>
                      <div className="text-sm text-gray-600">
                        {suppliers.filter(s => s.paymentTerms === 'Net 30').length} suppliers on Net 30 could be extended to Net 60
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <div className="font-medium">Consolidate Shipments</div>
                      <div className="text-sm text-gray-600">
                        Combine orders from {Object.keys(stats?.byCountry || {}).length} countries to reduce shipping costs
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <div className="font-medium">Volume Discounts</div>
                      <div className="text-sm text-gray-600">
                        Increase order quantities with top {stats?.preferred || 0} preferred suppliers
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Portfolio Optimization</CardTitle>
              <CardDescription>
                Get intelligent recommendations to optimize your supplier portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!portfolioOptimization ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Run AI analysis to get personalized recommendations for your supplier portfolio
                  </p>
                  <button
                    onClick={loadPortfolioOptimization}
                    disabled={loadingOptimization}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingOptimization ? 'Analyzing...' : 'Run AI Analysis'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Analysis Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">AI Analysis Summary</h3>
                    <p className="text-sm text-blue-800">{portfolioOptimization.analysis}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Promote */}
                    {portfolioOptimization.recommendations.suppliersToPromote.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                            Promote to Preferred
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {portfolioOptimization.recommendations.suppliersToPromote.map((item: any) => (
                              <div key={item.supplier.id} className="border-b pb-2 last:border-0">
                                <div className="font-medium text-sm">{item.supplier.name}</div>
                                <div className="text-xs text-gray-600 mt-1">{item.reason}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Review */}
                    {portfolioOptimization.recommendations.suppliersToReview.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                            Needs Review
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {portfolioOptimization.recommendations.suppliersToReview.map((item: any) => (
                              <div key={item.supplier.id} className="border-b pb-2 last:border-0">
                                <div className="font-medium text-sm">{item.supplier.name}</div>
                                <div className="text-xs text-gray-600 mt-1">{item.reason}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Demote */}
                    {portfolioOptimization.recommendations.suppliersToDemote.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                            Consider Demoting
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {portfolioOptimization.recommendations.suppliersToDemote.map((item: any) => (
                              <div key={item.supplier.id} className="border-b pb-2 last:border-0">
                                <div className="font-medium text-sm">{item.supplier.name}</div>
                                <div className="text-xs text-gray-600 mt-1">{item.reason}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Diversification Needs */}
                  {portfolioOptimization.recommendations.diversificationNeeds.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Diversification Opportunities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {portfolioOptimization.recommendations.diversificationNeeds.map((need: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span className="text-sm">{need}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
