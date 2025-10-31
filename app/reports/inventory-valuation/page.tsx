'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { generateInventoryValuationReport, type InventoryValuationReport } from '@/services/reports/predefined';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui/badge';

export default function InventoryValuationReportPage() {
  const [report, setReport] = useState<InventoryValuationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await generateInventoryValuationReport();
      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Inventory Valuation Report</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.totalQuantity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(report.summary.totalValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(report.summary.totalCost)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Potential Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(report.summary.potentialProfit)}</p>
            </CardContent>
          </Card>
        </div>

        {/* By Category */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-right py-2 px-4">Items</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">Value</th>
                  <th className="text-right py-2 px-4">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {report.byCategory.map((cat, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{cat.category}</td>
                    <td className="text-right py-2 px-4">{cat.itemCount}</td>
                    <td className="text-right py-2 px-4">{cat.quantity}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(cat.value)}</td>
                    <td className="text-right py-2 px-4">{formatPercentage(cat.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        {report.lowStockItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">SKU</th>
                    <th className="text-left py-2 px-4">Product Name</th>
                    <th className="text-right py-2 px-4">Current</th>
                    <th className="text-right py-2 px-4">Reorder Level</th>
                    <th className="text-right py-2 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lowStockItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{item.sku}</td>
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="text-right py-2 px-4">{item.quantity}</td>
                      <td className="text-right py-2 px-4">{item.reorderLevel}</td>
                      <td className="text-right py-2 px-4">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Expiring Items */}
        {report.expiringItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Expiring Items (Next 90 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">SKU</th>
                    <th className="text-left py-2 px-4">Product Name</th>
                    <th className="text-right py-2 px-4">Quantity</th>
                    <th className="text-right py-2 px-4">Expiry Date</th>
                    <th className="text-right py-2 px-4">Days Until Expiry</th>
                    <th className="text-right py-2 px-4">Value at Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expiringItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{item.sku}</td>
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="text-right py-2 px-4">{item.quantity}</td>
                      <td className="text-right py-2 px-4">{formatDate(item.expiryDate)}</td>
                      <td className="text-right py-2 px-4">
                        <Badge variant={item.daysUntilExpiry < 30 ? 'destructive' : 'secondary'}>
                          {item.daysUntilExpiry} days
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-4">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
