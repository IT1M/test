'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateProfitLossStatement, type ProfitLossStatement } from '@/services/reports/predefined';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function ProfitLossReportPage() {
  const [report, setReport] = useState<ProfitLossStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'current' | 'last' | 'quarter'>('current');

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (period === 'current') {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
      } else if (period === 'last') {
        const lastMonth = subMonths(new Date(), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
      } else {
        startDate = startOfMonth(subMonths(new Date(), 2));
        endDate = endOfMonth(new Date());
      }

      const data = await generateProfitLossStatement(startDate, endDate);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
            </div>
            <div className="flex gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="current">Current Month</option>
                <option value="last">Last Month</option>
                <option value="quarter">Last 3 Months</option>
              </select>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Period: {report.period.description}</CardTitle>
          </CardHeader>
        </Card>

        {/* Revenue Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span>Gross Sales</span>
                <span className="font-semibold">{formatCurrency(report.revenue.grossSales)}</span>
              </div>
              <div className="flex justify-between py-2 text-red-600">
                <span className="pl-4">Less: Returns</span>
                <span>({formatCurrency(report.revenue.returns)})</span>
              </div>
              <div className="flex justify-between py-2 text-red-600">
                <span className="pl-4">Less: Discounts</span>
                <span>({formatCurrency(report.revenue.discounts)})</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold">
                <span>Net Sales</span>
                <span>{formatCurrency(report.revenue.netSales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost of Goods Sold */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cost of Goods Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span>Beginning Inventory</span>
                <span className="font-semibold">{formatCurrency(report.costOfGoodsSold.beginningInventory)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="pl-4">Add: Purchases</span>
                <span>{formatCurrency(report.costOfGoodsSold.purchases)}</span>
              </div>
              <div className="flex justify-between py-2 text-red-600">
                <span className="pl-4">Less: Ending Inventory</span>
                <span>({formatCurrency(report.costOfGoodsSold.endingInventory)})</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold">
                <span>Total COGS</span>
                <span>{formatCurrency(report.costOfGoodsSold.totalCOGS)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-b-2">
                <span>Gross Profit</span>
                <span className="text-green-600">{formatCurrency(report.grossProfit)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Gross Profit Margin</span>
                <span>{formatPercentage(report.grossProfitMargin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Expenses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span>Salaries & Wages</span>
                <span>{formatCurrency(report.operatingExpenses.salaries)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Rent</span>
                <span>{formatCurrency(report.operatingExpenses.rent)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Utilities</span>
                <span>{formatCurrency(report.operatingExpenses.utilities)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Marketing</span>
                <span>{formatCurrency(report.operatingExpenses.marketing)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Other Expenses</span>
                <span>{formatCurrency(report.operatingExpenses.other)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold">
                <span>Total Operating Expenses</span>
                <span>{formatCurrency(report.operatingExpenses.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between py-2 font-bold">
                <span>Operating Income</span>
                <span>{formatCurrency(report.operatingIncome)}</span>
              </div>
              <div className="flex justify-between py-3 text-xl font-bold border-t-4 border-b-4">
                <span>Net Income</span>
                <span className={report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(report.netIncome)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Net Profit Margin</span>
                <span>{formatPercentage(report.netProfitMargin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
